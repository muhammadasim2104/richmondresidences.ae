#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { CORAL_BAY_PATH, CORAL_BAY_NAME } = require("./coral-bay");

const ROOT = path.join(__dirname, "..");
const SITE = "https://richmondresidences.ae";
const ASSET_VERSION = "20260904c";

const PROJECT_PRIMARY = "Richmond District";
const PROJECT_SECONDARY = "Richmond Residences";

const GEO = {
  region: "AE-DU",
  placename: "Al Furjan, Dubai",
  lat: 25.0283,
  lng: 55.1458,
};

const LOGO = `${SITE}/images/logos/richmond-logo.png`;
const LOGO_LIGHT = `${SITE}/images/logos/richmond-logo-light.png`;
const LOGO_ALT = "Richmond Residences";
const LOGO_W = 160;
const LOGO_H = 33;
const OG_DUBAI = `${SITE}/images/og/dubai-og.jpg`;
const OG_DUBAI_ALT = "Richmond District (Richmond Residences) by Mira Developments — Al Furjan, Dubai";
const OG_DUBAI_W = 2400;
const OG_DUBAI_H = 1522;
const OG_CORAL = `${SITE}/images/og/coral-bay-og.jpg`;
const OG_CORAL_ALT = "John Richmond Residences at Mira Coral Bay — Ras Al Khaimah";
const OG_CORAL_W = 2100;
const OG_CORAL_H = 1172;
const OG_IMAGE = OG_DUBAI;

const SUBPAGE_HERO_DUBAI = {
  imagePath: "images/hero/hero-night.webp",
  width: 2400,
  height: 1522,
  alt: "Richmond District by Mira Developments — Al Furjan, Dubai at night",
  eyebrow: "Richmond District · Richmond Residences",
};

const SUBPAGE_HERO_CORAL = {
  imagePath: "images/coral-bay/hero/hero-1.webp",
  width: 2100,
  height: 1172,
  alt: "John Richmond Residences at Mira Coral Bay — Ras Al Khaimah waterfront",
  eyebrow: "John Richmond · Mira Coral Bay, RAK",
};
const OVERVIEW_VIDEO_ID = "defcde1550ad9142a082ecd465b21242";
const OVERVIEW_VIDEO_HOST = "customer-a4hmar61jl8g84ce.cloudflarestream.com";
const DISCLAIMER =
  "richmondresidences.ae is an independent marketing site for Richmond District (Richmond Residences) by Mira Developments in Al Furjan, Dubai and John Richmond Residences at Mira Coral Bay, Ras Al Khaimah. This is not the official Mira Developments website. Project details, pricing, and availability are subject to change and should be verified with Mira Developments or an authorized representative.";

function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Richmond District",
    alternateName: "Richmond Residences",
    url: SITE,
    description:
      "Richmond District by Mira Developments — John Richmond-branded residential masterplan in Al Furjan, Dubai.",
  };
}

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
  { href: "/", label: "Richmond District" },
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

const RESOURCE_PATHS = ["/brochure/", "/floor-plans/", "/price-list/", "/payment-plan/"];

function isResourcePath(href) {
  return RESOURCE_PATHS.some((segment) => href.includes(segment));
}

function newTabAttrs(href) {
  return isResourcePath(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

function resourceLink(href, label, className = "") {
  const cls = className ? ` class="${className}"` : "";
  return `<a href="${href}"${cls}${newTabAttrs(href)}>${esc(label)}</a>`;
}

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
    name: "Richmond District by Mira Developments",
    alternateName: "Richmond Residences",
    description:
      "Studios and 1-2 bedroom fully furnished apartments at Richmond District (also marketed as Richmond Residences) in Al Furjan, Dubai.",
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
    image: OG_DUBAI,
  };
}

function placeSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: "Richmond District",
    alternateName: "Richmond Residences",
    description:
      "Richmond District by Mira Developments — a John Richmond-branded residential masterplan in Al Furjan, Dubai.",
    url: SITE,
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
    image: OG_DUBAI,
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

function cloudflareStreamEmbed(videoId, title, opts = {}) {
  const params = new URLSearchParams({
    autoplay: "true",
    muted: "true",
    loop: "true",
    preload: "auto",
  });
  if (opts.poster) params.set("poster", opts.poster);
  const src = `https://${OVERVIEW_VIDEO_HOST}/${videoId}/iframe?${params}`;
  return `
        <figure class="media-frame media-video">
          <div class="video-embed">
            <iframe
              src="${src}"
              title="${esc(title)}"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowfullscreen
            ></iframe>
          </div>
        </figure>`;
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

function countryPickerHtml() {
  return `<div class="country-picker" data-country-picker>
                  <input type="hidden" name="country_code" value="+971" required>
                  <button type="button" class="country-picker-trigger" aria-label="Country code" aria-haspopup="listbox" aria-expanded="false">
                    <span class="country-picker-flag" aria-hidden="true">🇦🇪</span>
                    <span class="country-picker-dial">+971</span>
                  </button>
                  <div class="country-picker-panel" hidden>
                    <input type="search" class="country-picker-search" placeholder="Search country or code" autocomplete="off" spellcheck="false" aria-label="Search country or code">
                    <ul class="country-picker-list" role="listbox"></ul>
                  </div>
                </div>`;
}

function phoneFieldHtml(label = "Phone") {
  return `<div class="field phone-field">
              <span>${esc(label)}</span>
              <div class="phone-row">
                ${countryPickerHtml()}
                <input type="tel" name="phone" autocomplete="tel-national" inputmode="tel" required maxlength="30">
              </div>
            </div>`;
}

function interestOptionsHtml(defaultInterest = "") {
  return INTEREST_OPTIONS.map(
    (o) =>
      `<option value="${esc(o)}"${o === defaultInterest ? " selected" : ""}>${esc(o)}</option>`,
  ).join("\n");
}

function inquiryFormHtml(prefix, opts = {}) {
  const sourcePage = opts.sourcePage || SITE + (opts.path || "/");
  const button = opts.button || "Register interest";
  const defaultInterest = opts.defaultInterest || "";
  const projectSlug = opts.projectSlug || "richmond-residences";
  const projectName = opts.projectName || "Richmond Residences";
  const formClass = opts.formClass || "form form-register";

  return `<form class="${formClass}" action="${prefix}api/enquire" method="post" novalidate>
            <input type="hidden" name="source_page" value="${esc(sourcePage)}">
            <input type="hidden" name="project_slug" value="${esc(projectSlug)}">
            <input type="hidden" name="project_name" value="${esc(projectName)}">
            <input type="hidden" name="message" value="${esc(`I'd like details on ${projectName}.`)}">
            <div class="form-alert" role="status" aria-live="polite" hidden></div>
            <label class="field">
              <span>Full name</span>
              <input type="text" name="name" autocomplete="name" required maxlength="200">
            </label>
            <label class="field">
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required maxlength="200">
            </label>
            ${phoneFieldHtml("Phone")}
            <input type="hidden" name="interest" value="${esc(defaultInterest || "General enquiry")}">
            <label class="field visually-hidden" aria-hidden="true">
              <span>Website</span>
              <input type="text" name="website" tabindex="-1" autocomplete="off">
            </label>
            <input type="hidden" name="tu_hp_confirm" value="">
            <button type="submit" class="btn btn-accent btn-block btn-register">${esc(button)}</button>
          </form>`;
}

function inquiryModal(depth, opts = {}) {
  const prefix = assetPrefix(depth);
  return `
  <div class="inquiry-modal" id="inquiry-modal" hidden aria-hidden="true">
    <div class="inquiry-modal-backdrop" tabindex="-1" aria-hidden="true"></div>
    <div class="inquiry-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="inquiry-modal-title" tabindex="-1">
      <button type="button" class="inquiry-modal-close" data-close-inquiry aria-label="Close registration form">
        <span aria-hidden="true">&times;</span>
      </button>
      <div class="inquiry-modal-head">
        <p class="eyebrow inquiry-modal-eyebrow">Register interest</p>
        <h2 id="inquiry-modal-title" class="inquiry-modal-title">${esc(opts.projectName || "Richmond Residences")}</h2>
        <p class="inquiry-modal-lead">Share your details and a Richmond Residences representative will follow up with project updates, availability, and next steps.</p>
      </div>
      <div class="inquiry-modal-body">
        ${inquiryFormHtml(prefix, {
          path: opts.path || "/",
          projectSlug: opts.projectSlug || "richmond-residences",
          projectName: opts.projectName || "Richmond Residences",
          formClass: "form form-modal form-register",
          button: "Register interest",
        })}
      </div>
    </div>
  </div>`;
}

function modalTriggerBtn({
  label,
  heading,
  interest = "",
  projectSlug = "richmond-residences-coral-bay",
  projectName = "John Richmond Residences at Mira Coral Bay",
  variant = "outline",
}) {
  return `<button type="button" class="btn btn-${variant} btn-sm" data-open-inquiry
              data-inquiry-heading="${esc(heading || label)}"
              data-inquiry-interest="${esc(interest)}"
              data-project-slug="${esc(projectSlug)}"
              data-project-name="${esc(projectName)}">${esc(label)}</button>`;
}

function heroFormCompact(depth, opts = {}) {
  const prefix = assetPrefix(depth);
  const sourcePage = opts.sourcePage || SITE + (opts.path || "/");
  const projectSlug = opts.projectSlug || "richmond-residences";
  const projectName = opts.projectName || "Richmond Residences";
  const heading = opts.heading || projectName;
  const sub =
    opts.sub ||
    "Share your details and a Richmond Residences representative will follow up with project updates, availability, and next steps.";
  const button = opts.button || "Register interest";
  const defaultInterest = opts.defaultInterest || "";

  return `
        <div class="hero-form-card">
          <p class="form-eyebrow">Register interest</p>
          <h2>${esc(heading)}</h2>
          <p class="hero-form-lead">${esc(sub)}</p>
          <form class="form form-compact form-register" action="${prefix}api/enquire" method="post" novalidate>
            <input type="hidden" name="source_page" value="${esc(sourcePage)}">
            <input type="hidden" name="project_slug" value="${esc(projectSlug)}">
            <input type="hidden" name="project_name" value="${esc(projectName)}">
            <input type="hidden" name="message" value="${esc(`I'd like details on ${projectName}.`)}">
            <div class="form-alert" role="status" aria-live="polite" hidden></div>
            <label class="field"><span>Full name</span><input type="text" name="name" autocomplete="name" required maxlength="200"></label>
            <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required maxlength="200"></label>
            ${phoneFieldHtml("Phone")}
            <input type="hidden" name="interest" value="${esc(defaultInterest || "General enquiry")}">
            <label class="field visually-hidden" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></label>
            <input type="hidden" name="tu_hp_confirm" value="">
            <button type="submit" class="btn btn-accent btn-block btn-register">${esc(button)}</button>
          </form>
        </div>`;
}

function heroSection({ bgImage, eyebrow, title, subtitle, stats, formHtml }) {
  const statsHtml = (stats || [])
    .map(
      (s) =>
        `<div><span class="stat-label">${esc(s.label)}</span><span class="stat-value">${s.value}</span></div>`,
    )
    .join("\n            ");
  const ctaHtml = formHtml
    ? ""
    : `<div class="hero-cta">
            <a class="btn btn-accent" href="#overview">Explore</a>
            <a class="btn btn-outline-light" href="#register" data-open-inquiry data-inquiry-heading="Register Your Interest">Register Interest</a>
          </div>`;
  return `
    <section class="hero${formHtml ? " hero-has-form" : ""}">
      <div class="hero-bg" style="background-image:url('${bgImage}')"></div>
      <div class="hero-inner container">
        <div class="hero-grid">
          <div class="hero-copy">
            ${eyebrow ? `<p class="eyebrow eyebrow-light">${esc(eyebrow)}</p>` : ""}
            <h1>${esc(title)}</h1>
            ${subtitle ? `<p class="hero-sub">${subtitle}</p>` : ""}
            ${stats?.length ? `<div class="hero-stats">${statsHtml}</div>` : ""}
            ${ctaHtml}
          </div>
          ${formHtml || ""}
        </div>
      </div>
    </section>`;
}

function leadForm(depth, opts = {}) {
  const prefix = assetPrefix(depth);
  const sourcePage = opts.sourcePage || SITE + (opts.path || "/");
  const heading = opts.heading || "Register Your Interest";
  const sub =
    opts.sub ||
    "Request the Richmond District brochure, floor plans, price list, or payment plan details.";
  const button = opts.button || "Submit Enquiry";
  const id = opts.id || "register";
  const defaultInterest = opts.defaultInterest || "";
  const projectSlug = opts.projectSlug || "richmond-residences";
  const projectName = opts.projectName || PROJECT_PRIMARY;
  const consentText =
    opts.consentText ||
    "By submitting, you consent to be contacted regarding Richmond District (Richmond Residences). Your information will not be shared beyond authorised project representatives.";

  const benefits = opts.benefits || [
    "Official Richmond District brochure and floor plan PDFs",
    "Current price list, availability, and payment plan details",
    "Independent guidance — no obligation to proceed",
  ];

  const benefitsHtml = benefits
    .map((item) => `<li>${esc(item)}</li>`)
    .join("\n              ");

  return `
    <section class="section section-form" id="${esc(id)}">
      <div class="container">
        <div class="form-layout">
          <div class="form-copy">
            <p class="eyebrow">Get in touch</p>
            <h2>${esc(heading)}</h2>
            <p>${esc(sub)}</p>
            <ul class="form-benefits">
              ${benefitsHtml}
            </ul>
          </div>
          <div class="form-column">
            ${inquiryFormHtml(prefix, {
              sourcePage,
              path: opts.path || "/",
              button,
              defaultInterest,
              projectSlug,
              projectName,
            })}
            <p class="form-consent">${esc(consentText)}</p>
          </div>
        </div>
      </div>
    </section>`;
}

function logoImg(prefix, { light = false, className }) {
  const base = light ? "richmond-logo-light" : "richmond-logo";
  return `<img src="${prefix}images/logos/${base}.png" srcset="${prefix}images/logos/${base}@2x.png 2x" alt="${esc(LOGO_ALT)}" class="${className}" width="${LOGO_W}" height="${LOGO_H}" decoding="async">`;
}

function nav(depth) {
  const root = depth > 0 ? "../".repeat(depth) : "./";
  return `
    <header class="nav-wrap">
      <nav class="nav container" aria-label="Primary">
        <a class="nav-brand" href="${root}" aria-label="Richmond District home">
          ${logoImg(root, { className: "nav-logo" })}
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links">
          ${NAV_LINKS.map((link) => {
            const href = link.href.startsWith("/#")
              ? `${root}${link.href.slice(1)}`
              : `${root}${link.href.replace(/^\//, "")}`;
            return `<a href="${href}"${newTabAttrs(link.href)}>${esc(link.label)}</a>`;
          }).join("\n          ")}
          <button type="button" class="btn btn-accent btn-sm" data-open-inquiry data-inquiry-heading="Register Your Interest">Register your interest</button>
        </div>
      </nav>
    </header>`;
}

function footer(depth) {
  const prefix = assetPrefix(depth);
  const dubaiLinks = FOOTER_LINKS.filter((l) => !l.href.includes("coral-bay"));
  const coralLink = FOOTER_LINKS.find((l) => l.href.includes("coral-bay"));
  return `
    <footer class="site-footer">
      <div class="container footer-top">
        <div class="footer-brand">
          ${logoImg(prefix, { light: true, className: "footer-logo" })}
          <p class="footer-tag">Richmond District by Mira Developments — Al Furjan, Dubai &amp; Mira Coral Bay, RAK</p>
        </div>
        <div class="footer-menus">
          <div class="footer-menu-col">
            <p class="footer-col-title">Al Furjan, Dubai</p>
            <nav class="footer-links" aria-label="Dubai project">
              ${dubaiLinks
                .map((link) => {
                  const href = `${prefix}${link.href.replace(/^\//, "")}`;
                  return `<a href="${href}"${newTabAttrs(link.href)}>${esc(link.label)}</a>`;
                })
                .join("\n              ")}
            </nav>
          </div>
          <div class="footer-menu-col">
            <p class="footer-col-title">Resources</p>
            <nav class="footer-links" aria-label="Resources">
              ${resourceLink(`${prefix}brochure/`, "Brochure")}
              ${resourceLink(`${prefix}floor-plans/`, "Floor Plans")}
              ${resourceLink(`${prefix}price-list/`, "Price List")}
              ${resourceLink(`${prefix}payment-plan/`, "Payment Plan")}
              <a href="${prefix}sitemap/">Sitemap</a>
              ${coralLink ? `<a href="${prefix}${coralLink.href.replace(/^\//, "")}">${esc(coralLink.label)}</a>` : ""}
            </nav>
          </div>
        </div>
      </div>
      <div class="container footer-legal">
        <p class="disclaimer">${esc(DISCLAIMER)}</p>
        <p class="footer-copy">&copy; ${new Date().getFullYear()} richmondresidences.ae. All rights reserved.</p>
      </div>
    </footer>`;
}

function webPageSchema({ title, description, canonical, ogImage, ogImageAlt, ogW, ogH }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonical,
    description,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: ogImage,
      width: ogW,
      height: ogH,
      caption: ogImageAlt,
    },
  };
}

function gtagHead() {
  return `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-7RPYPN8MLG"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-7RPYPN8MLG');
  </script>`;
}

function headIcons() {
  const v = ASSET_VERSION;
  return `
  <link rel="icon" href="/favicon.ico?v=${v}" sizes="any">
  <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg?v=${v}">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png?v=${v}">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png?v=${v}">
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png?v=${v}">
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-icon-180x180.png?v=${v}">
  <link rel="manifest" href="/manifest.json?v=${v}">`;
}

function pageShell({
  depth,
  title,
  description,
  canonical,
  path,
  schemas,
  body,
  keywords,
  geo,
  ogImage,
  ogImageAlt,
  ogImageWidth,
  ogImageHeight,
  projectSlug,
  projectName,
}) {
  const prefix = assetPrefix(depth);
  const cssHref = `${prefix}css/styles.css?v=${ASSET_VERSION}`;
  const jsTracker = `${prefix}js/tracker.js?v=${ASSET_VERSION}`;
  const jsCountries = `${prefix}js/country-codes.js?v=${ASSET_VERSION}`;
  const jsMain = `${prefix}js/main.js?v=${ASSET_VERSION}`;
  const pageGeo = geo || GEO;
  const pageOg = ogImage || OG_DUBAI;
  const pageOgAlt = ogImageAlt || OG_DUBAI_ALT;
  const pageOgW = ogImageWidth || OG_DUBAI_W;
  const pageOgH = ogImageHeight || OG_DUBAI_H;
  const pageProjectSlug = projectSlug || "richmond-residences";
  const pageProjectName = projectName || PROJECT_PRIMARY;
  const allSchemas = [
    jsonLd(webPageSchema({
      title,
      description,
      canonical,
      ogImage: pageOg,
      ogImageAlt: pageOgAlt,
      ogW: pageOgW,
      ogH: pageOgH,
    })),
    ...schemas,
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${gtagHead()}
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
  <link rel="sitemap" type="application/xml" title="Sitemap" href="${SITE}/sitemap.xml">
  <link rel="alternate" type="text/plain" title="LLM index" href="${SITE}/llms.txt">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${pageOg}">
  <meta property="og:image:secure_url" content="${pageOg}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="${pageOgW}">
  <meta property="og:image:height" content="${pageOgH}">
  <meta property="og:image:alt" content="${esc(pageOgAlt)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Richmond District">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${pageOg}">
  <meta name="twitter:image:alt" content="${esc(pageOgAlt)}">
  ${headIcons()}
  <meta name="theme-color" content="#2d4a2d">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssHref}">
  <script src="${jsTracker}" defer></script>
  ${allSchemas.join("\n  ")}
</head>
<body data-project-slug="${esc(pageProjectSlug)}" data-project-name="${esc(pageProjectName)}" data-page-path="${esc(path || "/")}">
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav(depth)}
  <main id="main">${body}</main>
  ${footer(depth)}
  ${inquiryModal(depth, { path, projectSlug: pageProjectSlug, projectName: pageProjectName })}
  <div class="float-register" id="float-register" aria-hidden="true">
    <button type="button" class="btn btn-accent btn-sm" data-open-inquiry data-inquiry-heading="Register Your Interest">Register your interest</button>
  </div>
  <script src="${jsCountries}" defer></script>
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

function subpageHero(title, lead, opts = {}) {
  const depth = opts.depth ?? 1;
  const prefix = assetPrefix(depth);
  const hero = { ...SUBPAGE_HERO_DUBAI, ...opts };
  const imgSrc = `${prefix}${hero.imagePath}`;

  return `
    <section class="hero-banner-page" aria-label="${esc(title)}">
      <img class="hero-banner-page-media" src="${imgSrc}" alt="${esc(hero.alt)}" width="${hero.width}" height="${hero.height}" fetchpriority="high" decoding="async">
      <div class="hero-banner-page-overlay" aria-hidden="true"></div>
      <div class="container hero-banner-page-inner">
        <p class="eyebrow eyebrow-light">${esc(hero.eyebrow)}</p>
        <h1>${esc(title)}</h1>
        <p class="page-lead">${esc(lead)}</p>
      </div>
    </section>`;
}

const HOME_FAQS = [
  {
    q: "What is Richmond District (Richmond Residences) by Mira Developments?",
    a: "Richmond District is the official name for this Al Furjan masterplan — also marketed as Richmond Residences. Developed by Mira Developments in partnership with British fashion house John Richmond, the project comprises five residential towers and one office building connected by a shared podium with retail, wellness, and leisure facilities. Tower 1 is the first residential release and is now available.",
  },
  {
    q: "What apartment types are available at Richmond District Al Furjan?",
    a: "Richmond District Al Furjan offers studios, 1-bedroom, and 2-bedroom apartments. Every home is fully furnished with interiors designed by John Richmond, including furniture, fixtures, materials, and finishes — delivered move-in ready at handover.",
  },
  {
    q: "What are the prices at Richmond District Tower 1?",
    a: "At Richmond District Tower 1, the launched residential phase: studios start from AED 943,500 (USD 256,909) at 39 sqm / 420 sqft; 1-bedroom apartments from AED 1,871,700 (USD 509,653) at 87.9 sqm / 946 sqft; 2-bedroom apartments from AED 2,584,680 (USD 703,793) at 123 sqm / 1,322 sqft. Pricing for other towers is available on request — register below and we'll confirm current pricing for your preferred unit type.",
  },
  {
    q: "What is the payment plan for Richmond District?",
    a: "Richmond District follows a 45/5/50 payment structure: 45% is payable during the construction period before handover, 5% is due upon completion, and the remaining 50% is spread across 39 months after handover.",
  },
  {
    q: "When is the handover date for Richmond District Tower 1?",
    a: "Handover for Tower 1 at Richmond District is scheduled for Q1 2029. Tower 1 is the first residential tower released within the masterplan.",
  },
  {
    q: "Where is Richmond District located in Dubai?",
    a: "Richmond District sits in Al Furjan, Dubai, directly next to Discovery Gardens Metro Station. From the site, Bluewaters Island is 8 minutes away, Palm Jumeirah 10 minutes, Downtown Dubai 18 minutes, and Al Maktoum International Airport 20 minutes.",
  },
  {
    q: "What amenities does Richmond District Al Furjan offer?",
    a: "Residents have access to three resort-style pools, decorative water features, a luxury lobby, spa and wellness facilities, a state-of-the-art gym, an outdoor fitness area, a padel court, a yoga zone, cafés, restaurants, and retail within the shared podium. Valet parking, concierge, housekeeping, cleaning, and in-residence dining are included as 5-star hotel-level services.",
  },
  {
    q: "Who is the developer of Richmond District?",
    a: "Richmond District is developed by Mira Developments, a Dubai-based developer. This is Mira's first residential collaboration with John Richmond. Mira has previously partnered with Bentley Home, ETRO Home, ELIE SAAB, Jacob &amp; Co., Trussardi, and Gianfranco Ferré Home.",
  },
  {
    q: "How do I get the Richmond District brochure, floor plans, or price list?",
    a: "Submit the enquiry form on this site to request the Richmond District brochure, detailed floor plan PDFs, or the current price list and unit availability. A project representative will follow up with the materials you need.",
  },
];

function homePage() {
  const title = "Richmond District by Mira | Richmond Residences, Al Furjan Dubai";
  const description =
    "Richmond District (Richmond Residences) by Mira Developments in Al Furjan, Dubai. Tower 1 studios and 1-2 bed apartments from AED 943,500. Register for the brochure, price list, and payment plan.";
  const keywords =
    "Richmond District, Richmond Residences, Richmond District Al Furjan, Richmond Residences Al Furjan, Richmond District by Mira, Richmond Residences by Mira, New Launch at Al Furjan, Richmond District brochure, Richmond District payment plan, Richmond District floor plans, Richmond District price, Properties in Al Furjan";

  const schemas = [
    jsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Richmond District",
      alternateName: "Richmond Residences",
      url: SITE,
    }),
    jsonLd(organizationSchema()),
    jsonLd(placeSchema()),
    jsonLd(realEstateListingSchema()),
    jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }])),
    faqSchema(HOME_FAQS),
  ];

  const body = `
    ${heroSection({
      bgImage: "./images/hero/hero-night.webp",
      eyebrow: "New Launch at Al Furjan",
      title: "Richmond District by Mira Developments — Al Furjan, Dubai (Richmond Residences)",
      subtitle:
        "Tower 1 — Dubai's first John Richmond-branded residential community, also marketed as <strong>Richmond Residences</strong> — studios and 1-2 bedroom apartments from <strong>AED 943,500</strong>.",
      stats: [
        { label: "Tower 1 from", value: "AED 943,500" },
        { label: "Tower 1 handover", value: "Q1 2029" },
        { label: "Tower 1 payment", value: "45/5/50" },
      ],
      formHtml: heroFormCompact(0, {
        path: "/",
        projectName: PROJECT_PRIMARY,
      }),
    })}

    <section class="section" id="overview">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Project overview</p>
          <h2>Richmond District — A Branded Masterplan in Al Furjan</h2>
        </div>
        <div class="split-grid">
          <div class="stack">
            <p>Richmond District (also marketed as Richmond Residences) is a new integrated community in Al Furjan developed by Mira Developments. The masterplan brings together <a href="./#towers">five residential buildings and one office tower</a>, all linked by a shared podium offering retail, wellness, and leisure at ground level.</p>
            <p>This marks Mira Developments' first residential partnership with John Richmond, the British fashion house established in London in the 1980s — and the first John Richmond-branded homes anywhere in Dubai. <a href="./richmond-district-tower-1/">Tower 1</a>, the opening residential phase, is the launched collection with confirmed pricing from AED 943,500.</p>
            <p>Mira Developments has built a track record of branded collaborations including Bentley Home, ETRO Home, ELIE SAAB, Jacob &amp; Co., Trussardi, and Gianfranco Ferré Home.</p>
          </div>
          ${cloudflareStreamEmbed(OVERVIEW_VIDEO_ID, "Richmond District by Mira Developments — Al Furjan overview video")}
        </div>
      </div>
    </section>

    <section class="section section-alt" id="pricing">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Unit types &amp; pricing</p>
          <h2>Richmond District Tower 1 — Starting Prices</h2>
          <p>Confirmed starting prices apply to <a href="./richmond-district-tower-1/">Tower 1</a>, the launched residential phase. All Tower 1 homes are fully furnished by John Richmond and delivered move-in ready. <a href="./price-list/"${newTabAttrs("./price-list/")}>View the Tower 1 price list</a> or <a href="./floor-plans/"${newTabAttrs("./floor-plans/")}>request Richmond District floor plans</a>. For Business Tower and Towers 2–5, <a href="./#towers">register for pricing on request</a>.</p>
        </div>
        ${pricingTable()}
        <p class="section-note">Prices above are confirmed for Richmond District Tower 1 only. Payment plan: 45/5/50. Handover Q1 2029.</p>
        <div class="cta-row">
          ${resourceLink("./richmond-district-tower-1/price-list/", "Tower 1 Price List", "btn btn-accent")}
          ${resourceLink("./richmond-district-tower-1/payment-plan/", "Tower 1 Payment Plan", "btn btn-outline")}
        </div>
      </div>
    </section>

    <section class="section" id="architecture">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Architecture &amp; design</p>
          <h2>Mashrabiya Façades &amp; John Richmond Interiors</h2>
          <p class="section-intro">Richmond District's architecture is by Italian firm Archea Associati, led by architect Marco Casamonti.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <img src="./images/exterior/ext-3.webp" alt="Operable mashrabiya screens on Richmond District tower façades" loading="lazy">
            <h3>Operable Mashrabiya Screens</h3>
            <p>The building exteriors feature traditional mashrabiya screens that residents can open and close. These elements add privacy, cut heat gain in summer, and still let daylight through — so the façade shifts in character as light changes through the day.</p>
          </article>
          <article class="feature-card">
            <img src="./images/interior/int-2.webp" alt="Fully furnished living room designed by John Richmond at Richmond District" loading="lazy">
            <h3>Move-In Ready by John Richmond</h3>
            <p>Each apartment arrives fully furnished with interiors conceived by John Richmond. Furniture, fixtures, materials, and finishes are all included — so owners receive a complete home at handover, not an empty shell.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="amenities">
      <div class="container">
        <div class="section-head section-head-center">
          <p class="eyebrow">Amenities</p>
          <h2>Lifestyle Podium at Richmond District</h2>
          <p>The shared podium connects all towers with resort-grade facilities and everyday conveniences on site.</p>
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
          <img src="./images/amenities/lobby.webp" alt="Luxury lobby at Richmond District" loading="lazy">
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
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Location</p>
          <h2>Richmond District Al Furjan — Metro-Connected Living</h2>
        </div>
        <div class="split-grid">
          <div class="stack">
            <p>Richmond District sits in Al Furjan, directly beside Discovery Gardens Metro Station — giving residents immediate access to Dubai's metro network without relying on a car.</p>
            <ul class="proximity-list">
              <li><strong>0 min</strong> Discovery Gardens Metro Station</li>
              <li><strong>8 min</strong> Bluewaters Island</li>
              <li><strong>10 min</strong> Palm Jumeirah</li>
              <li><strong>18 min</strong> Downtown Dubai</li>
              <li><strong>20 min</strong> Al Maktoum International Airport</li>
            </ul>
            <p><a href="./al-furjan-properties/">Read our guide to properties in Al Furjan</a> and how Richmond District fits the neighbourhood.</p>
          </div>
          <figure class="media-frame">
            <img src="./images/exterior/ext-1.webp" alt="Richmond District exterior rendering, Al Furjan" width="800" height="600" loading="lazy">
          </figure>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="investment">
      <div class="container stack">
        <div class="section-head">
          <p class="eyebrow">Investment appeal</p>
          <h2>Why Consider Richmond District by Mira</h2>
        </div>
        <div class="invest-grid">
          <article>
            <h3>Mira Care Warranty</h3>
            <p>Every Richmond District home includes Mira Care — described as the UAE's first five-year maintenance warranty. It covers core building systems, structural elements, MEP installations, lighting, and paintwork. Furniture carries a three-year warranty; fixtures are covered for five years.</p>
          </article>
          <article>
            <h3>Tower 1 — 45/5/50 Payment Plan</h3>
            <p>The 45/5/50 structure for Tower 1 splits payments across construction (45%), completion (5%), and a 39-month post-handover period for the remaining 50%. This gives buyers time to settle the balance after taking possession. <a href="./payment-plan/"${newTabAttrs("./payment-plan/")}>See the Tower 1 payment plan breakdown</a>.</p>
          </article>
          <article>
            <h3>Metro-Driven Rental Demand</h3>
            <p>Direct adjacency to Discovery Gardens Metro Station puts Richmond District Al Furjan within reach of major employment and leisure hubs across Dubai. Fully furnished, hotel-serviced apartments near a metro stop tend to attract strong tenant interest in established communities like Al Furjan.</p>
          </article>
        </div>
      </div>
    </section>

    ${faqBlock(HOME_FAQS)}
    ${leadForm(0, { heading: "Request Brochure, Floor Plans & Price List", sub: "Complete the form and a representative will send Richmond District materials and current Tower 1 availability.", button: "Enquire Now" })}
    ${towers.towersHomeSection()}
    ${coralBay.flagshipSection()}
  `;

  return pageShell({ depth: 0, title, description, canonical: `${SITE}/`, path: "/", keywords, schemas, body });
}

function brochurePage() {
  const title = "Richmond District Brochure | Richmond Residences, Al Furjan";
  const description =
    "Request the Richmond District (Richmond Residences) brochure — project overview, unit types, amenities, payment plan, and handover details for Al Furjan, Dubai.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Brochure", path: "/brochure/" }]))];

  const body = `
    ${subpageHero("Richmond District Brochure", "Project fact sheet for Richmond District by Mira Developments in Al Furjan, Dubai (Richmond Residences).")}
    <section class="section">
      <div class="container stack prose-full">
        <h2>Richmond District — Project Summary</h2>
        <p>Richmond District (also marketed as Richmond Residences) is a branded residential masterplan in Al Furjan developed by Mira Developments in collaboration with John Richmond. The development includes five residential towers, one office tower, and a shared podium with retail, wellness, and leisure facilities.</p>
        <h3>Unit Types — Tower 1</h3>
        ${pricingTable()}
        <h3>Payment Plan — Tower 1</h3>
        <p>45/5/50 — 45% during construction, 5% on completion, 50% over 39 months post-handover. For other towers, ask us about the payment plan — our team has the latest structure and will walk you through it.</p>
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
  const title = "Richmond District Floor Plans | Richmond Residences, Al Furjan";
  const description =
    "Richmond District floor plans for studios, 1-bedroom, and 2-bedroom apartments in Al Furjan (Richmond Residences). Sizes from 39 sqm. Request detailed layout PDFs.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Floor Plans", path: "/floor-plans/" }]))];

  const unitSections = UNITS.map(
    (u) => `
    <article class="unit-card">
      <img src="../images/interior/int-${u.slug === "studio" ? "1" : u.slug === "1-bedroom" ? "3" : "5"}.webp" alt="${esc(u.type)} apartment interior at Richmond District" loading="lazy">
      <h2>${esc(u.type)}</h2>
      <p>From ${u.sqm} sqm / ${fmtAed(u.sqft)} sqft · Starting AED ${fmtAed(u.aed)}</p>
      <p>Fully furnished by John Richmond. Detailed layout drawings are available on request — register below for the ${esc(u.type.toLowerCase())} floor plan PDF.</p>
    </article>`,
  ).join("\n");

  const body = `
    ${subpageHero("Richmond District Floor Plans", "Studios and 1-2 bedroom apartments at Richmond District Al Furjan — Richmond Residences sizes and starting prices confirmed; full layout PDFs on request.")}
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
  const title = "Richmond District Payment Plan | Tower 1 — 45/5/50, Al Furjan";
  const description =
    "Richmond District Tower 1 payment plan: 45% during construction, 5% on completion, 50% over 39 months post-handover. Full breakdown for Richmond Residences, Al Furjan.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Payment Plan", path: "/payment-plan/" }]))];

  const body = `
    ${subpageHero("Richmond District Tower 1 Payment Plan", "The Tower 1 45/5/50 structure explained for Richmond District buyers and investors.")}
    <section class="section">
      <div class="container stack">
        <p class="section-note">The 45/5/50 structure below applies to Richmond District Tower 1, the launched residential phase. For other towers, ask us about the payment plan — our team has the latest structure and will walk you through it.</p>
        <h2>45/5/50 Payment Structure — Tower 1</h2>
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
        <p>Tower 1 handover is scheduled for Q1 2029. Starting prices for Tower 1: studios from AED 943,500, 1-bedroom from AED 1,871,700, 2-bedroom from AED 2,584,680. See the <a href="../price-list/"${newTabAttrs("../price-list/")}>Tower 1 price list</a> for full pricing.</p>
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
  const title = "Richmond District Price List | Tower 1 from AED 943,500, Richmond Residences";
  const description =
    "Confirmed Tower 1 starting prices for Richmond District (Richmond Residences) studios and 1-2 bed apartments in Al Furjan. Register for current availability.";
  const schemas = [
    jsonLd(realEstateListingSchema()),
    jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Price List", path: "/price-list/" }])),
  ];

  const body = `
    ${subpageHero("Richmond District Tower 1 Price List", "Confirmed starting prices for Richmond District Tower 1 by Mira in Al Furjan, Dubai (Richmond Residences).")}
    <section class="section">
      <div class="container">
        <p>All prices below are for Richmond District Tower 1 — the launched residential phase. Fully furnished, John Richmond-designed apartments delivered move-in ready. For Business Tower and Towers 2–5, pricing is available on request — register below and we'll confirm current pricing for your preferred unit type.</p>
        ${pricingTable()}
        <p class="section-note">Payment plan for Tower 1: 45/5/50 (45% during construction, 5% on completion, 50% over 39 months post-handover). Handover Q1 2029. Explore <a href="../richmond-district-tower-2/">Tower 2</a>, <a href="../richmond-district-business-tower/">Business Tower</a>, and other phases via the <a href="../#towers">towers section</a>.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/price-list/", defaultInterest: "Price List & Availability", heading: "Request Tower 1 Availability", button: "Request Pricing" })}
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
  const title = "Properties in Al Furjan, Dubai | Richmond District & the Al Furjan Market";
  const description =
    "Guide to properties in Al Furjan, Dubai — low-rise community character, Discovery Gardens Metro access, and how Richmond District (Richmond Residences) fits the area.";
  const schemas = [jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Properties in Al Furjan", path: "/al-furjan-properties/" }]))];

  const body = `
    ${subpageHero("Properties in Al Furjan, Dubai", "An area guide to Al Furjan and where Richmond District fits within the neighbourhood.")}
    <section class="section">
      <div class="container stack prose-full">
        <h2>Al Furjan — Established, Low-Rise, Well Connected</h2>
        <p>Al Furjan is one of Dubai's established mid-density residential districts. The community is known for low-rise streets, parks, schools, and everyday amenities within walking distance — a quieter alternative to the city's high-rise corridors while still offering strong transport links.</p>
        <p>Discovery Gardens Metro Station sits at the edge of the Al Furjan and Discovery Gardens area, connecting residents to Dubai Marina, Ibn Battuta, and the wider RTA network. Property values in Al Furjan have shown consistent growth, supported by mature infrastructure and sustained rental demand.</p>
        <h2>Where Richmond District Fits</h2>
        <p>Richmond District (also marketed as Richmond Residences) is positioned directly adjacent to Discovery Gardens Metro Station — making it one of the most transit-connected new launches in Al Furjan. The project adds a branded, fully furnished product with hotel-level services and a integrated lifestyle podium, distinguishing it from typical mid-market stock in the area.</p>
        <p>With Tower 1 studios from AED 943,500 and a 45/5/50 payment plan, Richmond District by Mira targets both end-users seeking metro convenience and investors looking for furnished, tenant-ready assets near a major transport hub. Pricing for Business Tower and Towers 2–5 is available on request.</p>
        <p>For full project details, pricing, and floor plans, visit the <a href="../">Richmond District homepage</a> or explore the <a href="../price-list/"${newTabAttrs("../price-list/")}>price list</a>, <a href="../brochure/"${newTabAttrs("../brochure/")}>brochure page</a>, and <a href="../payment-plan/"${newTabAttrs("../payment-plan/")}>payment plan</a>.</p>
      </div>
    </section>
    ${leadForm(1, { path: "/al-furjan-properties/", heading: "Enquire About Richmond District Al Furjan", button: "Register Interest" })}
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

const BUILD_DATE = new Date().toISOString().slice(0, 10);

function publicPageCatalog(coralPaths = []) {
  const dubai = [
    {
      path: "/",
      priority: "1.0",
      group: "Al Furjan, Dubai",
      title: "Richmond District (Richmond Residences)",
      description:
        "Main project page for Richmond District by Mira Developments in Al Furjan — overview, pricing, amenities, FAQs, and registration.",
    },
    {
      path: "/brochure/",
      priority: "0.8",
      group: "Al Furjan, Dubai",
      title: "Richmond District Brochure",
      description: "Request the Richmond District brochure and project fact sheet for Al Furjan, Dubai (Richmond Residences).",
    },
    {
      path: "/floor-plans/",
      priority: "0.8",
      group: "Al Furjan, Dubai",
      title: "Richmond District Floor Plans",
      description: "Studio, 1-bed, and 2-bed apartment sizes with floor plan PDFs on request.",
    },
    {
      path: "/payment-plan/",
      priority: "0.8",
      group: "Al Furjan, Dubai",
      title: "Richmond District Payment Plan",
      description: "45/5/50 payment structure for Richmond District Tower 1 (Richmond Residences) Al Furjan.",
    },
    {
      path: "/price-list/",
      priority: "0.8",
      group: "Al Furjan, Dubai",
      title: "Richmond District Price List",
      description: "Confirmed Tower 1 starting prices from AED 943,500 with availability on request.",
    },
    {
      path: "/al-furjan-properties/",
      priority: "0.7",
      group: "Al Furjan, Dubai",
      title: "Properties in Al Furjan",
      description: "Area guide for Al Furjan and how Richmond District fits the community.",
    },
  ];

  const coral = [
    {
      path: `${CORAL_BAY_PATH}/`,
      priority: "0.85",
      group: "Mira Coral Bay, RAK",
      title: CORAL_BAY_NAME,
      description:
        "Waterfront John Richmond-branded homes at Mira Coral Bay, Al Mairid, Ras Al Khaimah — overview, pricing, and registration.",
    },
    {
      path: `${CORAL_BAY_PATH}/brochure/`,
      priority: "0.8",
      group: "Mira Coral Bay, RAK",
      title: "Mira Coral Bay Brochure",
      description: "Request the John Richmond Residences at Mira Coral Bay brochure.",
    },
    {
      path: `${CORAL_BAY_PATH}/floor-plans/`,
      priority: "0.8",
      group: "Mira Coral Bay, RAK",
      title: "Mira Coral Bay Floor Plans",
      description: "Studios through 3-bed duplex layouts at Richmond Residences, RAK.",
    },
    {
      path: `${CORAL_BAY_PATH}/payment-plan/`,
      priority: "0.8",
      group: "Mira Coral Bay, RAK",
      title: "Mira Coral Bay Payment Plan",
      description: "Payment schedule details for John Richmond Residences at Mira Coral Bay.",
    },
    {
      path: `${CORAL_BAY_PATH}/price-list/`,
      priority: "0.8",
      group: "Mira Coral Bay, RAK",
      title: "Mira Coral Bay Price List",
      description: "Starting prices from AED 550,000 with current availability on request.",
    },
  ];

  const utility = [
    {
      path: "/sitemap/",
      priority: "0.3",
      group: "Site",
      title: "Sitemap",
      description: "HTML index of all public pages on richmondresidences.ae.",
    },
  ];

  return [...dubai, ...towers.catalogEntries(), ...coral.filter((entry) => coralPaths.includes(entry.path)), ...utility];
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Allow: /favicon.ico
Allow: /favicon/

# LLM-friendly index: ${SITE}/llms.txt

Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/sitemap-images.xml
`;
}

function sitemapXml(pages) {
  const urls = pages
    .map(
      (entry) => `  <url>
    <loc>${SITE}${entry.path}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function llmsTxt(pages) {
  const pageLines = pages
    .filter((entry) => entry.path !== "/sitemap/")
    .map((entry) => `- [${entry.title}](${SITE}${entry.path}): ${entry.description}`)
    .join("\n");

  return `# Richmond District by Mira Developments

> Independent marketing site for Richmond District (Richmond Residences) by Mira Developments in Al Furjan, Dubai and John Richmond Residences at Mira Coral Bay, Ras Al Khaimah. This is not the official Mira Developments website.

Canonical site: ${SITE}/

Updated: ${BUILD_DATE}

## What is confirmed

### Richmond District — Al Furjan, Dubai

- Developer: Mira Developments, in collaboration with John Richmond.
- Official name: Richmond District (also marketed as Richmond Residences).
- Architecture: Archea Associati, led by architect Marco Casamonti.
- Location: Al Furjan, Dubai, adjacent to Discovery Gardens Metro Station.
- Product: Fully furnished studios and 1–2 bedroom apartments, move-in ready.
- Starting prices: Studio from AED 943,500; 1-bed from AED 1,871,700; 2-bed from AED 2,584,680.
- Payment plan: 45/5/50 — 45% during construction, 5% on completion, 50% over 39 months post-handover.
- Handover: Tower 1 scheduled Q1 2029.
- Status: Tower 1 launched and available; verify current inventory with Mira Developments or an authorized representative.

### ${CORAL_BAY_NAME} — Ras Al Khaimah

- Developer: Mira Developments, John Richmond-branded collection within Mira Coral Bay.
- Location: Al Mairid, Ras Al Khaimah (Marjan master developer; different regulatory framework from Dubai RERA).
- Product: 293 waterfront homes — studios through 3-bed duplexes, fully furnished.
- Starting prices: Studio from AED 550,000; up to 3-bed duplex from AED 3,500,000.
- Status: Under construction; sale status was Expression of Interest (EOI) at the August 2026 source snapshot — confirm current availability before booking.
- Handover: Expected Q2–Q3 2029; confirm exact date with Mira Developments.

## Register

Use the registration form on any page (name, email, phone). A Richmond District representative follows up with brochure, floor plans, price list, or payment plan details. No automated welcome email is sent to the visitor.

## Pages

${pageLines}

## Key entities

- Developer: Mira Developments
- Brand partner: John Richmond
- Projects: Richmond District (Al Furjan, Dubai); ${CORAL_BAY_NAME} (Mira Coral Bay, RAK)
- Canonical host: richmondresidences.ae

## Optional

- [llms.txt](${SITE}/llms.txt)
- [Sitemap (HTML)](${SITE}/sitemap/)
- [sitemap.xml](${SITE}/sitemap.xml)
- [sitemap-images.xml](${SITE}/sitemap-images.xml)
- [robots.txt](${SITE}/robots.txt)
`;
}

function sitemapListHtml(prefix, pages, groupName) {
  const items = pages
    .filter((entry) => entry.group === groupName)
    .map(
      (entry) =>
        `<li><a href="${prefix}${entry.path.replace(/^\//, "")}"${newTabAttrs(entry.path)}>${esc(entry.title)}</a><span class="sitemap-desc">${esc(entry.description)}</span></li>`,
    )
    .join("\n            ");
  return `<ul class="sitemap-list">${items}</ul>`;
}

function sitemapPage() {
  const pages = publicPageCatalog([
    `${CORAL_BAY_PATH}/`,
    `${CORAL_BAY_PATH}/brochure/`,
    `${CORAL_BAY_PATH}/floor-plans/`,
    `${CORAL_BAY_PATH}/payment-plan/`,
    `${CORAL_BAY_PATH}/price-list/`,
  ]).filter((entry) => entry.path !== "/sitemap/");

  const title = "Sitemap | Richmond District by Mira Developments";
  const description =
    "Complete index of Richmond District pages — Al Furjan, Dubai and Mira Coral Bay, Ras Al Khaimah.";

  const body = `
    ${subpageHero("Sitemap", "All public pages on richmondresidences.ae", { depth: 1 })}
    <section class="section">
      <div class="container stack">
        <p class="section-note">Machine-readable indexes: <a href="/sitemap.xml">sitemap.xml</a>, <a href="/sitemap-images.xml">sitemap-images.xml</a>, and <a href="/llms.txt">llms.txt</a> for AI agents.</p>
        <div class="sitemap-grid">
          <div class="sitemap-group">
            <h2>Al Furjan, Dubai</h2>
            ${sitemapListHtml("", pages, "Al Furjan, Dubai")}
          </div>
          <div class="sitemap-group">
            <h2>Mira Coral Bay, RAK</h2>
            ${sitemapListHtml("", pages, "Mira Coral Bay, RAK")}
          </div>
        </div>
      </div>
    </section>`;

  return pageShell({
    depth: 1,
    title,
    description,
    canonical: `${SITE}/sitemap/`,
    path: "/sitemap/",
    schemas: [jsonLd(breadcrumbs([{ name: "Richmond District", path: "/" }, { name: "Sitemap", path: "/sitemap/" }]))],
    body,
  });
}

function manifestJson() {
  return JSON.stringify(
    {
      name: "Richmond District",
      short_name: "Richmond District",
      description: "Richmond District (Richmond Residences) by Mira Developments — Al Furjan, Dubai & Mira Coral Bay, RAK",
      start_url: "/",
      display: "standalone",
      background_color: "#faf9f6",
      theme_color: "#2d4a2d",
      icons: [
        { src: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { src: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { src: "/favicon/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  );
}

function sitemapImagesXml() {
  const heroDubai = `${SITE}/${SUBPAGE_HERO_DUBAI.imagePath}`;
  const heroCoral = `${SITE}/${SUBPAGE_HERO_CORAL.imagePath}`;
  const dubaiSubpages = [
    "/brochure/",
    "/floor-plans/",
    "/payment-plan/",
    "/price-list/",
    "/al-furjan-properties/",
    ...towers.sitemapImagePaths(),
  ];
  const coralSubpages = ["/brochure/", "/floor-plans/", "/payment-plan/", "/price-list/"];

  const images = [
    {
      page: "/",
      imgs: [
        { img: OG_DUBAI, title: OG_DUBAI_ALT },
        { img: heroDubai, title: SUBPAGE_HERO_DUBAI.alt },
      ],
    },
    ...dubaiSubpages.map((page) => ({
      page,
      imgs: [
        { img: OG_DUBAI, title: `Richmond District${page.replace(/\//g, " ").trim()}` },
        { img: heroDubai, title: SUBPAGE_HERO_DUBAI.alt },
      ],
    })),
    {
      page: `${coralBay.CORAL_BAY_PATH}/`,
      imgs: [
        { img: OG_CORAL, title: OG_CORAL_ALT },
        { img: heroCoral, title: SUBPAGE_HERO_CORAL.alt },
      ],
    },
    ...coralSubpages.map((page) => ({
      page: `${coralBay.CORAL_BAY_PATH}${page}`,
      imgs: [
        { img: OG_CORAL, title: `Mira Coral Bay ${page.replace(/\//g, " ").trim()}` },
        { img: heroCoral, title: SUBPAGE_HERO_CORAL.alt },
      ],
    })),
  ];

  const urls = images
    .map(
      (entry) => `  <url>
    <loc>${SITE}${entry.page}</loc>
${entry.imgs
  .map(
    (image) => `    <image:image>
      <image:loc>${image.img}</image:loc>
      <image:title>${esc(image.title)}</image:title>
    </image:image>`,
  )
  .join("\n")}
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
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
  SUBPAGE_HERO_CORAL,
  faqBlock,
  leadForm,
  heroSection,
  heroFormCompact,
  modalTriggerBtn,
  inquiryModal,
  newTabAttrs,
  resourceLink,
  OG_CORAL,
  OG_CORAL_ALT,
  OG_CORAL_W,
  OG_CORAL_H,
});

const towers = require("./towers").register({
  SITE,
  esc,
  fmtAed,
  jsonLd,
  breadcrumbs,
  faqSchema,
  assetPrefix,
  pageShell,
  subpageHero,
  SUBPAGE_HERO_DUBAI,
  leadForm,
  pricingTable,
  UNITS,
  PROJECT_PRIMARY,
  PROJECT_SECONDARY,
  OG_DUBAI,
  resourceLink,
  newTabAttrs,
  realEstateListingSchema,
});

const coralPages = coralBay.pages();

writeFile("index.html", homePage());
writeFile("brochure/index.html", brochurePage());
writeFile("floor-plans/index.html", floorPlansPage());
writeFile("payment-plan/index.html", paymentPlanPage());
writeFile("price-list/index.html", priceListPage());
writeFile("al-furjan-properties/index.html", alFurjanPage());
towers.writeAll(writeFile);
writeFile("sitemap/index.html", sitemapPage());
writeFile("richmond-residences-mira-coral-bay/index.html", coralPages.main);
writeFile("richmond-residences-mira-coral-bay/brochure/index.html", coralPages.brochure);
writeFile("richmond-residences-mira-coral-bay/floor-plans/index.html", coralPages.floorPlans);
writeFile("richmond-residences-mira-coral-bay/payment-plan/index.html", coralPages.paymentPlan);
writeFile("richmond-residences-mira-coral-bay/price-list/index.html", coralPages.priceList);

const sitemapPages = publicPageCatalog(coralBay.sitemapPaths());
writeFile("robots.txt", robotsTxt());
writeFile("sitemap.xml", sitemapXml(sitemapPages));
writeFile("sitemap-images.xml", sitemapImagesXml());
writeFile("llms.txt", llmsTxt(sitemapPages));
writeFile("manifest.json", manifestJson());

console.log("Done — Richmond District site generated.");
