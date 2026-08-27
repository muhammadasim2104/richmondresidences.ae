const crypto = require("crypto");

const INVALID_GEO = new Set(["XX", "T1", "EU", "A1", "A2", "O1"]);
const IP_HASH_SALT = "richmond-residences";

function header(req, name) {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function firstIp(raw) {
  if (!raw) return null;
  const part = String(raw).split(",")[0].trim();
  if (!part || part === "unknown" || part === "local") return null;
  return part.replace(/^\[([^\]]+)\](?::\d+)?$/, "$1").slice(0, 64);
}

function geoCode(raw) {
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  if (!code || INVALID_GEO.has(code) || !/^[A-Z]{2}$/.test(code)) return null;
  return code;
}

function parseUserAgent(ua) {
  if (!ua) {
    return { browser: null, os: null, device: null, deviceName: null };
  }
  const s = String(ua);
  let device = "desktop";
  if (/iPad/i.test(s) || /Tablet/i.test(s) || (/Android/i.test(s) && !/Mobile/i.test(s))) {
    device = "tablet";
  } else if (/Mobi|iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(s)) {
    device = "mobile";
  }

  let os = null;
  if (/Windows NT/i.test(s)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/CrOS/i.test(s)) os = "Chrome OS";
  else if (/Linux/i.test(s)) os = "Linux";

  let browser = null;
  if (/Edg\//i.test(s) || /EdgiOS/i.test(s)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/SamsungBrowser/i.test(s)) browser = "Samsung Internet";
  else if (/Firefox|FxiOS/i.test(s)) browser = "Firefox";
  else if (/Chrome|CriOS|Chromium/i.test(s)) browser = "Chrome";
  else if (/Safari/i.test(s)) browser = "Safari";

  let deviceName = null;
  if (/iPhone/i.test(s)) deviceName = "iPhone";
  else if (/iPad/i.test(s)) deviceName = "iPad";
  else if (/Macintosh|Mac OS X/i.test(s)) deviceName = "Mac";

  return { browser, os, device, deviceName };
}

function clientContext(req) {
  const ua = header(req, "user-agent");
  const parsed = parseUserAgent(ua);
  return {
    ip:
      firstIp(header(req, "x-real-ip")) ||
      firstIp(header(req, "x-vercel-forwarded-for")) ||
      firstIp(header(req, "x-forwarded-for")),
    country: geoCode(
      header(req, "x-vercel-ip-country") || header(req, "cf-ipcountry"),
    ),
    region: header(req, "x-vercel-ip-country-region") || null,
    city: header(req, "x-vercel-ip-city") || null,
    timezone: header(req, "x-vercel-ip-timezone") || null,
    browser: parsed.browser,
    os: parsed.os,
    device: parsed.device,
    device_name: parsed.deviceName,
    user_agent: ua ? String(ua).slice(0, 300) : null,
  };
}

function isHoneypotFilled(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value);
}

function hashIp(ip) {
  return crypto
    .createHash("sha256")
    .update(`${IP_HASH_SALT}|${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 16);
}

/** Country + IP hash for dashboard/ingest. Never include the raw IP. */
function dashboardClient(client) {
  if (!client || typeof client !== "object") return null;
  const ip_hash = client.ip_hash || hashIp(client.ip);
  return {
    country: client.country || null,
    ip_hash,
    ip: ip_hash,
    region: client.region || null,
    city: client.city || null,
    timezone: client.timezone || null,
    browser: client.browser || null,
    os: client.os || null,
    device: client.device || null,
    device_name: client.device_name || null,
    user_agent: client.user_agent || null,
  };
}

const buckets = new Map();

function inspectRateLimit(key, limit, windowMs, increment) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    if (increment) buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, count: increment ? 1 : 0, retryAfterSec: 0 };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      count: existing.count,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  if (increment) existing.count += 1;
  return { ok: true, count: existing.count, retryAfterSec: 0 };
}

function checkRateLimit(key, limit, windowMs) {
  return inspectRateLimit(key, limit, windowMs, true);
}

function peekRateLimit(key, limit, windowMs) {
  return inspectRateLimit(key, limit, windowMs, false);
}

function readJson(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  if (status === 429 && payload && payload.retryAfterSec) {
    res.setHeader("Retry-After", String(payload.retryAfterSec));
  }
  if (status === 204) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = {
  clientContext,
  isHoneypotFilled,
  hashIp,
  dashboardClient,
  checkRateLimit,
  peekRateLimit,
  readJson,
  json,
  geoCode,
  header,
};
