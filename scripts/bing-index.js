#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { parseSitemapXml, indexUrls, siteUrl } = require("../api/_lib/bing-index");

const ROOT = path.join(__dirname, "..");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");

function loadEnvFile(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error("[bing:index] sitemap.xml not found — run npm run generate first.");
    process.exit(1);
  }

  const xml = fs.readFileSync(SITEMAP_PATH, "utf8");
  const base = siteUrl();
  const urls = parseSitemapXml(xml, base);
  if (!urls.length) {
    console.error("[bing:index] no URLs found in sitemap.xml");
    process.exit(1);
  }

  const hasKeys =
    Boolean(process.env.INDEXNOW_KEY || process.env.BING_INDEXNOW_KEY) ||
    Boolean(process.env.BING_WEBMASTER_API_KEY || process.env.BING_API_KEY);

  if (!hasKeys) {
    console.log("[bing:index] skipped — set INDEXNOW_KEY and/or BING_WEBMASTER_API_KEY in env.");
    process.exit(0);
  }

  console.log(`[bing:index] submitting ${urls.length} URL(s) from sitemap to Bing/IndexNow…`);
  const result = await indexUrls(urls);

  for (const entry of result.results || []) {
    const label = entry.provider || "provider";
    if (entry.ok) {
      console.log(`[bing:index] ${label}: ok (${entry.count || urls.length} URL(s), status ${entry.status || "n/a"})`);
    } else {
      console.warn(`[bing:index] ${label}: failed`, entry.body || entry.results || entry);
    }
  }

  if (!result.ok && !result.skipped) {
    process.exitCode = 1;
    return;
  }

  console.log("[bing:index] done.");
}

main().catch((err) => {
  console.error("[bing:index] error:", err);
  process.exit(1);
});
