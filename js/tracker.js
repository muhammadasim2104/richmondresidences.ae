(() => {
  const PROJECT_SLUG = "richmond-residences";
  const WEBSITE = "Richmond Residences";
  const WEBSITE_URL = "https://richmondresidences.ae";
  const SITE_KEY = "richmondresidences";
  const FORM_NAME = "project_inquiry";
  const recent = new Map();

  function newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "00000000-0000-4000-8000-000000000000".replace(/0/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
  }

  function sessionId() {
    const key = "tu_funnel_session";
    try {
      const existing = sessionStorage.getItem(key);
      if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
      const id = newId();
      sessionStorage.setItem(key, id);
      return id;
    } catch {
      return newId();
    }
  }

  function pagePath() {
    return `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`.slice(0, 500);
  }

  function shouldSkip(key) {
    const now = Date.now();
    const prev = recent.get(key) || 0;
    if (now - prev < 400) return true;
    recent.set(key, now);
    return false;
  }

  function track(eventName, extra) {
    if (!eventName || shouldSkip(`${eventName}:${JSON.stringify(extra || {})}`)) return;
    const payload = {
      event_name: eventName,
      form_name: extra?.form_name || FORM_NAME,
      error_type: extra?.error_type || null,
      project_slug: PROJECT_SLUG,
      website: WEBSITE,
      website_url: WEBSITE_URL,
      page_path: extra?.page_path || pagePath(),
      metadata: {
        funnel_session_id: sessionId(),
        website: WEBSITE,
        website_url: WEBSITE_URL,
        site: SITE_KEY,
        ...(extra?.metadata || {}),
      },
    };
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/events", blob)) return;
      }
    } catch {
      // Fall through to fetch.
    }
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  window.RichmondAnalytics = { track, sessionId };
  track("page_view");
})();
