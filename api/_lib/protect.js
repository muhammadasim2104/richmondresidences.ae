const { env, PROJECT_SLUG, supabaseUrl, supabaseSecret } = require("./config");
const { checkRateLimit, peekRateLimit } = require("./context");

/** Enquire: 5 attempts / IP / hour. */
const ENQUIRE_PER_IP = 5;
const ENQUIRE_PER_IP_WINDOW_MS = 60 * 60 * 1000;
/** Enquire: 20 attempts / hour globally (all countries). */
const ENQUIRE_GLOBAL_BURST = 20;
const ENQUIRE_GLOBAL_WINDOW_MS = 60 * 60 * 1000;

/** US enquire: 1 attempt / IP / hour. */
const US_ENQUIRE_PER_IP = 1;
const US_ENQUIRE_PER_IP_WINDOW_MS = 60 * 60 * 1000;
/** US enquire: 2 successful leads / 10 minutes globally. */
const US_SUCCESS_LIMIT = 2;
const US_SUCCESS_WINDOW_MS = 10 * 60 * 1000;

/**
 * US burst circuit: 10 unique US IPs OR 10 US hits (page_view + enquire)
 * in a rolling 2-minute window → block further US enquire until it cools.
 */
const US_BURST_THRESHOLD = 10;
const US_BURST_WINDOW_MS = 2 * 60 * 1000;

const usHits = [];
let supabaseWindowsMissing = false;

function parseCountryList(raw) {
  return new Set(
    String(raw || "")
      .split(/[\s,]+/)
      .map((code) => code.trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code)),
  );
}

function blockedCountries() {
  return parseCountryList(env("BLOCK_COUNTRIES"));
}

function challengeCountries() {
  return parseCountryList(env("CHALLENGE_COUNTRIES") || "US");
}

function isBlockedCountry(country) {
  return Boolean(country && blockedCountries().has(country));
}

function isChallengeCountry(country) {
  return Boolean(country && challengeCountries().has(country));
}

function isUs(country) {
  return country === "US";
}

function logProtect(reason, extra) {
  console.warn("[parks:protect]", { reason, ...extra });
}

function pruneUsHits(now) {
  const cutoff = now - US_BURST_WINDOW_MS;
  while (usHits.length && usHits[0].t < cutoff) usHits.shift();
  if (usHits.length > 400) usHits.splice(0, usHits.length - 400);
}

function memoryBurst() {
  const now = Date.now();
  pruneUsHits(now);
  const unique = new Set(usHits.map((hit) => hit.hash)).size;
  const count = usHits.length;
  const oldest = usHits[0];
  const retryAfterSec = oldest
    ? Math.max(1, Math.ceil((oldest.t + US_BURST_WINDOW_MS - now) / 1000))
    : 60;
  return {
    unique,
    count,
    tripped: unique >= US_BURST_THRESHOLD || count >= US_BURST_THRESHOLD,
    retryAfterSec,
  };
}

function recordUsHit(kind, ipHash) {
  const now = Date.now();
  usHits.push({ t: now, hash: ipHash || "unknown", kind: kind || "hit" });
  pruneUsHits(now);
  persistUsHit(ipHash).catch(() => {});
  return memoryBurst();
}

async function persistUsHit(ipHash) {
  const url = supabaseUrl();
  const key = supabaseSecret();
  if (!url || !key || supabaseWindowsMissing) return;
  const windowKey = `us_burst:${PROJECT_SLUG}`;
  const now = Date.now();
  const resetAt = new Date(now + US_BURST_WINDOW_MS).toISOString();
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/rate_limit_windows`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const existing = await fetch(
    `${endpoint}?key=eq.${encodeURIComponent(windowKey)}&select=key,count,unique_ips,reset_at`,
    { headers, signal: AbortSignal.timeout(800) },
  );
  if (existing.status === 404 || existing.status === 406) {
    supabaseWindowsMissing = true;
    return;
  }
  if (!existing.ok) return;

  const rows = await existing.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  const stillOpen = row && row.reset_at && new Date(row.reset_at).getTime() > now;
  const ips = stillOpen && Array.isArray(row.unique_ips) ? row.unique_ips.slice() : [];
  if (ipHash && !ips.includes(ipHash)) ips.push(ipHash);
  const count = stillOpen ? Number(row.count || 0) + 1 : 1;
  const payload = {
    key: windowKey,
    count,
    unique_ips: ips.slice(-50),
    reset_at: stillOpen ? row.reset_at : resetAt,
  };

  const write = await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(800),
  });
  if (write.status === 404 || write.status === 406) {
    supabaseWindowsMissing = true;
  }
}

async function storedBurst() {
  const url = supabaseUrl();
  const key = supabaseSecret();
  if (!url || !key) return null;

  const since = new Date(Date.now() - US_BURST_WINDOW_MS).toISOString();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  if (!supabaseWindowsMissing) {
    try {
      const windowKey = `us_burst:${PROJECT_SLUG}`;
      const res = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/rate_limit_windows?key=eq.${encodeURIComponent(windowKey)}&select=count,unique_ips,reset_at`,
        { headers, signal: AbortSignal.timeout(800) },
      );
      if (res.status === 404 || res.status === 406) {
        supabaseWindowsMissing = true;
      } else if (res.ok) {
        const rows = await res.json().catch(() => []);
        const row = Array.isArray(rows) ? rows[0] : null;
        if (row && row.reset_at && new Date(row.reset_at).getTime() > Date.now()) {
          const unique = Array.isArray(row.unique_ips) ? row.unique_ips.length : 0;
          return { unique, count: Number(row.count || 0) };
        }
      }
    } catch {
      // Fall through to analytics_events.
    }
  }

  try {
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/analytics_events?select=metadata&project_slug=eq.${encodeURIComponent(PROJECT_SLUG)}&created_at=gte.${encodeURIComponent(since)}&limit=80`,
      { headers, signal: AbortSignal.timeout(800) },
    );
    if (!res.ok) return null;
    const rows = await res.json().catch(() => []);
    const hashes = new Set();
    let count = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      const client = row && row.metadata && row.metadata.client;
      if (!client || client.country !== "US") continue;
      count += 1;
      if (client.ip_hash) hashes.add(client.ip_hash);
      else if (client.ip) hashes.add(client.ip);
    }
    return { unique: hashes.size, count };
  } catch {
    return null;
  }
}

async function usBurstStatus() {
  const mem = memoryBurst();
  const stored = await storedBurst();
  const unique = Math.max(mem.unique, stored?.unique || 0);
  const count = Math.max(mem.count, stored?.count || 0);
  return {
    unique,
    count,
    tripped: unique >= US_BURST_THRESHOLD || count >= US_BURST_THRESHOLD,
    retryAfterSec: mem.retryAfterSec,
    source: stored ? "memory+store" : "memory",
  };
}

function checkEnquireIpLimit(country, ipHash) {
  if (isUs(country)) {
    return checkRateLimit(`enquire:us:${ipHash}`, US_ENQUIRE_PER_IP, US_ENQUIRE_PER_IP_WINDOW_MS);
  }
  return checkRateLimit(`enquire:${ipHash}`, ENQUIRE_PER_IP, ENQUIRE_PER_IP_WINDOW_MS);
}

function checkEnquireGlobalBurst() {
  return checkRateLimit("enquire:global", ENQUIRE_GLOBAL_BURST, ENQUIRE_GLOBAL_WINDOW_MS);
}

function peekUsSuccessCap() {
  return peekRateLimit("enquire:us:success", US_SUCCESS_LIMIT, US_SUCCESS_WINDOW_MS);
}

function hitUsSuccessCap() {
  return checkRateLimit("enquire:us:success", US_SUCCESS_LIMIT, US_SUCCESS_WINDOW_MS);
}

module.exports = {
  ENQUIRE_PER_IP,
  ENQUIRE_PER_IP_WINDOW_MS,
  ENQUIRE_GLOBAL_BURST,
  ENQUIRE_GLOBAL_WINDOW_MS,
  US_ENQUIRE_PER_IP,
  US_ENQUIRE_PER_IP_WINDOW_MS,
  US_SUCCESS_LIMIT,
  US_SUCCESS_WINDOW_MS,
  US_BURST_THRESHOLD,
  US_BURST_WINDOW_MS,
  blockedCountries,
  challengeCountries,
  isBlockedCountry,
  isChallengeCountry,
  isUs,
  logProtect,
  recordUsHit,
  usBurstStatus,
  checkEnquireIpLimit,
  checkEnquireGlobalBurst,
  peekUsSuccessCap,
  hitUsSuccessCap,
};
