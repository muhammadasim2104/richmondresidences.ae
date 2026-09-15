const fs = require("fs");
const path = require("path");
const { parseSitemapXml, indexUrls, siteUrl } = require("./_lib/bing-index");
const { json, readJson } = require("./_lib/context");

const ROOT = path.join(__dirname, "..");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST" && req.method !== "GET") {
    json(res, 405, { ok: false });
    return;
  }

  const cronSecret = process.env.CRON_SECRET || process.env.BING_INDEX_CRON_SECRET;
  if (cronSecret) {
    const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const querySecret = new URL(req.url || "/", "http://localhost").searchParams.get("secret");
    let bodySecret = "";
    if (req.method === "POST") {
      try {
        const body = await readJson(req);
        bodySecret = String(body?.secret || "");
      } catch {
        bodySecret = "";
      }
    }
    if (auth !== cronSecret && querySecret !== cronSecret && bodySecret !== cronSecret) {
      json(res, 401, { ok: false, message: "Unauthorized" });
      return;
    }
  }

  if (!fs.existsSync(SITEMAP_PATH)) {
    json(res, 500, { ok: false, message: "sitemap.xml missing" });
    return;
  }

  const xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  const urls = parseSitemapXml(xml, siteUrl());
  const result = await indexUrls(urls);
  json(res, result.ok || result.skipped ? 200 : 502, {
    ok: Boolean(result.ok || result.skipped),
    urlCount: urls.length,
    ...result,
  });
};
