const { persistFormDraft, PROJECT_SLUG } = require("./_lib/pipeline");
const {
  clientContext,
  dashboardClient,
  checkRateLimit,
  readJson,
  json,
} = require("./_lib/context");
const { SITE_KEY } = require("./_lib/config");

const ALLOWED_FORM = "project_inquiry";
const ALLOWED_EVENTS = new Set(["input", "change", "blur", "paste", "error"]);
const ALLOWED_FIELDS = new Set(["name", "full_name", "email", "country_code", "phone", "interest", "message"]);

function clip(value, maxLen) {
  return String(value || "").trim().slice(0, maxLen);
}

function cleanFieldValue(fieldName, value) {
  const key = clip(fieldName, 40);
  const limit = key === "message" ? 500 : 200;
  if (key === "phone") return clip(value, limit).replace(/[^\d+]/g, "");
  return clip(value, limit);
}

function cleanSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return {};
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in snapshot)) continue;
    out[key] = cleanFieldValue(key, snapshot[key]);
  }
  if (!out.name && out.full_name) out.name = out.full_name;
  if (!out.full_name && out.name) out.full_name = out.name;
  return out;
}

function sanitizeEvents(rawEvents, fallback) {
  const sourcePage = clip(fallback.sourcePage, 500) || "/";
  const formName = clip(fallback.formName, 80) || ALLOWED_FORM;
  const funnelSessionId = clip(fallback.funnelSessionId, 80);

  return (Array.isArray(rawEvents) ? rawEvents : [])
    .slice(0, 30)
    .map((event) => {
      if (!event || typeof event !== "object") return null;
      const fieldName = clip(event.field_name, 40);
      if (!ALLOWED_FIELDS.has(fieldName)) return null;
      const eventType = clip(event.event_type, 20).toLowerCase() || "input";
      if (!ALLOWED_EVENTS.has(eventType)) return null;
      return {
        form_name: formName,
        project_slug: PROJECT_SLUG,
        site_key: SITE_KEY,
        funnel_session_id: funnelSessionId,
        source_page: clip(event.source_page || sourcePage, 500) || "/",
        field_name: fieldName,
        field_value: cleanFieldValue(fieldName, event.field_value),
        event_type: eventType,
        occurred_at: clip(event.occurred_at, 40) || new Date().toISOString(),
        snapshot: cleanSnapshot(event.snapshot),
      };
    })
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { ok: false });
    return;
  }

  const ctx = clientContext(req);
  const stamp = dashboardClient(ctx);
  const ipHash = stamp?.ip_hash || "unknown";
  const limited = checkRateLimit(`form-draft:${ipHash}`, 120, 60_000);
  if (!limited.ok) {
    json(res, 204, { ok: true });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    json(res, 400, { ok: false });
    return;
  }

  const action = body?.action === "mark_submitted" ? "mark_submitted" : "capture";
  const formName = clip(body?.form_name, 80);
  const funnelSessionId = clip(body?.funnel_session_id, 80);
  const sourcePage = clip(body?.source_page, 500) || "/";
  const submittedAt = clip(body?.submitted_at, 40) || new Date().toISOString();
  const snapshot = cleanSnapshot(body?.snapshot);

  if (formName !== ALLOWED_FORM) {
    json(res, 204, { ok: true });
    return;
  }
  if (!funnelSessionId) {
    json(res, 204, { ok: true });
    return;
  }

  const events = sanitizeEvents(body?.events, {
    formName,
    sourcePage,
    funnelSessionId,
  });

  try {
    await persistFormDraft({
      action,
      events,
      formName,
      sourcePage,
      funnelSessionId,
      submittedAt,
      snapshot,
      attribution: body?.attribution,
      client: { ...ctx, ip_hash: ipHash },
    });
    if (action === "mark_submitted") {
      json(res, 200, { ok: true });
      return;
    }
    json(res, 204, { ok: true });
  } catch (err) {
    console.error("[parks:form-draft]", err);
    json(res, 204, { ok: true });
  }
};
