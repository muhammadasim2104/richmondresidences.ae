#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://richmondresidences.ae";
const ASSET_VERSION = "20260828a";
const OG_CORAL = `${SITE}/images/coral-bay/og-image.webp`;

const GEO = {
  region: "AE-DU",
  placename: "Al Furjan, Dubai",
  lat: 25.0283,
  lng: 55.1458,
};

const LOGO = `${SITE}/images/logos/richmond-logo.png`;
const LOGO_ALT = "John Richmond District — Richmond Residences";
const OG_IMAGE = `${SITE}/images/hero/hero-night.webp`;
const DISCLAIMER =
  "richmondresidences.ae is an independent marketing site for Richmond Residences developments by Mira Developments, including Al Furjan, Dubai and Mira Coral Bay, Ras Al Khaimah. This is not the official Mira Developments website. Project details, pricing, and availability are subject to change and should be verified with Mira Developments or an authorized representative.";

const UNITS = [
  { type: "Studio", slug: "studio", sqm: 39, sqft: 420, aed: 943500, usd: 256909 },
  { type: "1-Bedroom", slug: "1-bedroom", sqm: 87.9, sqft: 946, aed: 1871700, usd: 509653 },
  { type: "2-Bedroom", slug: "2-bedroom", sqm: 123, sqft: 1322, aed: 2584680, usd: 703793 },
];

const NAV_LINKS = [
  { href: "/#overview", label: "Overview" },
  { href: "/price-list/", label: "Pricing" },
  { href: "/floor-plans/", label: "Floor Plans" },
  { href: "/brochure/", label: "Brochure" },
  { href: "/payment-plan/", label: "Payment Plan" },
  { href: "/al-furjan-properties/", label: "Al Furjan" },
  { href: "/#amenities", label: "Amenities" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/#flagship-projects", label: "RAK" },
];

const FOOTER_LINKS = [
  { href: "/", label: "Richmond Residences" },
  { href: "/brochure/", label: "Brochure" },
  { href: "/floor-plans/", label: "Floor Plans" },
  { href: "/price-list/", label: "Price List" },
  { href: "/payment-plan/", label: "Payment Plan" },
  { href: "/al-furjan-properties/", label: "Properties in Al Furjan" },
  { href: "/richmond-residences-mira-coral-bay/", label: "Mira Coral Bay, RAK" },
];

const INTEREST_OPTIONS = [
  "Brochure & Project Details",
  "Floor Plans",
  "Price List & Availability",
  "Payment Plan",
  "Investment Opportunity",
  "General Enquiry",
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtAed(n) {
  return n.toLocaleString("en-US");
}

function jsonLd(data) {
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

function assetPrefix(depth) {
  return depth > 0 ? "../".repeat(depth) : "./";
}

function breadcrumbs(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

function realEstateListingSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: "Richmond Residences (Richmond District) by Mira Developments",
    description:
      "Studios and 1-2 bedroom fully furnished apartments at Richmond Residences, officially Richmond District, in Al Furjan, Dubai.",
    url: SITE,
    datePosted: "2026-08-27",
    image: OG_IMAGE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Al Furjan",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.lat,
      longitude: GEO.lng,
    },
    offers: UNITS.map((u) => ({
      "@type": "Offer",
      name: `${u.type} Apartment`,
      price: String(u.aed),
      priceCurrency: "AED",
      availability: "https://schema.org/PreOrder",
      url: `${SITE}/price-list/`,
      description: `From ${u.sqm} sqm / ${u.sqft} sqft`,
    })),
  };
}

function faqSchema(faqs) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a.replace(/<[^>]+>/g, "") },
    })),
  });
}

function pricingTable() {
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Unit Type</th><th>Size</th><th>Starting Price (AED)</th><th>Starting Price (USD)</th></tr></thead>
    <tbody>${UNITS.map(
      (u) => `<tr>
        <td>${esc(u.type)}</td>
        <td>from ${u.sqm} sqm / ${fmtAed(u.sqft)} sqft</td>
        <td>AED ${fmtAed(u.aed)}</td>
        <td>USD ${fmtAed(u.usd)}</td>
      </tr>`,
    ).join("\n")}</tbody>
  </table></div>`;
}

function leadForm(depth, opts = {}) {
  const prefix = assetPrefix(depth);
  const sourcePage = opts.sourcePage || SITE + (opts.path || "/");
  const heading = opts.heading || "Register Your Interest";
  const sub =
    opts.sub ||
    "Request the Richmond Residences brochure, floor plans, price list, or payment plan details.";
  const button = opts.button || "Submit Enquiry";
  const id = opts.id || "register";
  const defaultInterest = opts.defaultInterest || "";
  const projectSlug = opts.projectSlug || "richmond-residences";
  const projectName = opts.projectName || "Richmond Residences";
  const consentText =
    opts.consentText ||
    "By submitting, you consent to be contacted regarding Richmond Residences (Richmond District). Your information will not be shared beyond authorised project representatives.";

  const options = INTEREST_OPTIONS.map(
    (o) =>
      `<option value="${esc(o)}"${o === defaultInterest ? " selected" : ""}>${esc(o)}</option>`,
  ).join("\n");

  return `
    <section class="section section-form" id="${esc(id)}">
      <div class="container">
        <div class="form-layout">
          <div class="form-copy">
            <p class="eyebrow">Get in touch</p>
            <h2>${esc(heading)}</h2>
            <p>${esc(sub)}</p>
            <p class="form-consent">${esc(consentText)}</p>
          </div>
          <form class="form" action="${prefix}api/enquire" method="post" novalidate>
            <input type="hidden" name="source_page" value="${esc(sourcePage)}">
            <input type="hidden" name="project_slug" value="${esc(projectSlug)}">
            <input type="hidden" name="project_name" value="${esc(projectName)}">
            <div class="form-alert" role="status" aria-live="polite" hidden></div>
            <label class="field">
              <span>Full Name</span>
              <input type="text" name="name" autocomplete="name" required maxlength="200">
            </label>
            <label class="field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required maxlength="200">
            </label>
            <div class="field phone-field">
              <span>Phone</span>
              <div class="phone-row">
                <select name="country_code" aria-label="Country code" required>
                  <option value="+971" selected>+971</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+966">+966</option>
                  <option value="+974">+974</option>
                  <option value="+965">+965</option>
                  <option value="+973">+973</option>
                  <option value="+968">+968</option>
                  <option value="+61">+61</option>
                  <option value="+33">+33</option>
                  <option value="+49">+49</option>
                </select>
                <input type="tel" name="phone" autocomplete="tel-national" inputmode="tel" required maxlength="30">
              </div>
            </div>
            <label class="field">
              <span>What would you like to receive?</span>
              <select name="interest" required>
                <option value="">Select an option</option>
                ${options}
              </select>
            </label>
            <label class="field visually-hidden" aria-hidden="true">
              <span>Website</span>
              <input type="text" name="website" tabindex="-1" autocomplete="off">
            </label>
            <input type="hidden" name="tu_hp_confirm" value="">
            <button type="submit" class="btn btn-accent btn-block">${esc(button)}</button>
          </form>
        </div>
      </div>
    </section>`;
}

function nav(depth) {
  const root = depth > 0 ? "../".repeat(depth) : "./";
  return `
    <header class="nav-wrap">
      <nav class="nav container" aria-label="Primary">
        <a class="nav-brand" href="${root}" aria-label="Richmond Residences home">
          <img src="${root}images/logos/richmond-logo.png" alt="${esc(LOGO_ALT)}" class="nav-logo" width="160" height="48">
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links">
          ${NAV_LINKS.map((link) => {
            const href = link.href.startsWith("/#")
              ? `${root}${link.href.slice(1)}`
              : `${root}${link.href.replace(/^\//, "")}`;
            return `<a href="${href}">${esc(link.label)}</a>`;
          }).join("\n          ")}
          <a class="btn btn-accent btn-sm" href="${root}#register" data-open-register>Register</a>
        </div>
      </nav>
    </header>`;
}

function footer(depth) {
  const prefix = assetPrefix(depth);
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <img src="${prefix}images/logos/richmond-logo.png" alt="${esc(LOGO_ALT)}" class="footer-logo" width="140" height="42">
          <p class="footer-tag">Richmond District by Mira Developments — Al Furjan, Dubai &amp; Mira Coral Bay, RAK</p>
        </div>
        <nav class="footer-links" aria-label="Footer">
          ${FOOTER_LINKS.map(
            (link) =>
              `<a href="${prefix}${link.href.replace(/^\//, "")}">${esc(link.label)}</a>`,
          ).join("\n          ")}
        </nav>
      </div>
      <div class="container">
        <p class="disclaimer">${esc(DISCLAIMER)}</p>
        <p class="footer-meta">Mira Developments — TRN 104070222500003, Trade License No. 1075912</p>
        <p class="footer-copy">&copy; ${new Date().getFullYear()} richmondresidences.ae. All rights reserved.</p>
      </div>
    </footer>`;
}

function pageShell({ depth, title, description, canonical, path, schemas, body, keywords, geo, ogImage }) {
  const prefix = assetPrefix(depth);
  const cssHref = `${prefix}css/styles.css?v=${ASSET_VERSION}`;
  const jsTracker = `${prefix}js/tracker.js?v=${ASSET_VERSION}`;
  const jsMain = `${prefix}js/main.js?v=${ASSET_VERSION}`;
  const pageGeo = geo || GEO;
  const pageOg = ogImage || OG_IMAGE;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="geo.region" content="${pageGeo.region}">
  <meta name="geo.placename" content="${esc(pageGeo.placename)}">
  <meta name="geo.position" content="${pageGeo.lat};${pageGeo.lng}">
  <meta name="ICBM" content="${pageGeo.lat}, ${pageGeo.lng}">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ""}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${pageOg}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Richmond Residences">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${pageOg}">
  <link rel="icon" href="${prefix}images/logos/richmond-logo.png" type="image/png">
  <link rel="manifest" href="${prefix}manifest.json">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssHref}">
  <script src="${jsTracker}" defer></script>
  ${schemas.join("\n  ")}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav(depth)}
  <main id="main">${body}</main>
  ${footer(depth)}
  <script src="${jsMain}" defer></script>
</body>
</html>`;
}

function faqBlock(faqs) {
  return `
    <section class="section section-alt" id="faqs">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">FAQs</p>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div class="faq-list">
          ${faqs
            .map(
              (faq) => `
            <details class="faq-item">
              <summary>${esc(faq.q)}</summary>
              <div class="faq-answer"><p>${faq.a}</p></div>
            </details>`,
            )
            .join("\n")}
        </div>
      </div>
    </section>`;
}

function subpageHero(title, lead) {
  return `
    <section class="page-hero section">
      <div class="container">
        <p class="eyebrow">Richmond Residences · Richmond District</p>
        <h1>${title}</h1>
        <p class="page-lead">${lead}</p>
      </div>
    </section>`;
}

function backLink(depth, text) {
  const prefix = assetPrefix(depth);
  return `<p class="back-link"><a href="${prefix}">${esc(text)}</a></p>`;
}

const HOME_FAQS = [
  {
    q: "What is Richmond Residences (Richmond District) by Mira Developments?",
    a: "Richmond Residences is the marketing name for Richmond District, a new residential masterplan in Al Furjan, Dubai, developed by Mira Developments in partnership with British fashion house John Richmond. The project comprises five residential towers and one office building connected by a shared podium with retail, wellness, and leisure facilities. Tower 1 is the first residential release and is now available.",
  },
  {
    q: "What apartment types are available at Richmond Residences Al Furjan?",
    a: "Richmond Residences Al Furjan offers studios, 1-bedroom, and 2-bedroom apartments. Every home is fully furnished with interiors designed by John Richmond, including furniture, fixtures, materials, and finishes — delivered move-in ready at handover.",
  },
  {
    q: "What are the prices at Richmond Residences, Al Furjan?",
    a: "Studios start from AED 943,500 (USD 256,909) at 39 sqm / 420 sqft. 1-bedroom apartments start from AED 1,871,700 (USD 509,653) at 87.9 sqm / 946 sqft. 2-bedroom apartments start from AED 2,584,680 (USD 703,793) at 123 sqm / 1,322 sqft.",
  },
  {
    q: "What is the payment plan for Richmond District?",
    a: "Richmond District follows a 45/5/50 payment structure: 45% is payable during the construction period before handover, 5% is due upon completion, and the remaining 50% is spread across 39 months after handover.",
  },
  {
    q: "When is the handover date for Richmond Residences?",
    a: "Handover for Tower 1 at Richmond Residences is scheduled for Q1 2029. Tower 1 is the first residential tower released within the Richmond District masterplan.",
  },
  {
    q: "Where is Richmond District located in Dubai?",
    a: "Richmond District sits in Al Furjan, Dubai, directly next to Discovery Gardens Metro Station. From the site, Bluewaters Island is 8 minutes away, Palm Jumeirah 10 minutes, Downtown Dubai 18 minutes, and Al Maktoum International Airport 20 minutes.",
  },
  {
    q: "What amenities does Richmond Residences Al Furjan offer?",
    a: "Residents have access to three resort-style pools, decorative water features, a luxury lobby, spa and wellness facilities, a state-of-the-art gym, an outdoor fitness area, a padel court, a yoga zone, cafés, restaurants, and retail within the shared podium. Valet parking, concierge, housekeeping, cleaning, and in-residence dining are included as 5-star hotel-level services.",
  },
  {
    q: "Who is the developer of Richmond District?",
    a: "Richmond District is developed by Mira Developments, a Dubai-based developer (TRN 104070222500003, Trade License No. 1075912). This is Mira's first residential collaboration with John Richmond. Mira has previously partnered with Bentley Home, ETRO Home, ELIE SAAB, Jacob &amp; Co., Trussardi, and Gianfranco Ferré Home.",
  },
  {
    q: "How do I get the Richmond Residences brochure, floor plans, or price list?",
    a: "Submit the enquiry form on this site to request the Richmond District brochure, detailed floor plan PDFs, or the current price list and unit availability. A project representative will follow up with the materials you need.",
  },
];

function homePage() {
  const title = "Richmond Residences (Richmond District) by Mira | New Launch, Al Furjan Dubai";
  const description =
    "Richmond Residences, officially Richmond District, by Mira Developments in Al Furjan, Dubai. Studios and 1-2 bed apartments from AED 943,500. Register for the brochure, price list, and payment plan.";
  const keywords =
    "Richmond Residences, Richmond District, Richmond Residences Al Furjan, Richmond District Al Furjan, Richmond Residences by Mira, Richmond District by Mira, New Launch at Al Furjan, Richmond District brochure, Richmond District payment plan, Richmond District floor plans, Richmond District price, Properties in Al Furjan";

  const schemas = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Richmond Residences",
      url: SITE,
    }),
    jsonLd(realEstateListingSchema()),
    jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }])),
    faqSchema(HOME_FAQS),
  ];

  const body = `
    <section class="hero section">
      <div class="hero-bg" style="background-image:url('./images/hero/hero-night.webp')"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow eyebrow-light">New Launch at Al Furjan</p>
          <h1>Richmond Residences by Mira Developments — Al Furjan, Dubai</h1>
          <p class="hero-sub">Known officially as <strong>Richmond District</strong>, this is Dubai's first John Richmond-branded residential community — studios and 1-2 bedroom apartments from <strong>AED 943,500</strong>.</p>
          <div class="hero-stats">
            <div><span class="stat-label">From</span><span class="stat-value">AED 943,500</span></div>
            <div><span class="stat-label">Handover</span><span class="stat-value">Q1 2029</span></div>
            <div><span class="stat-label">Payment</span><span class="stat-value">45/5/50</span></div>
          </div>
        </div>
        <div class="hero-form-card">
          <h2>Register Your Interest</h2>
          <p>Request the Richmond District brochure, price list, and payment plan.</p>
          <form class="form form-compact" action="./api/enquire" method="post" novalidate>
            <input type="hidden" name="source_page" value="${SITE}/">
            <input type="hidden" name="project_slug" value="richmond-residences">
            <div class="form-alert" role="status" aria-live="polite" hidden></div>
            <label class="field"><span>Name</span><input type="text" name="name" required maxlength="200"></label>
            <label class="field"><span>Email</span><input type="email" name="email" required maxlength="200"></label>
            <div class="field phone-field"><span>Phone</span><div class="phone-row">
              <select name="country_code"><option value="+971" selected>+971</option><option value="+44">+44</option><option value="+1">+1</option></select>
              <input type="tel" name="phone" required maxlength="30">
            </div></div>
            <label class="field"><span>Interest</span><select name="interest" required>
              <option value="">Select</option>
              ${INTEREST_OPTIONS.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}
            </select></label>
            <label class="field visually-hidden"><input type="text" name="website" tabindex="-1"></label>
            <input type="hidden" name="tu_hp_confirm" value="">
            <button type="submit" class="btn btn-accent btn-block">Register Interest</button>
          </form>
        </div>
      </div>
    </section>

    <section class="section" id="overview">
      <div class="container split-grid">
        <div class="stack">
          <div class="section-head">
            <p class="eyebrow">Project overview</p>
            <h2>Richmond District — A Branded Masterplan in Al Furjan</h2>
          </div>
          <p>Richmond Residences, known officially as Richmond District, is a new integrated community in Al Furjan developed by Mira Developments. The masterplan brings together five residential buildings and one office tower, all linked by a shared podium offering retail, wellness, and leisure at ground level.</p>
          <p>This marks Mira Developments' first residential partnership with John Richmond, the British fashion house established in London in the 1980s — and the first John Richmond-branded homes anywhere in Dubai. Tower 1, the opening residential phase, is now launched.</p>
          <p>Mira Developments has built a track record of branded collaborations including Bentley Home, ETRO Home, ELIE SAAB, Jacob &amp; Co., Trussardi, and Gianfranco Ferré Home.</p>
        </div>
        <figure class="media-frame">
          <img src="./images/exterior/ext-1.webp" alt="Richmond District exterior rendering at night, Al Furjan" width="800" height="600" loading="lazy">
        </figure>
      </div>
    </section>

    <section class="section section-alt" id="pricing">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Unit types &amp; pricing</p>
          <h2>Richmond Residences Al Furjan — Apartments &amp; Starting Prices</h2>
          <p>All residences are fully furnished by John Richmond and delivered move-in ready. <a href="./price-list/">View the full Richmond District price list</a> or <a href="./floor-plans/">request floor plans</a>.</p>
        </div>
        ${pricingTable()}
        <div class="cta-row">
          <a class="btn btn-accent" href="./price-list/">Richmond District Price List</a>
          <a class="btn btn-outline" href="./payment-plan/">Payment Plan Details</a>
        </div>
      </div>
    </section>

    <section class="section" id="architecture">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Architecture &amp; design</p>
          <h2>Mashrabiya Façades &amp; John Richmond Interiors</h2>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <img src="./images/exterior/ext-3.webp" alt="Operable mashrabiya screens on Richmond District tower façades" loading="lazy">
            <h3>Operable Mashrabiya Screens</h3>
            <p>The building exteriors feature traditional mashrabiya screens that residents can open and close. These elements add privacy, cut heat gain in summer, and still let daylight through — so the façade shifts in character as light changes through the day.</p>
          </article>
          <article class="feature-card">
            <img src="./images/interior/int-2.webp" alt="Fully furnished living room designed by John Richmond" loading="lazy">
            <h3>Move-In Ready by John Richmond</h3>
            <p>Each apartment arrives fully furnished with interiors conceived by John Richmond. Furniture, fixtures, materials, and finishes are all included — so owners receive a complete home at handover, not an empty shell.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-dark" id="amenities">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow eyebrow-light">Amenities</p>
          <h2>Lifestyle Podium at Richmond Residences</h2>
          <p class="text-light">The shared podium connects all towers with resort-grade facilities and everyday conveniences on site.</p>
        </div>
        <ul class="amenity-grid">
          <li>Three resort-style pools</li>
          <li>Decorative water features</li>
          <li>Luxury lobby</li>
          <li>Spa and wellness facilities</li>
          <li>State-of-the-art gym</li>
          <li>Outdoor fitness area</li>
          <li>Padel court</li>
          <li>Yoga zone</li>
          <li>Cafés and restaurants</li>
          <li>Retail within the shared podium</li>
        </ul>
        <div class="gallery-grid">
          <img src="./images/amenities/pool.webp" alt="Resort-style pool at Richmond District" loading="lazy">
          <img src="./images/amenities/lobby.webp" alt="Luxury lobby at Richmond Residences" loading="lazy">
          <img src="./images/amenities/gym.webp" alt="State-of-the-art gym" loading="lazy">
          <img src="./images/amenities/padel.webp" alt="Padel court" loading="lazy">
        </div>
        <div class="services-block">
          <h3>5-Star Hotel-Level Services</h3>
          <p>Valet parking, concierge, housekeeping, cleaning, and in-residence dining are provided as standard for Richmond District residents.</p>
        </div>
      </div>
    </section>

    <section class="section" id="location">
      <div class="container split-grid">
        <div class="stack">
          <div class="section-head">
            <p class="eyebrow">Location</p>
            <h2>Richmond District Al Furjan — Metro-Connected Living</h2>
          </div>
          <p>Richmond Residences sits in Al Furjan, directly beside Discovery Gardens Metro Station — giving residents immediate access to Dubai's metro network without relying on a car.</p>
          <ul class="proximity-list">
            <li><strong>0 min</strong> Discovery Gardens Metro Station</li>
            <li><strong>8 min</strong> Bluewaters Island</li>
            <li><strong>10 min</strong> Palm Jumeirah</li>
            <li><strong>18 min</strong> Downtown Dubai</li>
            <li><strong>20 min</strong> Al Maktoum International Airport</li>
          </ul>
          <p><a href="./al-furjan-properties/">Read our guide to properties in Al Furjan</a> and how Richmond Residences fits the neighbourhood.</p>
        </div>
        <figure class="media-frame">
          <img src="./images/location/al-furjan.jpg" alt="Al Furjan neighbourhood context map" loading="lazy">
        </figure>
      </div>
    </section>

    <section class="section section-alt" id="investment">
      <div class="container stack">
        <div class="section-head">
          <p class="eyebrow">Investment appeal</p>
          <h2>Why Consider Richmond Residences by Mira</h2>
        </div>
        <div class="invest-grid">
          <article>
            <h3>Mira Care Warranty</h3>
            <p>Every Richmond District home includes Mira Care — described as the UAE's first five-year maintenance warranty. It covers core building systems, structural elements, MEP installations, lighting, and paintwork. Furniture carries a three-year warranty; fixtures are covered for five years.</p>
          </article>
          <article>
            <h3>45/5/50 Payment Plan</h3>
            <p>The 45/5/50 structure splits payments across construction (45%), completion (5%), and a 39-month post-handover period for the remaining 50%. This gives buyers time to settle the balance after taking possession. <a href="./payment-plan/">See the Richmond District payment plan breakdown</a>.</p>
          </article>
          <article>
            <h3>Metro-Driven Rental Demand</h3>
            <p>Direct adjacency to Discovery Gardens Metro Station puts Richmond Residences Al Furjan within reach of major employment and leisure hubs across Dubai. Fully furnished, hotel-serviced apartments near a metro stop tend to attract strong tenant interest in established communities like Al Furjan.</p>
          </article>
        </div>
      </div>
    </section>

    ${faqBlock(HOME_FAQS)}
    ${leadForm(0, { heading: "Request Brochure, Floor Plans &amp; Price List", sub: "Complete the form and a representative will send Richmond District materials and current availability." })}
    ${coralBay.flagshipSection()}
  `;

  return pageShell({ depth: 0, title, description, canonical: `${SITE}/`, path: "/", keywords, schemas, body });
}

function brochurePage() {
  const title = "Richmond Residences Brochure | Richmond District by Mira, Al Furjan";
  const description =
    "Request the Richmond Residences (Richmond District) brochure — project overview, unit types, amenities, payment plan, and handover details for Al Furjan, Dubai.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }, { name: "Brochure", path: "/brochure/" }]))];

  const body = `
    ${subpageHero("Richmond Residences Brochure", "Project fact sheet for Richmond District by Mira Developments in Al Furjan, Dubai.")}
    ${backLink(1, "Back to Richmond Residences homepage")}
    <section class="section">
      <div class="container stack prose-full">
        <h2>Richmond District — Project Summary</h2>
        <p>Richmond Residences, officially Richmond District, is a branded residential masterplan in Al Furjan developed by Mira Developments in collaboration with John Richmond. The development includes five residential towers, one office tower, and a shared podium with retail, wellness, and leisure facilities.</p>
        <h3>Unit Types</h3>
        ${pricingTable()}
        <h3>Payment Plan</h3>
        <p>45/5/50 — 45% during construction, 5% on completion, 50% over 39 months post-handover.</p>
        <h3>Handover</h3>
        <p>Tower 1 handover: Q1 2029.</p>
        <h3>Key Amenities</h3>
        <p>Three resort-style pools, decorative water features, luxury lobby, spa and wellness, gym, outdoor fitness, padel court, yoga zone, cafés, restaurants, retail, plus valet, concierge, housekeeping, cleaning, and in-residence dining.</p>
        <p>Submit the form below to receive the full Richmond District brochure and current availability. We do not link directly to third-party hosted PDFs — materials are shared upon verified enquiry.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/brochure/", defaultInterest: "Brochure & Project Details", heading: "Request the Richmond District Brochure", button: "Request Brochure" })}
  `;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/brochure/`,
    path: "/brochure/",
    schemas,
    body,
  });
}

function floorPlansPage() {
  const title = "Richmond Residences Floor Plans | Studios & 1-2 Bed, Al Furjan";
  const description =
    "Richmond District floor plans for studios, 1-bedroom, and 2-bedroom apartments in Al Furjan. Sizes from 39 sqm. Request detailed layout PDFs.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }, { name: "Floor Plans", path: "/floor-plans/" }]))];

  const unitSections = UNITS.map(
    (u) => `
    <article class="unit-card">
      <img src="../images/interior/int-${u.slug === "studio" ? "1" : u.slug === "1-bedroom" ? "3" : "5"}.webp" alt="${esc(u.type)} apartment interior at Richmond Residences" loading="lazy">
      <h2>${esc(u.type)}</h2>
      <p>From ${u.sqm} sqm / ${fmtAed(u.sqft)} sqft · Starting AED ${fmtAed(u.aed)}</p>
      <p>Fully furnished by John Richmond. Detailed layout drawings are available on request — register below for the ${esc(u.type.toLowerCase())} floor plan PDF.</p>
    </article>`,
  ).join("\n");

  const body = `
    ${subpageHero("Richmond Residences Floor Plans", "Studios and 1-2 bedroom apartments at Richmond District Al Furjan — sizes and starting prices confirmed; full layout PDFs on request.")}
    ${backLink(1, "Return to Richmond District by Mira")}
    <section class="section">
      <div class="container">
        <div class="unit-grid">${unitSections}</div>
        <p class="section-note">Specific unit layouts vary by floor and orientation. Submit an enquiry to receive current Richmond District floor plan PDFs matched to available inventory.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/floor-plans/", defaultInterest: "Floor Plans", heading: "Request Richmond District Floor Plans", button: "Request Floor Plans" })}
  `;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/floor-plans/`,
    path: "/floor-plans/",
    schemas,
    body,
  });
}

function paymentPlanPage() {
  const title = "Richmond Residences Payment Plan | 45/5/50, Al Furjan Dubai";
  const description =
    "Richmond District payment plan: 45% during construction, 5% on completion, 50% over 39 months post-handover. Full breakdown for Richmond Residences Al Furjan.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }, { name: "Payment Plan", path: "/payment-plan/" }]))];

  const body = `
    ${subpageHero("Richmond Residences Payment Plan", "The Richmond District 45/5/50 structure explained for buyers and investors.")}
    ${backLink(1, "Richmond Residences Al Furjan — Overview")}
    <section class="section">
      <div class="container stack">
        <h2>45/5/50 Payment Structure</h2>
        <div class="payment-cards">
          <article class="payment-card">
            <span class="payment-pct">45%</span>
            <h3>During Construction</h3>
            <p>Forty-five percent of the purchase price is payable in instalments throughout the construction period, before handover of Tower 1.</p>
          </article>
          <article class="payment-card">
            <span class="payment-pct">5%</span>
            <h3>On Completion</h3>
            <p>Five percent is due upon completion and handover of your Richmond District apartment.</p>
          </article>
          <article class="payment-card">
            <span class="payment-pct">50%</span>
            <h3>Post-Handover (39 Months)</h3>
            <p>The remaining fifty percent is paid in instalments over 39 months after handover, giving owners time to occupy or rent the unit while completing payments.</p>
          </article>
        </div>
        <p>Tower 1 handover is scheduled for Q1 2029. Starting prices: studios from AED 943,500, 1-bedroom from AED 1,871,700, 2-bedroom from AED 2,584,680. See the <a href="../price-list/">Richmond District price list</a> for full pricing.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/payment-plan/", defaultInterest: "Payment Plan", heading: "Get Payment Schedule Details", button: "Request Payment Plan" })}
  `;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/payment-plan/`,
    path: "/payment-plan/",
    schemas,
    body,
  });
}

function priceListPage() {
  const title = "Richmond Residences Price List | From AED 943,500, Al Furjan";
  const description =
    "Confirmed starting prices for Richmond Residences (Richmond District) studios and 1-2 bed apartments in Al Furjan. Register for current availability.";
  const schemas = [
    jsonLd(realEstateListingSchema()),
    jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }, { name: "Price List", path: "/price-list/" }])),
  ];

  const body = `
    ${subpageHero("Richmond Residences Price List", "Confirmed starting prices for Richmond District by Mira in Al Furjan, Dubai.")}
    ${backLink(1, "Richmond Residences — Home")}
    <section class="section">
      <div class="container">
        <p>All prices are for fully furnished, John Richmond-designed apartments delivered move-in ready. Availability changes — register for the latest Richmond District price list and unit inventory.</p>
        ${pricingTable()}
        <p class="section-note">Payment plan: 45/5/50 (45% during construction, 5% on completion, 50% over 39 months post-handover). Handover Q1 2029 for Tower 1.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/price-list/", defaultInterest: "Price List & Availability", heading: "Request Current Availability", button: "Get Price List" })}
  `;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/price-list/`,
    path: "/price-list/",
    schemas,
    body,
  });
}

function alFurjanPage() {
  const title = "Properties in Al Furjan, Dubai | Richmond Residences & the Al Furjan Market";
  const description =
    "Guide to properties in Al Furjan, Dubai — low-rise community character, Discovery Gardens Metro access, and how Richmond Residences (Richmond District) fits the area.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond Residences", path: "/" }, { name: "Properties in Al Furjan", path: "/al-furjan-properties/" }]))];

  const body = `
    ${subpageHero("Properties in Al Furjan, Dubai", "An area guide to Al Furjan and where Richmond Residences fits within the neighbourhood.")}
    ${backLink(1, "View Richmond Residences by Mira Developments")}
    <section class="section">
      <div class="container stack prose-full">
        <h2>Al Furjan — Established, Low-Rise, Well Connected</h2>
        <p>Al Furjan is one of Dubai's established mid-density residential districts. The community is known for low-rise streets, parks, schools, and everyday amenities within walking distance — a quieter alternative to the city's high-rise corridors while still offering strong transport links.</p>
        <p>Discovery Gardens Metro Station sits at the edge of the Al Furjan and Discovery Gardens area, connecting residents to Dubai Marina, Ibn Battuta, and the wider RTA network. Property values in Al Furjan have shown consistent growth, supported by mature infrastructure and sustained rental demand.</p>
        <h2>Where Richmond Residences Fits</h2>
        <p>Richmond Residences, officially Richmond District, is positioned directly adjacent to Discovery Gardens Metro Station — making it one of the most transit-connected new launches in Al Furjan. The project adds a branded, fully furnished product with hotel-level services and a integrated lifestyle podium, distinguishing it from typical mid-market stock in the area.</p>
        <p>With studios from AED 943,500 and a 45/5/50 payment plan, Richmond District by Mira targets both end-users seeking metro convenience and investors looking for furnished, tenant-ready assets near a major transport hub.</p>
        <p>For full project details, pricing, and floor plans, visit the <a href="../">Richmond Residences homepage</a> or explore the <a href="../price-list/">price list</a>, <a href="../brochure/">brochure page</a>, and <a href="../payment-plan/">payment plan</a>.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/al-furjan-properties/", heading: "Enquire About Richmond Residences Al Furjan", button: "Register Interest" })}
  `;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/al-furjan-properties/`,
    path: "/al-furjan-properties/",
    schemas,
    body,
  });
}

function writeFile(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("wrote", rel);
}

function robotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
}

function sitemapXml() {
  const pages = [
    "/",
    "/brochure/",
    "/floor-plans/",
    "/payment-plan/",
    "/price-list/",
    "/al-furjan-properties/",
    ...coralBay.sitemapPaths(),
  ];
  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${SITE}${p}</loc>
    <lastmod>2026-08-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function manifestJson() {
  return JSON.stringify(
    {
      name: "Richmond Residences",
      short_name: "Richmond",
      description: "Richmond Residences (Richmond District) by Mira Developments, Al Furjan, Dubai",
      start_url: "/",
      display: "standalone",
      background_color: "#0a0a0a",
      theme_color: "#0a0a0a",
      icons: [{ src: "/images/og-image.webp", sizes: "512x512", type: "image/webp" }],
    },
    null,
    2,
  );
}

const coralBay = require("./coral-bay").register({
  SITE,
  esc,
  fmtAed,
  jsonLd,
  breadcrumbs,
  faqSchema,
  assetPrefix,
  pageShell,
  subpageHero,
  backLink,
  faqBlock,
  leadForm,
  OG_CORAL,
});

const coralPages = coralBay.pages();

writeFile("index.html", homePage());
writeFile("brochure/index.html", brochurePage());
writeFile("floor-plans/index.html", floorPlansPage());
writeFile("payment-plan/index.html", paymentPlanPage());
writeFile("price-list/index.html", priceListPage());
writeFile("al-furjan-properties/index.html", alFurjanPage());
writeFile("richmond-residences-mira-coral-bay/index.html", coralPages.main);
writeFile("richmond-residences-mira-coral-bay/brochure/index.html", coralPages.brochure);
writeFile("richmond-residences-mira-coral-bay/floor-plans/index.html", coralPages.floorPlans);
writeFile("richmond-residences-mira-coral-bay/payment-plan/index.html", coralPages.paymentPlan);
writeFile("richmond-residences-mira-coral-bay/price-list/index.html", coralPages.priceList);
writeFile("robots.txt", robotsTxt());
writeFile("sitemap.xml", sitemapXml());
writeFile("manifest.json", manifestJson());

console.log("Done — Richmond Residences site generated.");
