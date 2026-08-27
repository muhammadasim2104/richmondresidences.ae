const { persistLead, persistFormAttempt, persistFormDraft } = require("./_lib/pipeline");
const {
  clientContext,
  dashboardClient,
  isHoneypotFilled,
  readJson,
  json,
} = require("./_lib/context");
const { SITE_URL } = require("./_lib/config");
const {
  isBlockedCountry,
  isUs,
  logProtect,
  recordUsHit,
  usBurstStatus,
  checkEnquireIpLimit,
  checkEnquireGlobalBurst,
  peekUsSuccessCap,
  hitUsSuccessCap,
} = require("./_lib/protect");

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function e164(countryCode, phone) {
  const code = String(countryCode || "").replace(/[^\d+]/g, "");
  const digits = String(phone || "").replace(/\D/g, "");
  if (!code || !digits) return "";
  const national = digits.replace(/^0+/, "");
  const dial = code.startsWith("+") ? code : `+${code}`;
  return `${dial}${national}`;
}

function partialSnapshot(body) {
  return {
    name: String(body?.name || body?.full_name || "").trim().slice(0, 200),
    email: String(body?.email || "").trim().slice(0, 200),
    country_code: String(body?.country_code || "").trim().slice(0, 20),
    phone: String(body?.phone || "").trim().slice(0, 30),
    interest: String(body?.interest || "").trim().slice(0, 120),
    message: String(body?.message || "").trim().slice(0, 500),
  };
}

function hasPartialContact(snapshot) {
  return Boolean(snapshot.name || snapshot.email || snapshot.phone);
}

function logPartialAttempt(body, ctx, stamp, opts) {
  const snapshot = partialSnapshot(body);
  if (!hasPartialContact(snapshot)) return;
  persistFormAttempt({
    status: opts.status || "partial",
    errorReason: opts.errorReason || "",
    errorType: opts.errorType || opts.status || "partial",
    snapshot,
    formName: "project_inquiry",
    sourcePage: String(body?.source_page || body?.page_path || SITE_URL).slice(0, 500),
    funnelSessionId: String(body?.funnel_session_id || body?.funnelSessionId || "").trim().slice(0, 120),
    product: "richmond-residences",
    attribution: body?.attribution,
    client: { ...ctx, ip_hash: stamp?.ip_hash },
  }).catch(() => {});
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    json(res, 400, { ok: false, message: "Invalid request" });
    return;
  }

  if (isHoneypotFilled(body.website) || isHoneypotFilled(body.tu_hp_confirm)) {
    json(res, 200, { ok: true, message: "Thanks, we’ll be in touch." });
    return;
  }

  const ctx = clientContext(req);
  const stamp = dashboardClient(ctx);
  const country = stamp?.country || null;
  const ipHash = stamp?.ip_hash || "unknown";

  if (isBlockedCountry(country)) {
    logProtect("block_country", { country, ip_hash: ipHash });
    json(res, 403, { ok: false, message: "Unable to process this request." });
    return;
  }

  if (isUs(country)) {
    recordUsHit("enquire", ipHash);
    const burst = await usBurstStatus();
    if (burst.tripped) {
      logProtect("us_burst", {
        country,
        ip_hash: ipHash,
        unique: burst.unique,
        count: burst.count,
        retryAfterSec: burst.retryAfterSec,
      });
      json(res, 429, {
        ok: false,
        message: `Too many attempts. Retry in ${burst.retryAfterSec}s.`,
        retryAfterSec: burst.retryAfterSec,
      });
      return;
    }
  }

  const ipLimited = checkEnquireIpLimit(country, ipHash);
  if (!ipLimited.ok) {
    logProtect("rate_limit_ip", {
      country,
      ip_hash: ipHash,
      retryAfterSec: ipLimited.retryAfterSec,
    });
    json(res, 429, {
      ok: false,
      message: `Too many attempts. Retry in ${ipLimited.retryAfterSec}s.`,
      retryAfterSec: ipLimited.retryAfterSec,
    });
    return;
  }

  const globalLimited = checkEnquireGlobalBurst();
  if (!globalLimited.ok) {
    logProtect("rate_limit_burst", {
      country,
      ip_hash: ipHash,
      retryAfterSec: globalLimited.retryAfterSec,
    });
    json(res, 429, {
      ok: false,
      message: `Too many attempts. Retry in ${globalLimited.retryAfterSec}s.`,
      retryAfterSec: globalLimited.retryAfterSec,
    });
    return;
  }

  const fullName = String(body.name || body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = e164(body.country_code, body.phone);
  const interest = String(body.interest || "").trim().slice(0, 120);
  const productName = "Richmond Residences";
  const message = [String(body.message || "").trim(), interest ? `Interest: ${interest}` : "", `Project: ${productName}`]
    .filter(Boolean)
    .join("\n")
    .slice(0, 5000);
  const sourcePage = String(body.source_page || body.page_path || "https://richmondresidences.ae/").slice(0, 500);
  const funnelSessionId = String(body.funnel_session_id || body.funnelSessionId || "")
    .trim()
    .slice(0, 120);

  if (fullName.length < 2) {
    logPartialAttempt(body, ctx, stamp, {
      status: "validation",
      errorType: "validation",
      errorReason: "Name too short",
    });
    json(res, 400, { ok: false, message: "Please enter your name." });
    return;
  }
  if (!validEmail(email)) {
    logPartialAttempt(body, ctx, stamp, {
      status: "validation",
      errorType: "validation",
      errorReason: "Invalid email",
    });
    json(res, 400, { ok: false, message: "Please enter a valid email." });
    return;
  }
  if (phone.replace(/\D/g, "").length < 8) {
    logPartialAttempt(body, ctx, stamp, {
      status: "validation",
      errorType: "validation",
      errorReason: "Invalid phone",
    });
    json(res, 400, { ok: false, message: "Please enter a valid phone number." });
    return;
  }

  if (isUs(country)) {
    const cap = peekUsSuccessCap();
    if (!cap.ok) {
      logProtect("us_success_cap", {
        country,
        ip_hash: ipHash,
        retryAfterSec: cap.retryAfterSec,
      });
      json(res, 429, {
        ok: false,
        message: `Too many attempts. Retry in ${cap.retryAfterSec}s.`,
        retryAfterSec: cap.retryAfterSec,
      });
      return;
    }
  }

  try {
    const saved = await persistLead({
      fullName,
      email,
      phone,
      city: "",
      interest,
      product: "richmond-residences",
      productName,
      message: message || `I would like more details about ${productName}.`,
      sourcePage,
      funnelSessionId,
      attribution: body?.attribution,
      client: { ...ctx, ip_hash: ipHash },
    });
    if (saved?.duplicate) {
      if (funnelSessionId) {
        persistFormDraft({
          action: "mark_submitted",
          formName: "project_inquiry",
          sourcePage,
          funnelSessionId,
          submittedAt: new Date().toISOString(),
          snapshot: {
            name: fullName,
            email,
            phone,
            country_code: String(body.country_code || "").trim(),
            interest,
            message: String(body.message || "").trim(),
          },
          attribution: body?.attribution,
          client: { ...ctx, ip_hash: ipHash },
        }).catch(() => {});
      }
      json(res, 200, { ok: true, message: "Thanks, our team will follow up shortly." });
      return;
    }
    if (isUs(country)) hitUsSuccessCap();
    if (funnelSessionId) {
      persistFormDraft({
        action: "mark_submitted",
        formName: "project_inquiry",
        sourcePage,
        funnelSessionId,
        submittedAt: new Date().toISOString(),
        snapshot: {
          name: fullName,
          email,
          phone,
          country_code: String(body.country_code || "").trim(),
          interest,
          message: String(body.message || "").trim(),
        },
        attribution: body?.attribution,
        client: { ...ctx, ip_hash: ipHash },
      }).catch(() => {});
    }
    json(res, 200, { ok: true, message: "Thanks, our team will follow up shortly." });
  } catch (err) {
    console.error("[richmond:enquire]", err);
    logPartialAttempt(body, ctx, stamp, {
      status: "error",
      errorType: "persist",
      errorReason: err instanceof Error ? err.message : "Server error",
    });
    json(res, 500, { ok: false, message: "Could not save your enquiry. Try again." });
  }
};
