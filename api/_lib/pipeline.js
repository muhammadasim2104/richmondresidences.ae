const crypto = require("crypto");
const {
  PROJECT_SLUG,
  PROJECT_NAME,
  SITE_HOST,
  SITE_KEY,
  SITE_URL,
  DEFAULT_AGENCY_INBOX,
  FUNNEL_EVENT_NAMES,
  env,
  agencyInbox,
  resendFrom,
  supabaseUrl,
  supabaseSecret,
} = require("./config");
const { dashboardClient } = require("./context");
const {
  buildLeadFields,
  leadNotifyHtml: brandedLeadNotifyHtml,
  leadNotifyText: brandedLeadNotifyText,
  formatCountryLabel,
} = require("./email-template");

const LEAD_DEDUPE_BUCKET_MS = 10 * 60 * 1000;
const LEAD_DEDUPE_TTL_MS = 15 * 60 * 1000;
const globalScope = globalThis;
const leadDedupeCache = globalScope.__parksLeadDedupeCache || new Map();
globalScope.__parksLeadDedupeCache = leadDedupeCache;

const EVENT_ALIASES = {
  register_click: "cta_click",
  form_submit_success: "form_success",
  form_submit_error: "form_error",
  floorplan_download: "brochure_download",
  nav_click: "cta_click",
  outbound_click: "cta_click",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHeader(value, maxLen = 200) {
  return String(value || "")
    .replace(/[\0\r\n]+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function mapEventName(name) {
  const raw = String(name || "").trim();
  const aliased = EVENT_ALIASES[raw] || raw;
  if (FUNNEL_EVENT_NAMES.has(aliased)) return aliased;
  return "cta_click";
}

function supabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseSecret());
}

function envFlag(name, fallback = false) {
  const value = String(env(name, fallback ? "1" : "") || "").trim().toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

async function supabaseInsert(table, row) {
  const url = supabaseUrl();
  const key = supabaseSecret();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text.slice(0, 400) || `Supabase ${table} insert failed`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
}

async function supabaseSelect(table, query = "") {
  const url = supabaseUrl();
  const key = supabaseSecret();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}${query}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text.slice(0, 400) || `Supabase ${table} select failed`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
  return response.json();
}

async function supabaseUpsert(table, row, onConflict) {
  const url = supabaseUrl();
  const key = supabaseSecret();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }
  const conflict = Array.isArray(onConflict) ? onConflict.join(",") : String(onConflict || "");
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}${conflict ? `?on_conflict=${encodeURIComponent(conflict)}` : ""}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text.slice(0, 400) || `Supabase ${table} upsert failed`);
    error.status = response.status;
    error.body = text;
    throw error;
  }
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function leadEmailContent({
  fullName,
  email,
  phone,
  projectName,
  productKey,
  interest,
  message,
  sourcePage,
  attribution,
  stamp,
  clientIp,
  submittedAt,
}) {
  const fields = buildLeadFields({
    fullName,
    email,
    phone,
    projectName,
    productKey,
    interest,
    message,
    sourcePage,
    attribution,
    stamp,
    clientIp,
    submittedAt,
  });
  const headline = "New project inquiry";
  const subhead = `${projectName} · ${fullName || "Visitor"}`;
  return {
    fields,
    html: brandedLeadNotifyHtml({
      headline,
      subhead,
      fields,
      footerNote:
        "A sales advisor should follow up with this lead promptly. Reply to contact the visitor — do not send an automatic reply.",
    }),
    text: brandedLeadNotifyText({
      headline,
      subhead,
      fields,
      footerNote:
        "A sales advisor should follow up with this lead promptly. Reply to contact the visitor — do not send an automatic reply.",
    }),
  };
}

async function notifyAgency(payload) {
  const apiKey = env("RESEND_API_KEY");
  const from = resendFrom();
  const visitorName = sanitizeHeader(payload.visitorName || "visitor", 80);
  const subject = sanitizeHeader(payload.subject || `${PROJECT_NAME} - New Lead`);
  const text = payload.text;
  const html = payload.html;
  const visitorEmail = looksLikeEmail(payload.replyTo) ? payload.replyTo.toLowerCase() : "";
  // Advisor inbox only. Never put the form submitter in `to` (no welcome / auto-reply).
  let to = agencyInbox();
  if (visitorEmail && to.toLowerCase() === visitorEmail && visitorEmail !== DEFAULT_AGENCY_INBOX) {
    to = DEFAULT_AGENCY_INBOX;
  }

  if (!apiKey) {
    console.info("[parks:email:mock] RESEND_API_KEY unset — agency notify not delivered", {
      to,
      subject,
    });
    return { mocked: true };
  }

  const body = {
    from: sanitizeHeader(from, 320),
    to: [sanitizeHeader(to, 320)],
    subject: sanitizeHeader(subject),
    html,
    text,
  };

  if (payload.replyTo && looksLikeEmail(payload.replyTo)) {
    body.reply_to = [sanitizeHeader(payload.replyTo.toLowerCase(), 320)];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error("[parks:email:leads]", {
      from,
      to,
      status: response.status,
      error: errBody.slice(0, 400),
    });
    throw new Error(errBody.slice(0, 400) || "Resend send failed");
  }
  const sent = await response.json().catch(() => ({}));
  console.info("[parks:email:sent]", {
    from,
    to,
    id: sent.id || null,
    subject,
  });
  return { mocked: false, id: sent.id || null };
}

function ingestConfigured() {
  return Boolean(env("UPSIDES_INGEST_URL") && env("UPSIDES_INGEST_KEY"));
}

function shouldForwardLeadsToIngest() {
  if (!ingestConfigured()) return false;
  if (envFlag("ENABLE_LEAD_INGEST_FORWARD")) return true;
  // When Supabase is not configured locally/satellite-only, ingest is the inbox sink.
  return !supabaseConfigured();
}

async function forwardIngest(path, body) {
  const base = env("UPSIDES_INGEST_URL").replace(/\/$/, "");
  const key = env("UPSIDES_INGEST_KEY");
  if (!base || !key) return null;
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-upsides-ingest-key": key,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest ${path} failed: ${text.slice(0, 300)}`);
  }
  return response.json().catch(() => ({ ok: true }));
}

function productLabel(product, productName) {
  if (productName) return productName;
  if (product === "gardens") return "Al Ghadeer Gardens";
  if (product === "community") return "Al Ghadeer Community";
  return PROJECT_NAME;
}

function isProdLike() {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

function normalizeLeadEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLeadPhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function normalizeLeadPage(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase().slice(0, 700);
  } catch {
    return raw.toLowerCase().slice(0, 700);
  }
}

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function leadDedupeKey({
  email,
  phone,
  sourcePage,
  product,
  funnelSessionId,
  attribution,
  now = Date.now(),
}) {
  const safeSession = clip(funnelSessionId, 120);
  const bucket = Math.floor(now / LEAD_DEDUPE_BUCKET_MS);
  const base = [
    PROJECT_SLUG,
    SITE_KEY,
    normalizeLeadEmail(email),
    normalizeLeadPhone(phone),
    clip(product, 80).toLowerCase() || "parks",
    normalizeLeadPage(sourcePage || attribution?.current_page || attribution?.landing_page),
    safeSession || "no-session",
  ].join("|");
  const key = hashText(`${base}|${bucket}`).slice(0, 48);
  return { key, bucket, safeSession };
}

function cleanupLeadDedupeCache(now = Date.now()) {
  for (const [key, expiresAt] of leadDedupeCache.entries()) {
    if (expiresAt <= now) leadDedupeCache.delete(key);
  }
}

function reserveLeadDedupeKey(key, now = Date.now()) {
  cleanupLeadDedupeCache(now);
  const prev = leadDedupeCache.get(key);
  if (prev && prev > now) return false;
  leadDedupeCache.set(key, now + LEAD_DEDUPE_TTL_MS);
  return true;
}

function releaseLeadDedupeKey(key) {
  if (!key) return;
  leadDedupeCache.delete(key);
}

async function hasRecentLeadRecord({ email, phone, dedupeKey }) {
  if (!supabaseConfigured()) return false;
  const since = new Date(Date.now() - LEAD_DEDUPE_TTL_MS).toISOString();
  const safeSince = encodeURIComponent(since);
  const safeDedupe = encodeURIComponent(dedupeKey);
  try {
    const byKey = await supabaseSelect(
      "leads",
      `?select=id&source=eq.contact_form&dedupe_key=eq.${safeDedupe}&created_at=gte.${safeSince}&limit=1`,
    );
    if (Array.isArray(byKey) && byKey.length) return true;
  } catch (err) {
    if (!isMissingColumnError(err) && !isMissingTableError(err)) throw err;
  }
  const safeEmail = encodeURIComponent(normalizeLeadEmail(email));
  const safePhone = encodeURIComponent(normalizeLeadPhone(phone));
  const rows = await supabaseSelect(
    "leads",
    `?select=id,message,created_at&source=eq.contact_form&email=eq.${safeEmail}&phone=eq.${safePhone}&created_at=gte.${safeSince}&order=created_at.desc&limit=5`,
  );
  if (!Array.isArray(rows) || !rows.length) return false;
  return rows.some((row) => String(row?.message || "").includes(`Lead-Dedupe-Key: ${dedupeKey}`));
}

async function forwardWebhook(body) {
  const url = env("FORM_WEBHOOK_URL");
  if (!url) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FORM_WEBHOOK_URL failed: ${text.slice(0, 300)}`);
  }
  return { ok: true };
}

/**
 * Agency notify only. Never send a welcome / confirmation / auto-reply to the visitor.
 */
async function persistLead({
  fullName,
  email,
  phone,
  city,
  interest,
  product,
  productName,
  message,
  sourcePage,
  funnelSessionId,
  client,
  attribution,
}) {
  const submittedAt = new Date().toISOString();
  const clientIp = client?.ip || null;
  const stamp = dashboardClient(client);
  const countryLabel = formatCountryLabel(stamp?.country);
  const projectName = productLabel(product, productName);
  const productKey = product || "parks";
  const safeAttribution = sanitizeAttribution(attribution, { sourcePage });
  const dedupe = leadDedupeKey({
    email,
    phone,
    sourcePage,
    product: productKey,
    funnelSessionId,
    attribution: safeAttribution,
  });
  const dedupeLine = `Lead-Dedupe-Key: ${dedupe.key}`;
  const leadMessage = [
    `Project inquiry: ${projectName}`,
    `Slug: ${PROJECT_SLUG}`,
    `Product: ${productKey}`,
    `Site: ${SITE_KEY}`,
    `Host: ${SITE_URL}`,
    dedupe.safeSession ? `Funnel session: ${dedupe.safeSession}` : "",
    dedupeLine,
    sourcePage ? `Page URL: ${sourcePage}` : "",
    safeAttribution.landing_page ? `Landing URL: ${safeAttribution.landing_page}` : "",
    safeAttribution.current_page ? `Current URL: ${safeAttribution.current_page}` : "",
    safeAttribution.referrer ? `Referrer: ${safeAttribution.referrer}` : "",
    safeAttribution.channel ? `Traffic channel: ${safeAttribution.channel}` : "",
    safeAttribution.utm_source ? `UTM source: ${safeAttribution.utm_source}` : "",
    safeAttribution.utm_medium ? `UTM medium: ${safeAttribution.utm_medium}` : "",
    safeAttribution.utm_campaign ? `UTM campaign: ${safeAttribution.utm_campaign}` : "",
    safeAttribution.utm_term ? `UTM term: ${safeAttribution.utm_term}` : "",
    safeAttribution.utm_content ? `UTM content: ${safeAttribution.utm_content}` : "",
    safeAttribution.organic_keyword ? `Organic keyword: ${safeAttribution.organic_keyword}` : "",
    countryLabel ? `Country: ${countryLabel}` : "",
    clientIp ? `IP address: ${clientIp}` : "",
    "",
    message || "",
  ]
    .filter(Boolean)
    .join("\n");

  const ingestBody = {
    site: SITE_HOST,
    source: SITE_KEY,
    project_slug: PROJECT_SLUG,
    project_name: projectName,
    product: productKey,
    full_name: fullName,
    name: fullName,
    email,
    phone,
    city: city || "",
    property_interest: interest || "",
    message: message || "",
    source_page: sourcePage || SITE_URL,
    funnel_session_id: dedupe.safeSession || null,
    idempotency_key: dedupe.key,
    idempotency_bucket: dedupe.bucket,
    canonical_inbox_sink: "supabase.leads",
    skip_inbox_write: true,
    landing_page: safeAttribution.landing_page || null,
    current_page: safeAttribution.current_page || null,
    referrer: safeAttribution.referrer || null,
    attribution_channel: safeAttribution.channel || null,
    utm_source: safeAttribution.utm_source || null,
    utm_medium: safeAttribution.utm_medium || null,
    utm_campaign: safeAttribution.utm_campaign || null,
    utm_term: safeAttribution.utm_term || null,
    utm_content: safeAttribution.utm_content || null,
    organic_keyword: safeAttribution.organic_keyword || null,
    attribution: safeAttribution,
    country: stamp?.country || null,
    ip_hash: stamp?.ip_hash || null,
    client: stamp,
  };

  const emailContent = leadEmailContent({
    fullName,
    email,
    phone,
    projectName,
    productKey,
    interest,
    message,
    sourcePage,
    attribution: safeAttribution,
    stamp,
    clientIp,
    submittedAt,
  });

  const via = [];
  let dedupeReserved = false;
  let canonicalSaved = false;

  try {
    dedupeReserved = reserveLeadDedupeKey(dedupe.key);
    if (!dedupeReserved) {
      return { via: "deduped-memory", dedupe_key: dedupe.key, duplicate: true };
    }
    if (await hasRecentLeadRecord({ email, phone, dedupeKey: dedupe.key })) {
      return { via: "deduped-supabase", dedupe_key: dedupe.key, duplicate: true };
    }
  } catch (err) {
    console.error("[parks:lead:dedupe-check]", err);
  }

  try {
    if (supabaseConfigured()) {
      const leadRow = {
        email,
        full_name: fullName,
        phone,
        // Enum on the shared dashboard is lead_source: contact_form (not a free-text site tag).
        // Site/product stay in `message` so theupsides.ae can filter Parks vs Gardens.
        source: "contact_form",
        message: leadMessage,
        status: "new",
        dedupe_key: dedupe.key,
        funnel_session_id: dedupe.safeSession || null,
      };
      await insertLeadWithFallback(leadRow);
      via.push("supabase");
      canonicalSaved = true;
    }
  } catch (err) {
    console.error("[parks:supabase:leads]", err);
  }

  try {
    if (envFlag("ENABLE_LEAD_WEBHOOK_FORWARD")) {
      const webhooked = await forwardWebhook(ingestBody);
      if (webhooked) via.push("webhook");
    }
  } catch (err) {
    console.error("[parks:webhook:leads]", err);
  }

  try {
    if (shouldForwardLeadsToIngest()) {
      const forwarded = await forwardIngest("/leads", ingestBody);
      if (forwarded) via.push("ingest");
    }
  } catch (err) {
    console.error("[parks:ingest:leads]", err);
  }

  try {
    await notifyAgency({
      html: emailContent.html,
      text: emailContent.text,
      replyTo: email,
      visitorName: fullName,
      subject: `${projectName} - New Lead`,
    });
    via.push("email");
  } catch (err) {
    // Email is advisory only — never fail the submit when the lead row was captured.
    console.error("[parks:email:leads]", err);
  }

  if (!via.length && ingestConfigured()) {
    try {
      const forwarded = await forwardIngest("/leads", ingestBody);
      if (forwarded) via.push("ingest-fallback");
    } catch (err) {
      console.error("[parks:ingest:leads:fallback]", err);
    }
  }

  if (!via.length) {
    if (dedupeReserved) releaseLeadDedupeKey(dedupe.key);
    if (!isProdLike()) {
      console.info("[parks:lead:mock] no backend configured — accepting locally", {
        product: product || "parks",
        email,
      });
      return { via: "mock" };
    }
    throw new Error("Could not save or email this enquiry");
  }

  return {
    via: via.join("+"),
    dedupe_key: dedupe.key,
    canonicalSaved,
    emailFailed: !via.includes("email") && Boolean(env("RESEND_API_KEY")),
  };
}

function compactMeta(metadata) {
  const out = {};
  if (!metadata || typeof metadata !== "object") return out;
  for (const [key, value] of Object.entries(metadata)) {
    if (/^(email|phone|full_name|name|first_name|last_name|message)$/i.test(key)) continue;
    if (value === undefined || value === null || value === "") continue;
    if (key === "field_hints" || key === "snapshot") {
      if (value && typeof value === "object" && !Array.isArray(value)) out[key] = value;
      continue;
    }
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
}

async function persistEvent({ eventName, formName, errorType, pagePath, metadata, client }) {
  const original = String(eventName || "").trim() || "cta_click";
  if (original === "whatsapp_shown") {
    return { via: "skipped" };
  }
  const mapped = mapEventName(original);
  const stamp = dashboardClient(client);
  const meta = {
    ...compactMeta(metadata),
    kind: original,
    site: SITE_HOST,
    source: SITE_KEY,
    product: compactMeta(metadata).product || "parks",
    website: PROJECT_NAME,
    website_url: SITE_URL,
    funnel_session_id: compactMeta(metadata).funnel_session_id,
    country: stamp?.country || null,
    ip_hash: stamp?.ip_hash || null,
    client: stamp,
  };

  const row = {
    event_name: mapped,
    form_name: formName || (mapped.startsWith("form_") ? "project_inquiry" : null),
    error_type: errorType || null,
    project_slug: PROJECT_SLUG,
    page_path: (pagePath || "/").slice(0, 500),
    metadata: meta,
  };

  const via = [];

  try {
    const forwarded = await forwardIngest("/events", {
      ...row,
      event_name: original,
      website: PROJECT_NAME,
      website_url: SITE_URL,
      site: SITE_HOST,
      source: SITE_KEY,
      country: stamp?.country || null,
      ip_hash: stamp?.ip_hash || null,
      client: stamp,
    });
    if (forwarded) via.push("ingest");
  } catch (err) {
    console.error("[parks:ingest:events]", err);
  }

  try {
    if (supabaseConfigured()) {
      await supabaseInsert("analytics_events", row);
      via.push("supabase");
    }
  } catch (err) {
    if (mapped !== "page_view" && original !== "page_view" && mapped !== "cta_click") {
      try {
        await supabaseInsert("analytics_events", { ...row, event_name: "cta_click" });
        via.push("supabase-fallback");
      } catch (fallbackErr) {
        console.error("[parks:supabase:events]", fallbackErr);
      }
    } else if (mapped !== "page_view" && original !== "page_view") {
      console.error("[parks:supabase:events]", err);
    }
  }

  if (via.length) return { via: via.join("+") };
  if (mapped === "page_view" || original === "page_view" || original === "whatsapp_shown") {
    return { via: "skipped" };
  }
  if (!supabaseConfigured()) return { via: "skipped" };
  throw new Error("Could not persist analytics event");
}

function clip(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

const TRAFFIC_CHANNELS = new Set([
  "direct",
  "organic_search",
  "referral",
  "paid",
  "social",
  "email",
  "unknown",
]);

function safeDecode(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw.replace(/\+/g, " ")).trim();
  } catch {
    return raw.trim();
  }
}

function parseUrlSafely(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function searchKeywordFromUrl(rawUrl) {
  const url = parseUrlSafely(rawUrl);
  if (!url) return "";
  const keys = ["q", "query", "keyword", "p"];
  for (const key of keys) {
    const value = safeDecode(url.searchParams.get(key));
    if (value) return value.slice(0, 160);
  }
  return "";
}

function detectTrafficChannel(rawAttribution) {
  const source = clip(rawAttribution?.utm_source, 120).toLowerCase();
  const medium = clip(rawAttribution?.utm_medium, 120).toLowerCase();
  const referrer = clip(rawAttribution?.referrer, 700).toLowerCase();
  const host = parseUrlSafely(referrer)?.hostname || "";
  const value = `${source} ${medium}`.trim();

  if (!value && !referrer) return "direct";
  if (/(email|newsletter|mail)/.test(value)) return "email";
  if (/(cpc|ppc|paid|display|programmatic|retarget|ads|adwords|sponsored|affiliate)/.test(value)) {
    return "paid";
  }
  if (/(social|instagram|facebook|linkedin|twitter|x\.com|tiktok|snapchat|youtube|pinterest|reddit)/.test(value)) {
    return "social";
  }
  if (/(organic|seo)/.test(value)) return "organic_search";
  if (
    /(google|bing|yahoo|duckduckgo|baidu|yandex|naver|ecosia)\./.test(host) &&
    !/(cpc|ppc|paid|display|adwords|sponsored)/.test(value)
  ) {
    return "organic_search";
  }
  if (referrer) return "referral";
  return "unknown";
}

function sanitizeAttribution(rawAttribution, fallback = {}) {
  const raw = rawAttribution && typeof rawAttribution === "object" ? rawAttribution : {};
  const landingPage = clip(raw.landing_page || fallback.sourcePage, 700);
  const currentPage = clip(raw.current_page || fallback.sourcePage, 700);
  const referrer = clip(raw.referrer, 700);
  const utmTerm = clip(raw.utm_term, 200);
  const detectedChannel = detectTrafficChannel({
    ...raw,
    landing_page: landingPage,
    current_page: currentPage,
    referrer,
  });
  const requestedChannel = clip(raw.channel, 40).toLowerCase();
  const channel = TRAFFIC_CHANNELS.has(requestedChannel) ? requestedChannel : detectedChannel;
  const keywordFromUtm = safeDecode(utmTerm).slice(0, 160);
  const keywordFromLanding = searchKeywordFromUrl(landingPage);
  const keywordFromCurrent = searchKeywordFromUrl(currentPage);
  const organicKeyword = clip(
    safeDecode(raw.organic_keyword) || keywordFromUtm || keywordFromLanding || keywordFromCurrent,
    160,
  );

  return {
    utm_source: clip(raw.utm_source, 120),
    utm_medium: clip(raw.utm_medium, 120),
    utm_campaign: clip(raw.utm_campaign, 160),
    utm_term: utmTerm,
    utm_content: clip(raw.utm_content, 200),
    referrer,
    landing_page: landingPage,
    current_page: currentPage,
    channel,
    organic_keyword: channel === "organic_search" ? organicKeyword : "",
  };
}

function isMissingColumnError(err) {
  const body = String(err?.body || err?.message || "").toLowerCase();
  if (body.includes("pgrst204")) return true;
  if (body.includes("column") && body.includes("does not exist")) return true;
  // PostgREST schema cache: "Could not find the 'dedupe_key' column of 'leads'"
  if (body.includes("could not find") && body.includes("column")) return true;
  return false;
}

function isMissingTableError(err) {
  const body = String(err?.body || err?.message || "").toLowerCase();
  return body.includes("pgrst205") || (body.includes("could not find") && body.includes("table"));
}

async function insertLeadWithFallback(leadRow) {
  const withoutOptional = {
    email: leadRow.email,
    full_name: leadRow.full_name,
    phone: leadRow.phone,
    source: leadRow.source,
    message: leadRow.message,
    status: leadRow.status,
  };
  try {
    await supabaseInsert("leads", leadRow);
    return;
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
  }
  await supabaseInsert("leads", withoutOptional);
}

function withoutDraftAttribution(row) {
  const out = { ...row };
  delete out.attribution_channel;
  delete out.attribution_source;
  delete out.attribution_medium;
  delete out.attribution_campaign;
  delete out.attribution_term;
  delete out.attribution_content;
  delete out.attribution_keyword;
  delete out.referrer_url;
  delete out.landing_page_url;
  delete out.current_page_url;
  return out;
}

function sanitizeDraftSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return {};
  const out = {};
  for (const [rawKey, rawValue] of Object.entries(snapshot)) {
    const key = clip(rawKey, 40);
    if (!key) continue;
    if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      out[key] = clip(rawValue, key === "message" ? 500 : 200);
    }
  }
  if (!out.name && out.full_name) out.name = out.full_name;
  if (!out.full_name && out.name) out.full_name = out.name;
  return out;
}

function snapshotHasContact(snapshot) {
  const safe = sanitizeDraftSnapshot(snapshot);
  return Boolean(safe.name || safe.full_name || safe.email || safe.phone);
}

function leadFieldHints(snapshot) {
  const safe = sanitizeDraftSnapshot(snapshot);
  const fullName = clip(safe.full_name || safe.name, 120);
  const email = clip(safe.email, 200);
  const code = clip(safe.country_code, 20);
  const digits = clip(safe.phone, 30).replace(/[^\d+]/g, "");
  let phone = digits;
  if (digits && code && !digits.startsWith("+")) {
    const dial = code.startsWith("+") ? code : `+${code.replace(/[^\d]/g, "")}`;
    phone = `${dial}${digits.replace(/^0+/, "")}`;
  }
  const message = clip(safe.message, 500);
  const out = {};
  if (fullName) out.full_name = fullName;
  if (email) out.email = email;
  if (phone) out.phone = phone;
  if (message) out.message = message;
  return out;
}

function mergeDraftSnapshots(primary, fallback) {
  const left = sanitizeDraftSnapshot(primary);
  const right = sanitizeDraftSnapshot(fallback);
  const out = { ...right };
  for (const [key, value] of Object.entries(left)) {
    if (value !== "") out[key] = value;
  }
  return out;
}

async function persistFormAttempt({
  status,
  errorReason,
  errorType,
  snapshot,
  formName,
  sourcePage,
  funnelSessionId,
  product,
  attribution,
  client,
}) {
  const stamp = dashboardClient(client);
  const safeSnapshot =
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
  const safeAttribution = sanitizeAttribution(attribution, { sourcePage });
  const meta = {
    status: clip(status, 40) || "partial",
    error_reason: clip(errorReason, 200) || null,
    form_status: clip(status, 40) || "partial",
    snapshot: sanitizeDraftSnapshot(safeSnapshot),
    field_hints: leadFieldHints(safeSnapshot),
    funnel_session_id: clip(funnelSessionId, 120) || null,
    site: SITE_HOST,
    source: SITE_KEY,
    product: clip(product, 80) || "parks",
    website: PROJECT_NAME,
    website_url: SITE_URL,
    landing_page: safeAttribution.landing_page || null,
    current_page: safeAttribution.current_page || null,
    referrer: safeAttribution.referrer || null,
    attribution_channel: safeAttribution.channel || null,
    country: stamp?.country || null,
    ip_hash: stamp?.ip_hash || null,
    client: stamp,
  };

  return persistEvent({
    eventName: "form_submit_error",
    formName: formName || "project_inquiry",
    errorType: errorType || status || "partial",
    pagePath: sourcePage || safeAttribution.current_page || "/",
    metadata: meta,
    client,
  }).catch((err) => {
    console.error("[parks:form-attempt]", err);
    return { via: "failed" };
  });
}

async function persistFormDraft({
  action,
  events,
  formName,
  sourcePage,
  funnelSessionId,
  submittedAt,
  snapshot,
  client,
  attribution,
}) {
  const stamp = dashboardClient(client);
  const safeFormName = clip(formName, 80) || "project_inquiry";
  const safeSession = clip(funnelSessionId, 80) || null;
  const safeSourcePage = clip(sourcePage, 500) || "/";
  const safeAction = action === "mark_submitted" ? "mark_submitted" : "capture";
  const validEvents = Array.isArray(events)
    ? events
        .slice(0, 30)
        .filter((event) => event && typeof event === "object")
    : [];
  const safeAttribution = sanitizeAttribution(attribution, { sourcePage: safeSourcePage });
  const via = [];

  if (!safeSession) return { via: "skipped" };

  try {
    if (supabaseConfigured() && validEvents.length) {
      const rows = validEvents.map((event) => ({
        project_slug: PROJECT_SLUG,
        site_key: SITE_KEY,
        form_name: safeFormName,
        funnel_session_id: safeSession,
        source_page: clip(event.source_page || safeSourcePage, 500) || "/",
        field_name: clip(event.field_name, 40),
        field_value: clip(event.field_value, event.field_name === "message" ? 500 : 200),
        event_type: clip(event.event_type, 20) || "input",
        occurred_at: clip(event.occurred_at, 40) || new Date().toISOString(),
        snapshot: sanitizeDraftSnapshot(event.snapshot),
        country: stamp?.country || null,
        ip_hash: stamp?.ip_hash || null,
        client: stamp,
        action: "capture",
        attribution_channel: safeAttribution.channel || null,
        attribution_source: safeAttribution.utm_source || null,
        attribution_medium: safeAttribution.utm_medium || null,
        attribution_campaign: safeAttribution.utm_campaign || null,
        attribution_term: safeAttribution.utm_term || null,
        attribution_content: safeAttribution.utm_content || null,
        attribution_keyword: safeAttribution.organic_keyword || null,
        referrer_url: safeAttribution.referrer || null,
        landing_page_url: safeAttribution.landing_page || null,
        current_page_url: safeAttribution.current_page || null,
      }));
      const filteredRows = rows.filter((row) => row.field_name);
      if (filteredRows.length) {
        try {
          await supabaseInsert("form_draft_events", filteredRows);
        } catch (err) {
          if (!isMissingColumnError(err)) throw err;
          await supabaseInsert(
            "form_draft_events",
            filteredRows.map((row) => withoutDraftAttribution(row)),
          );
        }
        via.push("supabase-events");
      }
    }
  } catch (err) {
    console.error("[parks:supabase:form-draft-events]", err);
  }

  try {
    if (supabaseConfigured()) {
      const latestEvent = validEvents[validEvents.length - 1] || null;
      let safeSnapshot = sanitizeDraftSnapshot(snapshot || latestEvent?.snapshot || {});
      if (safeAction === "mark_submitted" && !snapshotHasContact(safeSnapshot)) {
        try {
          const encodedSession = encodeURIComponent(safeSession);
          const existing = await supabaseSelect(
            "form_draft_sessions",
            `?select=latest_snapshot&project_slug=eq.${encodeURIComponent(PROJECT_SLUG)}&form_name=eq.${encodeURIComponent(safeFormName)}&funnel_session_id=eq.${encodedSession}&limit=1`,
          );
          const prior = Array.isArray(existing) && existing[0]?.latest_snapshot ? existing[0].latest_snapshot : null;
          safeSnapshot = mergeDraftSnapshots(safeSnapshot, prior);
        } catch (err) {
          if (!isMissingColumnError(err) && !isMissingTableError(err)) {
            console.error("[parks:form-draft:merge]", err);
          }
        }
      }
      const sessionRow = {
        project_slug: PROJECT_SLUG,
        site_key: SITE_KEY,
        form_name: safeFormName,
        funnel_session_id: safeSession,
        source_page: safeSourcePage,
        last_field_name: clip(latestEvent?.field_name, 40) || null,
        last_field_value: clip(
          latestEvent?.field_value,
          latestEvent?.field_name === "message" ? 500 : 200,
        ) || null,
        last_event_type: clip(latestEvent?.event_type, 20) || null,
        last_event_at: clip(latestEvent?.occurred_at, 40) || new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        country: stamp?.country || null,
        ip_hash: stamp?.ip_hash || null,
        client: stamp,
        attribution_channel: safeAttribution.channel || null,
        attribution_source: safeAttribution.utm_source || null,
        attribution_medium: safeAttribution.utm_medium || null,
        attribution_campaign: safeAttribution.utm_campaign || null,
        attribution_term: safeAttribution.utm_term || null,
        attribution_content: safeAttribution.utm_content || null,
        attribution_keyword: safeAttribution.organic_keyword || null,
        referrer_url: safeAttribution.referrer || null,
        landing_page_url: safeAttribution.landing_page || null,
        current_page_url: safeAttribution.current_page || null,
      };
      if (snapshotHasContact(safeSnapshot)) {
        sessionRow.latest_snapshot = safeSnapshot;
      }
      if (safeAction === "mark_submitted") {
        sessionRow.submitted_success = true;
        sessionRow.submitted_at = clip(submittedAt, 40) || new Date().toISOString();
      }
      try {
        await supabaseUpsert("form_draft_sessions", sessionRow, [
          "project_slug",
          "form_name",
          "funnel_session_id",
        ]);
      } catch (err) {
        if (!isMissingColumnError(err)) throw err;
        await supabaseUpsert("form_draft_sessions", withoutDraftAttribution(sessionRow), [
          "project_slug",
          "form_name",
          "funnel_session_id",
        ]);
      }
      via.push("supabase-session");
    }
  } catch (err) {
    console.error("[parks:supabase:form-draft-session]", err);
  }

  try {
    if (ingestConfigured()) {
      const latestEvent = validEvents[validEvents.length - 1] || null;
      const safeSnapshot = sanitizeDraftSnapshot(snapshot || latestEvent?.snapshot || {});
      const hasContact = snapshotHasContact(safeSnapshot);
      const fieldHints = leadFieldHints(safeSnapshot);
      const eventName =
        safeAction === "mark_submitted"
          ? "form_submit_success"
          : hasContact
            ? "form_typing"
            : "form_open";
      await forwardIngest("/events", {
        event_name: eventName,
        form_name: safeFormName,
        project_slug: PROJECT_SLUG,
        site: SITE_HOST,
        source: SITE_KEY,
        website: PROJECT_NAME,
        website_url: SITE_URL,
        page_path: safeSourcePage,
        country: stamp?.country || null,
        ip_hash: stamp?.ip_hash || null,
        client: stamp,
        metadata: {
          kind: safeAction === "mark_submitted" ? "form_draft_submitted" : "form_draft_capture",
          form_status: safeAction === "mark_submitted" ? "submitted" : "partial",
          funnel_session_id: safeSession,
          snapshot: safeSnapshot,
          field_hints: fieldHints,
          last_field_name: clip(latestEvent?.field_name, 40) || null,
          last_event_type: clip(latestEvent?.event_type, 20) || null,
          site: SITE_HOST,
          source: SITE_KEY,
          product: safeSnapshot.product || "parks",
          website: PROJECT_NAME,
          website_url: SITE_URL,
          landing_page: safeAttribution.landing_page || null,
          current_page: safeAttribution.current_page || null,
          referrer: safeAttribution.referrer || null,
          attribution_channel: safeAttribution.channel || null,
          client: stamp,
        },
      });
      via.push("ingest");
    }
  } catch (err) {
    console.error("[parks:ingest:form-draft]", err);
  }

  if (via.length) return { via: via.join("+") };
  if (!supabaseConfigured()) return { via: "skipped" };
  return { via: "unavailable" };
}

module.exports = {
  PROJECT_SLUG,
  PROJECT_NAME,
  persistLead,
  persistEvent,
  persistFormDraft,
  persistFormAttempt,
  sanitizeAttribution,
  mapEventName,
};
