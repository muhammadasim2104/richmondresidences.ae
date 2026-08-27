const { persistEvent } = require("./_lib/pipeline");
const {
  clientContext,
  dashboardClient,
  checkRateLimit,
  readJson,
  json,
} = require("./_lib/context");
const { isUs, recordUsHit, logProtect } = require("./_lib/protect");

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
  const limited = checkRateLimit(`events:${ipHash}`, 40, 60_000);
  if (!limited.ok) {
    logProtect("events_rate_limit", {
      country: stamp?.country || null,
      ip_hash: ipHash,
      retryAfterSec: limited.retryAfterSec,
    });
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

  const events = Array.isArray(body.events) ? body.events : [body];
  const hasPageView = events.some((event) => {
    if (!event || typeof event !== "object") return false;
    const name = String(event.event_name || event.name || "");
    return name === "page_view";
  });

  if (isUs(stamp?.country) && hasPageView) {
    recordUsHit("page_view", ipHash);
  }

  try {
    for (const event of events.slice(0, 10)) {
      if (!event || typeof event !== "object") continue;
      await persistEvent({
        eventName: event.event_name || event.name,
        formName: event.form_name || null,
        errorType: event.error_type || null,
        pagePath: event.page_path || null,
        metadata: event.metadata || null,
        client: { ...ctx, ip_hash: ipHash },
      });
    }
    json(res, 204, { ok: true });
  } catch (err) {
    console.error("[parks:events]", err);
    json(res, 204, { ok: true });
  }
};
