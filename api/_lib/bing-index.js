"use strict";

const DEFAULT_SITE_URL = "https://richmondresidences.ae";

function env(name, fallback = "") {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function siteUrl() {
  return env("BING_SITE_URL", DEFAULT_SITE_URL).replace(/\/$/, "");
}

function siteHost() {
  return new URL(siteUrl()).host;
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

function parseSitemapXml(xml, baseUrl) {
  const base = baseUrl.replace(/\/$/, "");
  const urls = [];
  for (const match of String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = String(match[1] || "").trim();
    if (!url.startsWith(base)) continue;
    urls.push(url);
  }
  return [...new Set(urls)];
}

async function postJson(url, body, extraHeaders = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: response.ok, status: response.status, text, json };
}

async function submitIndexNow(urlList, key) {
  const host = siteHost();
  const keyLocation = `${siteUrl()}/${key}.txt`;
  const body = {
    host,
    key,
    keyLocation,
    urlList,
  };
  const endpoints = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];
  const results = [];
  for (const endpoint of endpoints) {
    try {
      const res = await postJson(endpoint, body);
      results.push({
        endpoint,
        ok: res.ok || res.status === 202,
        status: res.status,
        body: res.json || res.text.slice(0, 200),
      });
    } catch (err) {
      results.push({
        endpoint,
        ok: false,
        status: 0,
        body: String(err?.message || err).slice(0, 200),
      });
    }
  }
  const ok = results.some((entry) => entry.ok);
  return { ok, results };
}

async function submitBingUrlBatch(urlList, apiKey) {
  const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?apikey=${encodeURIComponent(apiKey)}`;
  const res = await postJson(endpoint, {
    siteUrl: siteUrl(),
    urlList,
  });
  const ok = res.ok && (!res.json?.ExceptionType || res.json?.d === null);
  return {
    ok,
    status: res.status,
    body: res.json || res.text.slice(0, 300),
  };
}

async function indexUrls(urlList) {
  const urls = [...new Set(urlList.filter(Boolean))];
  if (!urls.length) {
    return { ok: false, skipped: true, reason: "no-urls", results: [] };
  }

  const indexNowKey = env("INDEXNOW_KEY") || env("BING_INDEXNOW_KEY");
  const bingApiKey = env("BING_WEBMASTER_API_KEY") || env("BING_API_KEY");
  if (!indexNowKey && !bingApiKey) {
    return { ok: false, skipped: true, reason: "missing-keys", results: [] };
  }

  const results = [];

  if (indexNowKey) {
    for (const batch of chunk(urls, 10000)) {
      results.push({ provider: "indexnow", count: batch.length, ...(await submitIndexNow(batch, indexNowKey)) });
    }
  }

  if (bingApiKey) {
    for (const batch of chunk(urls, 500)) {
      results.push({ provider: "bing-webmaster", count: batch.length, ...(await submitBingUrlBatch(batch, bingApiKey)) });
    }
  }

  const ok = results.some((entry) => entry.ok);
  return { ok, skipped: false, urlCount: urls.length, results };
}

module.exports = {
  siteUrl,
  siteHost,
  parseSitemapXml,
  indexUrls,
  submitIndexNow,
  submitBingUrlBatch,
};
