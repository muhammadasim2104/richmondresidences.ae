(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const forms = document.querySelectorAll("form.form");
  const track = (name, extra) => window.RichmondAnalytics?.track(name, extra);
  const countries = window.RichmondCountries || [];
  const countryUtils = window.RichmondCountryUtils || {};
  let defaultCountryIso = null;

  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-open-register]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const target = document.getElementById("register");
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const inquiryModal = document.getElementById("inquiry-modal");
  let inquiryLastFocus = null;

  function getPageProject() {
    const body = document.body;
    return {
      slug: body?.dataset.projectSlug || "richmond-residences",
      name: body?.dataset.projectName || "Richmond Residences",
    };
  }

  function openInquiryModal(trigger) {
    if (!inquiryModal) return;
    const dialog = inquiryModal.querySelector(".inquiry-modal-dialog");
    const titleEl = inquiryModal.querySelector("#inquiry-modal-title");
    const form = inquiryModal.querySelector("form.form");
    const pageProject = getPageProject();

    const heading =
      trigger?.dataset.projectName || pageProject.name || trigger?.dataset.inquiryHeading || "Register Your Interest";
    const interest = trigger?.dataset.inquiryInterest || "";
    const projectSlug = trigger?.dataset.projectSlug || pageProject.slug;
    const projectName = trigger?.dataset.projectName || pageProject.name;

    if (titleEl) titleEl.textContent = heading;
    if (form) {
      const slugInput = form.querySelector('[name="project_slug"]');
      const nameInput = form.querySelector('[name="project_name"]');
      const interestInput = form.querySelector('[name="interest"]');
      const alertEl = form.querySelector(".form-alert");
      if (slugInput) slugInput.value = projectSlug;
      if (nameInput) nameInput.value = projectName;
      if (interestInput && interest) interestInput.value = interest;
      const messageInput = form.querySelector('[name="message"]');
      if (messageInput && projectName) {
        messageInput.value = `I'd like details on ${projectName}.`;
      }
      if (alertEl) alertEl.hidden = true;
    }

    inquiryLastFocus = document.activeElement;
    inquiryModal.hidden = false;
    inquiryModal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");
    dialog?.focus();

    const firstField = form?.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), select, textarea');
    window.requestAnimationFrame(() => firstField?.focus());
    if (form && form.dataset.opened !== "true") {
      form.dataset.opened = "true";
      track("form_open", { form_name: "project_inquiry", metadata: { placement: "inquiry_modal" } });
    }
    track("modal_open", { metadata: { placement: "inquiry_modal", interest: interest || undefined } });
  }

  function closeInquiryModal() {
    if (!inquiryModal || inquiryModal.hidden) return;
    inquiryModal.hidden = true;
    inquiryModal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("modal-open");
    if (inquiryLastFocus?.focus) inquiryLastFocus.focus();
    else document.body.focus?.();
    inquiryLastFocus = null;
  }

  function dismissInquiryModal() {
    const form = inquiryModal?.querySelector("form.form");
    if (typeof form?.__richmondAbandon === "function") {
      form.__richmondAbandon("modal_close");
    }
    closeInquiryModal();
  }

  document.querySelectorAll("[data-open-inquiry]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openInquiryModal(el);
    });
  });

  inquiryModal?.querySelector(".inquiry-modal-close")?.addEventListener("click", () => {
    dismissInquiryModal();
  });

  // Do not close on backdrop click or Escape — avoids accidental data loss.

  inquiryModal?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || inquiryModal.hidden) return;
    const focusable = inquiryModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function flagFor(code) {
    return countryUtils.flag?.(code) || "";
  }

  function resolveDefaultIso() {
    if (defaultCountryIso) return defaultCountryIso;
    return countryUtils.defaultIso?.() || "AE";
  }

  function setPickerValue(picker, country) {
    if (!picker || !country) return;
    const hidden = picker.querySelector('[name="country_code"]');
    const flagEl = picker.querySelector(".country-picker-flag");
    const dialEl = picker.querySelector(".country-picker-dial");
    if (hidden) hidden.value = country.dial;
    hidden?.dispatchEvent(new Event("change", { bubbles: true }));
    if (flagEl) flagEl.textContent = flagFor(country.code);
    if (dialEl) dialEl.textContent = country.dial;
    picker.dataset.selectedCode = country.code;
  }

  function closePicker(picker) {
    const panel = picker.querySelector(".country-picker-panel");
    const trigger = picker.querySelector(".country-picker-trigger");
    const search = picker.querySelector(".country-picker-search");
    if (panel) panel.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (search) search.value = "";
    renderPickerList(picker, "");
  }

  function openPicker(picker) {
    document.querySelectorAll("[data-country-picker]").forEach((other) => {
      if (other !== picker) closePicker(other);
    });
    const panel = picker.querySelector(".country-picker-panel");
    const trigger = picker.querySelector(".country-picker-trigger");
    const search = picker.querySelector(".country-picker-search");
    if (panel) panel.hidden = false;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    renderPickerList(picker, "");
    search?.focus();
  }

  function filterCountries(query) {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return countries;
    return countries.filter((country) => {
      const dial = country.dial.replace("+", "");
      return (
        country.name.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q) ||
        dial.includes(q) ||
        country.dial.includes(q)
      );
    });
  }

  function renderPickerList(picker, query) {
    const list = picker.querySelector(".country-picker-list");
    if (!list) return;
    const selected = picker.dataset.selectedCode;
    const matches = filterCountries(query);
    list.innerHTML = matches.length
      ? matches
          .map(
            (country) => `<li class="country-picker-option${country.code === selected ? " is-active" : ""}" role="option" aria-selected="${country.code === selected}" tabindex="-1" data-code="${country.code}" data-dial="${country.dial}">
              <span class="country-picker-option-flag" aria-hidden="true">${flagFor(country.code)}</span>
              <span class="country-picker-option-name">${country.name}</span>
              <span class="country-picker-option-dial">${country.dial}</span>
            </li>`,
          )
          .join("")
      : `<li class="country-picker-empty">No countries found</li>`;
  }

  function initCountryPicker(picker) {
    const trigger = picker.querySelector(".country-picker-trigger");
    const search = picker.querySelector(".country-picker-search");
    const list = picker.querySelector(".country-picker-list");

    trigger?.addEventListener("click", () => {
      const panel = picker.querySelector(".country-picker-panel");
      if (panel?.hidden) openPicker(picker);
      else closePicker(picker);
    });

    search?.addEventListener("input", () => {
      renderPickerList(picker, search.value);
    });

    search?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePicker(picker);
        trigger?.focus();
      }
    });

    list?.addEventListener("click", (event) => {
      const option = event.target.closest(".country-picker-option");
      if (!option) return;
      const country = countries.find((c) => c.code === option.dataset.code);
      if (country) setPickerValue(picker, country);
      closePicker(picker);
      trigger?.focus();
    });

    const iso = resolveDefaultIso();
    const country = countryUtils.byIso?.(iso) || countries[0];
    if (country) setPickerValue(picker, country);
  }

  async function loadDefaultCountry() {
    try {
      const res = await fetch("/api/geo", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (data.country) {
        defaultCountryIso = String(data.country).toUpperCase();
        document.querySelectorAll("[data-country-picker]").forEach((picker) => {
          const country = countryUtils.byIso?.(defaultCountryIso);
          if (country) setPickerValue(picker, country);
        });
      }
    } catch {
      /* keep cookie / locale fallback */
    }
  }

  document.querySelectorAll("[data-country-picker]").forEach(initCountryPicker);
  loadDefaultCountry();

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-country-picker]")) {
      document.querySelectorAll("[data-country-picker]").forEach(closePicker);
    }
  });

  function setupLeadForm(form) {
    const alertEl = form.querySelector(".form-alert");
    form.noValidate = true;
    form.dataset.startedFilling = "false";
    form.dataset.submitSucceeded = "false";
    form.dataset.submitting = "false";

    const trackedFields = new Set(["name", "email", "country_code", "phone", "interest", "message"]);
    const draftQueue = [];
    const lastValueByField = new Map();
    let draftFlushTimer = null;
    let flushInFlight = false;
    let flushPromise = Promise.resolve();
    const draftDebounceMs = 900;
    const draftBatchSize = 15;
    const maxQueueSize = 80;

    const clip = (value, maxLen) => String(value || "").trim().slice(0, maxLen);
    const cleanFieldValue = (fieldName, value) => {
      const key = clip(fieldName, 40);
      const limit = key === "message" ? 500 : 200;
      if (key === "phone") return clip(value, limit).replace(/[^\d+]/g, "");
      return clip(value, limit);
    };
    const funnelSessionId = window.RichmondAnalytics?.sessionId?.() || `${Date.now()}`;
    const sourcePage = () => clip(window.location.href, 500) || "/";
    const landingPage = sourcePage();
    const initialReferrer = clip(document.referrer, 500);

    const readProject = () => ({
      slug: clip(
        form.querySelector('[name="project_slug"]')?.value ||
          document.body?.dataset?.projectSlug ||
          "richmond-residences",
        80,
      ),
      name: clip(
        form.querySelector('[name="project_name"]')?.value ||
          document.body?.dataset?.projectName ||
          "Richmond Residences",
        120,
      ),
    });

    const buildAttribution = () => {
      const currentPage = sourcePage();
      const params = (url) => {
        try {
          return new URL(url).searchParams;
        } catch {
          return new URLSearchParams();
        }
      };
      const lp = params(landingPage);
      const cp = params(currentPage);
      const utmSource = clip(lp.get("utm_source") || cp.get("utm_source"), 120);
      const utmMedium = clip(lp.get("utm_medium") || cp.get("utm_medium"), 120);
      const referrer = initialReferrer;
      let channel = "unknown";
      if (!utmSource && !utmMedium && !referrer) channel = "direct";
      else if (/(cpc|ppc|paid|ads)/i.test(`${utmSource} ${utmMedium}`)) channel = "paid";
      else if (referrer) channel = "referral";
      return {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: clip(lp.get("utm_campaign") || cp.get("utm_campaign"), 160),
        utm_term: clip(lp.get("utm_term") || cp.get("utm_term"), 200),
        utm_content: clip(lp.get("utm_content") || cp.get("utm_content"), 200),
        referrer,
        landing_page: landingPage,
        current_page: currentPage,
        channel,
        organic_keyword: "",
      };
    };

    const readFieldValue = (fieldName) => {
      const el = form.elements.namedItem(fieldName);
      return el && "value" in el ? String(el.value || "") : "";
    };

    const snapshot = () => {
      const out = {};
      trackedFields.forEach((fieldName) => {
        out[fieldName] = cleanFieldValue(fieldName, readFieldValue(fieldName));
      });
      out.full_name = out.name || "";
      return out;
    };

    const sendDraftPayload = (payload, options = {}) => {
      const body = JSON.stringify(payload);
      if (options.preferBeacon && navigator.sendBeacon) {
        try {
          const blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon("/api/form-draft", blob)) return Promise.resolve(true);
        } catch {
          /* fetch fallback */
        }
      }
      return fetch("/api/form-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then(() => true)
        .catch(() => false);
    };

    const flushDraftQueue = async (options = {}) => {
      if (flushInFlight) return flushPromise;
      if (!draftQueue.length) return;
      if (draftFlushTimer) {
        clearTimeout(draftFlushTimer);
        draftFlushTimer = null;
      }
      const project = readProject();
      flushInFlight = true;
      flushPromise = (async () => {
        const batch = draftQueue.splice(0, draftBatchSize);
        await sendDraftPayload(
          {
            action: "capture",
            form_name: "project_inquiry",
            project_slug: project.slug,
            site_key: window.RichmondAnalytics?.SITE_KEY || "richmondresidences",
            funnel_session_id: funnelSessionId,
            source_page: sourcePage(),
            attribution: buildAttribution(),
            events: batch,
          },
          options,
        );
        flushInFlight = false;
        if (draftQueue.length) {
          draftFlushTimer = window.setTimeout(
            () => flushDraftQueue({ preferBeacon: options.preferBeacon }),
            150,
          );
        }
      })();
      return flushPromise;
    };

    const queueDraftChange = (fieldName, fieldValue, eventType) => {
      const key = clip(fieldName, 40);
      if (!trackedFields.has(key)) return;
      const value = cleanFieldValue(key, fieldValue);
      const prev = lastValueByField.get(key);
      if (prev === value && eventType === "input") return;
      lastValueByField.set(key, value);
      const project = readProject();
      draftQueue.push({
        form_name: "project_inquiry",
        project_slug: project.slug,
        site_key: window.RichmondAnalytics?.SITE_KEY || "richmondresidences",
        funnel_session_id: funnelSessionId,
        source_page: sourcePage(),
        field_name: key,
        field_value: value,
        event_type: clip(eventType, 20).toLowerCase() || "input",
        occurred_at: new Date().toISOString(),
        snapshot: snapshot(),
      });
      if (draftQueue.length > maxQueueSize) {
        draftQueue.splice(0, draftQueue.length - maxQueueSize);
      }
      if (draftFlushTimer) clearTimeout(draftFlushTimer);
      draftFlushTimer = window.setTimeout(() => flushDraftQueue(), draftDebounceMs);
    };

    const markDraftSubmitted = (submittedSnapshot) => {
      const project = readProject();
      return sendDraftPayload(
        {
          action: "mark_submitted",
          form_name: "project_inquiry",
          project_slug: project.slug,
          site_key: window.RichmondAnalytics?.SITE_KEY || "richmondresidences",
          funnel_session_id: funnelSessionId,
          source_page: sourcePage(),
          submitted_at: new Date().toISOString(),
          snapshot: submittedSnapshot || snapshot(),
          attribution: buildAttribution(),
        },
        { preferBeacon: false },
      );
    };

    const trackFormError = (errorType, errorReason) => {
      const currentSnapshot = snapshot();
      track("form_submit_error", {
        form_name: "project_inquiry",
        error_type: errorType,
        metadata: {
          error_reason: clip(errorReason, 200),
          form_status: errorType,
          snapshot: currentSnapshot,
          started_filling: form.dataset.startedFilling === "true",
          ...buildAttribution(),
        },
      });
      if (form.dataset.startedFilling !== "true") return;
      const project = readProject();
      sendDraftPayload(
        {
          action: "capture",
          form_name: "project_inquiry",
          project_slug: project.slug,
          site_key: window.RichmondAnalytics?.SITE_KEY || "richmondresidences",
          funnel_session_id: funnelSessionId,
          source_page: sourcePage(),
          attribution: buildAttribution(),
          snapshot: currentSnapshot,
          events: [
            {
              field_name: "name",
              field_value: currentSnapshot.name || "",
              event_type: "error",
              source_page: sourcePage(),
              occurred_at: new Date().toISOString(),
              snapshot: currentSnapshot,
            },
          ],
        },
        { preferBeacon: true },
      ).catch(() => {});
    };

    const fieldHints = () => {
      const snap = snapshot();
      const hints = {};
      if (snap.name) hints.full_name = snap.name;
      if (snap.email) hints.email = snap.email;
      if (snap.phone) {
        const dial = snap.country_code || "+971";
        hints.phone = snap.phone.startsWith("+") ? snap.phone : `${dial}${snap.phone.replace(/^0+/, "")}`;
      }
      if (snap.message) hints.message = snap.message;
      return hints;
    };

    const hasContactSnapshot = (snap) => Boolean(snap.name || snap.email || snap.phone);

    const notifyAbandon = (reason) => {
      if (form.dataset.submitSucceeded === "true") return;
      if (form.dataset.submitting === "true") return;
      if (form.dataset.startedFilling !== "true") return;
      if (form.dataset.abandonSent === "true") return;
      const currentSnapshot = snapshot();
      if (!hasContactSnapshot(currentSnapshot)) return;

      form.dataset.abandonSent = "true";
      const project = readProject();
      const hints = fieldHints();
      const attribution = buildAttribution();

      sendDraftPayload(
        {
          action: "abandon",
          form_name: "project_inquiry",
          project_slug: project.slug,
          site_key: window.RichmondAnalytics?.SITE_KEY || "richmondresidences",
          funnel_session_id: funnelSessionId,
          source_page: sourcePage(),
          attribution,
          snapshot: currentSnapshot,
          abandon_reason: clip(reason, 80) || "leave",
        },
        { preferBeacon: true },
      );

      track("form_abandon", {
        form_name: "project_inquiry",
        metadata: {
          started_filling: true,
          snapshot: currentSnapshot,
          field_hints: hints,
          form_status: "abandoned",
          abandon_reason: reason || "leave",
          funnel_session_id: funnelSessionId,
          ...attribution,
        },
      });

      flushDraftQueue({ preferBeacon: true });
    };

    const abandonForm = (reason) => {
      notifyAbandon(reason);
    };

    form.__richmondAbandon = abandonForm;

    window.addEventListener("pagehide", () => {
      notifyAbandon("pagehide");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        notifyAbandon("visibility_hidden");
      }
    });

    const fieldFromTarget = (target) => {
      if (
        !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)
      ) {
        return null;
      }
      const fieldName = String(target.name || "").trim();
      if (!trackedFields.has(fieldName)) return null;
      return { fieldName, fieldValue: target.value };
    };

    form.addEventListener("input", (event) => {
      if (form.dataset.startedFilling !== "true") {
        form.dataset.startedFilling = "true";
        track("form_start", { form_name: "project_inquiry" });
      }
      const data = fieldFromTarget(event.target);
      if (!data || data.fieldName === "phone") return;
      queueDraftChange(data.fieldName, data.fieldValue, "input");
    });

    form.addEventListener("change", (event) => {
      const data = fieldFromTarget(event.target);
      if (!data) return;
      queueDraftChange(data.fieldName, data.fieldValue, "change");
    });

    form.addEventListener(
      "blur",
      (event) => {
        const data = fieldFromTarget(event.target);
        if (!data) return;
        queueDraftChange(data.fieldName, data.fieldValue, "blur");
      },
      true,
    );

    form.querySelector('[name="phone"]')?.addEventListener("input", (event) => {
      if (form.dataset.startedFilling !== "true") {
        form.dataset.startedFilling = "true";
        track("form_start", { form_name: "project_inquiry" });
      }
      queueDraftChange("phone", event.target.value, "input");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const honeypot = form.querySelector('[name="website"]');
      if (honeypot?.value) return;

      const name = String(form.querySelector('[name="name"]')?.value || "").trim();
      const email = String(form.querySelector('[name="email"]')?.value || "").trim();
      const countryCode = String(form.querySelector('[name="country_code"]')?.value || "+971");
      const phone = String(form.querySelector('[name="phone"]')?.value || "").trim();
      const interest =
        String(form.querySelector('[name="interest"]')?.value || "").trim() || "General enquiry";
      const project = readProject();

      if (!name || !validEmail(email) || !phone) {
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Please complete all required fields.";
          alertEl.className = "form-alert form-alert-error";
        }
        trackFormError("validation", "Incomplete required fields");
        return;
      }

      submitBtn.disabled = true;
      form.dataset.submitting = "true";
      const submitLabel = submitBtn.dataset.submitLabel || submitBtn.textContent.trim();
      submitBtn.dataset.submitLabel = submitLabel;
      submitBtn.textContent = "Submitting…";
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.classList.add("is-loading");
      if (alertEl) alertEl.hidden = true;

      await flushDraftQueue({ preferBeacon: true });

      const submittedSnapshot = snapshot();
      const payload = {
        name,
        full_name: name,
        email,
        country_code: countryCode,
        phone,
        interest,
        project_slug: project.slug,
        project_name: project.name,
        source_page: window.location.href,
        funnel_session_id: funnelSessionId,
        attribution: buildAttribution(),
        tu_hp_confirm: "",
      };

      track("form_submit", {
        form_name: "project_inquiry",
        metadata: { snapshot: submittedSnapshot, field_hints: submittedSnapshot },
      });

      try {
        const res = await fetch("/api/enquire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Submission failed");
        }
        form.dataset.submitSucceeded = "true";
        form.dataset.submitting = "false";
        form.dataset.abandonSent = "true";
        form.reset();
        form.querySelectorAll("[data-country-picker]").forEach((picker) => {
          const iso = resolveDefaultIso();
          const country = countryUtils.byIso?.(iso) || countries[0];
          if (country) setPickerValue(picker, country);
        });
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Thank you. We will send Richmond Residences details shortly.";
          alertEl.className = "form-alert form-alert-success";
        }
        submitBtn.textContent = "Submitted";
        submitBtn.removeAttribute("aria-busy");
        submitBtn.classList.remove("is-loading");
        track("form_success", {
          form_name: "project_inquiry",
          metadata: { snapshot: submittedSnapshot },
        });
        track("generate_lead", { form_name: "project_inquiry" });
        markDraftSubmitted(submittedSnapshot).catch(() => {});
        if (form.closest("#inquiry-modal") && !inquiryModal?.hidden) {
          window.setTimeout(() => closeInquiryModal(), 2200);
        }
      } catch (err) {
        const message = String(err?.message || err || "Something went wrong. Please try again.");
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Something went wrong. Please try again.";
          alertEl.className = "form-alert form-alert-error";
        }
        trackFormError("persist", message);
      } finally {
        form.dataset.submitting = "false";
        submitBtn.classList.remove("is-loading");
        submitBtn.removeAttribute("aria-busy");
        if (form.dataset.submitSucceeded === "true") {
          submitBtn.disabled = true;
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.submitLabel || "Register interest";
        }
      }
    });
  }

  forms.forEach(setupLeadForm);

  const floatRegister = document.getElementById("float-register");
  const footer = document.querySelector(".site-footer");

  if (floatRegister) {
    const showAfter = 120;

    function updateFloatRegister() {
      const scrolled = window.scrollY > showAfter;
      const footerVisible =
        footer &&
        footer.getBoundingClientRect().top < window.innerHeight - 64;
      const visible = scrolled && !footerVisible;
      floatRegister.classList.toggle("is-visible", visible);
      floatRegister.setAttribute("aria-hidden", String(!visible));
    }

    window.addEventListener("scroll", updateFloatRegister, { passive: true });
    updateFloatRegister();
  }
})();
