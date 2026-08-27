(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const forms = document.querySelectorAll("form.form");
  const track = (name, extra) => window.RichmondAnalytics?.track(name, extra);

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

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setupLeadForm(form) {
    const alertEl = form.querySelector(".form-alert");
    form.noValidate = true;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector('[type="submit"]');
      const honeypot = form.querySelector('[name="website"]');
      if (honeypot?.value) return;

      const name = String(form.querySelector('[name="name"]')?.value || "").trim();
      const email = String(form.querySelector('[name="email"]')?.value || "").trim();
      const countryCode = String(form.querySelector('[name="country_code"]')?.value || "+971");
      const phone = String(form.querySelector('[name="phone"]')?.value || "").trim();
      const interest = String(form.querySelector('[name="interest"]')?.value || "").trim();

      if (!name || !validEmail(email) || !phone || !interest) {
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Please complete all required fields.";
          alertEl.className = "form-alert form-alert-error";
        }
        track("form_error", { error_type: "validation", metadata: { placement: "lead_form" } });
        return;
      }

      submitBtn.disabled = true;
      if (alertEl) alertEl.hidden = true;

      const projectSlug = String(form.querySelector('[name="project_slug"]')?.value || "richmond-residences").trim();
      const projectName = String(form.querySelector('[name="project_name"]')?.value || "Richmond Residences").trim();

      const payload = {
        name,
        full_name: name,
        email,
        country_code: countryCode,
        phone,
        interest,
        project_slug: projectSlug,
        project_name: projectName,
        source_page: window.location.href,
        funnel_session_id: window.RichmondAnalytics?.sessionId?.(),
        tu_hp_confirm: "",
      };

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
        form.reset();
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Thank you. We will send Richmond Residences details shortly.";
          alertEl.className = "form-alert form-alert-success";
        }
        track("form_success", { metadata: { placement: "lead_form" } });
      } catch (err) {
        if (alertEl) {
          alertEl.hidden = false;
          alertEl.textContent = "Something went wrong. Please try again.";
          alertEl.className = "form-alert form-alert-error";
        }
        track("form_error", {
          error_type: "submit",
          metadata: { placement: "lead_form", message: String(err?.message || err) },
        });
      } finally {
        submitBtn.disabled = false;
      }
    });

    form.addEventListener("focusin", () => {
      if (form.dataset.startedFilling !== "true") {
        form.dataset.startedFilling = "true";
        track("form_start", { metadata: { placement: "lead_form" } });
      }
    });
  }

  forms.forEach(setupLeadForm);
})();
