#!/usr/bin/env node
"use strict";

/** John Richmond Residences at Mira Coral Bay — page builders and constants. */

const CORAL_BAY_PATH = "/richmond-residences-mira-coral-bay";
const CORAL_BAY_SLUG = "richmond-residences-coral-bay";
const CORAL_BAY_NAME = "John Richmond Residences at Mira Coral Bay";

const CORAL_BAY_GEO = {
  region: "AE-RK",
  placename: "Al Mairid, Ras Al Khaimah",
  lat: 25.682,
  lng: 55.792,
};

const CORAL_BAY_UNITS = [
  { type: "Studio", slug: "studio", sqm: 40.07, sqft: 431, aed: 550000, usd: 150000 },
  { type: "1 Bed", slug: "1-bed", sqm: 79.37, sqft: 854, aed: 1100000, usd: 300000 },
  { type: "2 Bed", slug: "2-bed", sqm: 131.07, sqft: 1411, aed: 1750000, usd: 475000 },
  { type: "3 Bed", slug: "3-bed", sqm: 167.76, sqft: 1806, aed: 2300000, usd: 625000 },
  { type: "2 Bed Duplex", slug: "2-bed-duplex", sqm: 167.79, sqft: 1806, aed: 2500000, usd: 680000 },
  { type: "3 Bed Duplex", slug: "3-bed-duplex", sqm: 237.89, sqft: 2560, aed: 3500000, usd: 950000 },
];

const PAYMENT_NOTE =
  "Payment plan terms may vary by unit and release phase, confirm current structure with your Richmond Residences advisor.";

const HANDOVER_NOTE =
  "Handover expected Q2–Q3 2029, confirm exact date with Mira Developments or your sales contact.";

function register(deps) {
  const {
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
    OG_CORAL_ALT,
    OG_CORAL_W,
    OG_CORAL_H,
  } = deps;

  const ogOpts = {
    ogImage: OG_CORAL,
    ogImageAlt: OG_CORAL_ALT,
    ogImageWidth: OG_CORAL_W,
    ogImageHeight: OG_CORAL_H,
  };

  function img(depth, file) {
    return `${assetPrefix(depth)}images/coral-bay/${file}`;
  }

  function pricingTableCoral(depth = 0) {
    return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Unit Type</th><th>Size</th><th>Starting Price (AED)</th><th>Starting Price (USD)</th></tr></thead>
    <tbody>${CORAL_BAY_UNITS.map(
      (u) => `<tr>
        <td>${esc(u.type)}</td>
        <td>${u.sqft} sqft / ${u.sqm} sqm</td>
        <td>AED ${fmtAed(u.aed)}</td>
        <td>USD ${fmtAed(u.usd)}</td>
      </tr>`,
    ).join("\n")}</tbody>
  </table></div>`;
  }

  function realEstateListingSchemaCoral() {
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: "John Richmond Residences at Mira Coral Bay, Ras Al Khaimah",
      description:
        "Fully furnished studios to 3-bedroom duplexes at John Richmond Residences, Richmond Residences Mira Coral Bay, Al Mairid, Ras Al Khaimah.",
      url: `${SITE}${CORAL_BAY_PATH}/`,
      datePosted: "2026-08-28",
      image: OG_CORAL,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Al Mairid",
        addressRegion: "Ras Al Khaimah",
        addressCountry: "AE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: CORAL_BAY_GEO.lat,
        longitude: CORAL_BAY_GEO.lng,
      },
      offers: CORAL_BAY_UNITS.map((u) => ({
        "@type": "Offer",
        name: `${u.type}`,
        price: String(u.aed),
        priceCurrency: "AED",
        availability: "https://schema.org/PreOrder",
        url: `${SITE}${CORAL_BAY_PATH}/price-list/`,
        description: `${u.sqft} sqft / ${u.sqm} sqm`,
      })),
    };
  }

  function paymentPlanDetail() {
    return `
    <div class="plan-card">
      <div class="plan-card-head">
        <h3>Payment plan</h3>
        <p class="plan-5050">50/50 — 50% pre-handover · 50% post-handover</p>
      </div>

      <div class="plan-bar" role="img" aria-label="Payment plan: 10% on booking, 35% during construction, 5% on handover, 50% post-handover">
        <div class="plan-bar-seg seg-booking" style="width:10%"><span class="visually-hidden">On booking 10%</span></div>
        <div class="plan-bar-seg seg-construction" style="width:35%"><span class="visually-hidden">During construction 35%</span></div>
        <div class="plan-bar-seg seg-handover" style="width:5%"><span class="visually-hidden">Upon handover 5%</span></div>
        <div class="plan-bar-seg seg-post" style="width:50%"><span class="visually-hidden">Post-handover 50%</span></div>
      </div>
      <div class="plan-bar-labels" aria-hidden="true">
        <span style="width:10%">10%</span>
        <span style="width:35%">35%</span>
        <span style="width:5%">5%</span>
        <span style="width:50%">50%</span>
      </div>

      <ul class="plan-breakdown">
        <li class="plan-row">
          <span class="plan-row-label">On booking</span>
          <span class="plan-row-pct">10%</span>
        </li>
        <li class="plan-row plan-row-group">
          <details class="plan-details" open>
            <summary class="plan-summary">
              <span class="plan-row-label">During construction</span>
              <span class="plan-row-pct">35%</span>
            </summary>
            <p class="plan-sub-hint">2 payment groups</p>
            <ul class="plan-sub">
              <li><span>1 month from booking</span><strong>10%</strong></li>
              <li><span>5% every 6 months (at 6, 12, 18, 24 &amp; 30 months)</span><strong>25%</strong></li>
            </ul>
          </details>
        </li>
        <li class="plan-row">
          <span class="plan-row-label">Upon handover</span>
          <span class="plan-row-pct">5%</span>
        </li>
        <li class="plan-row plan-row-group">
          <details class="plan-details" open>
            <summary class="plan-summary">
              <span class="plan-row-label">Within 36 months post-handover <span class="plan-row-note">(5% every 4 months)</span></span>
              <span class="plan-row-pct">50%</span>
            </summary>
            <ul class="plan-sub">
              <li><span>4 months after handover</span><strong>5%</strong></li>
              <li><span>8 months after handover</span><strong>5%</strong></li>
              <li><span>12 months after handover</span><strong>5%</strong></li>
              <li><span>16 months after handover</span><strong>5%</strong></li>
              <li><span>20 months after handover</span><strong>10%</strong></li>
              <li><span>24 months after handover</span><strong>5%</strong></li>
              <li><span>28 months after handover</span><strong>5%</strong></li>
              <li><span>32 months after handover</span><strong>5%</strong></li>
              <li><span>36 months after handover</span><strong>5%</strong></li>
            </ul>
          </details>
        </li>
      </ul>

      <p class="verify-note"><strong>Note:</strong> ${esc(PAYMENT_NOTE)}</p>
    </div>`;
  }

  const CORAL_FAQS = [
    {
      q: "What is John Richmond Residences at Mira Coral Bay?",
      a: "John Richmond Residences is a collection of 293 fully furnished homes within Mira Coral Bay, Al Mairid, Ras Al Khaimah, developed by Mira Developments in collaboration with British fashion designer John Richmond. It forms part of Mira's multi-branded waterfront community at Mira Coral Bay, regulated under Marjan as Ras Al Khaimah's master developer.",
    },
    {
      q: "Where is Mira Coral Bay located?",
      a: "Mira Coral Bay sits in Al Mairid, Ras Al Khaimah, where the emirate's mountains meet the sea. Downtown Ras Al Khaimah is minutes away, Al Marjan Island and Wynn Al Marjan Island are within easy reach, and Ras Al Khaimah International Airport is a short journey away.",
    },
    {
      q: "What unit types are available at Richmond Residences, Ras Al Khaimah?",
      a: "Richmond Residences Mira Coral Bay offers Studio, 1-Bed, 2-Bed, and 3-Bed apartments, plus 2-Bed Duplex and 3-Bed Duplex homes. The building comprises G + 8 floors plus roof. All 293 homes in this collection are fully furnished.",
    },
    {
      q: "What are the starting prices at Mira Coral Bay?",
      a: "Studios start from AED 550,000 (USD 150,000). 1-bed from AED 1,100,000 (USD 300,000), 2-bed from AED 1,750,000 (USD 475,000), 3-bed from AED 2,300,000 (USD 625,000), 2-bed duplex from AED 2,500,000 (USD 680,000), and 3-bed duplex from AED 3,500,000 (USD 950,000).",
    },
    {
      q: "What is the payment plan?",
      a: `Richmond Residences Mira Coral Bay follows a 50/50 plan: 50% pre-handover (10% on booking, 35% during construction — 10% at 1 month plus 25% in 5% instalments every 6 months — and 5% upon handover) and 50% post-handover within 36 months (5% every 4 months, with 10% at 20 months per the official Mira brochure). ${PAYMENT_NOTE}`,
    },
    {
      q: "When is the handover date?",
      a: HANDOVER_NOTE,
    },
    {
      q: "What is Mira Care?",
      a: "Mira Care is Mira Developments' five-year maintenance warranty — described as the first developer in the UAE to apply this as standard. It covers core building systems, structural elements, MEP installations, lighting, and paintwork. Loose furniture carries a three-year warranty; fixtures are covered for five years.",
    },
    {
      q: "Is this the same as Richmond Residences in Al Furjan, Dubai?",
      a: `Same developer (Mira Developments) and the same John Richmond brand collaboration, but a separate development in a different emirate. Richmond Residences, Ras Al Khaimah at Mira Coral Bay is a waterfront collection in Al Mairid, while the Dubai project is Richmond District in Al Furjan. <a href="${SITE}/">Explore Richmond Residences in Dubai</a>.`,
    },
  ];

  function coralLeadForm(depth, opts = {}) {
    return leadForm(depth, {
      ...opts,
      path: opts.path || `${CORAL_BAY_PATH}/`,
      projectSlug: CORAL_BAY_SLUG,
      projectName: CORAL_BAY_NAME,
      consentText:
        "By submitting, you consent to be contacted regarding John Richmond Residences at Mira Coral Bay, Ras Al Khaimah.",
    });
  }

  function coralMainPage() {
    const title = "John Richmond Residences at Mira Coral Bay | Ras Al Khaimah, by Mira";
    const description =
      "John Richmond Residences at Mira Coral Bay, Al Mairid, Ras Al Khaimah, by Mira Developments. Studios to 3-bed duplexes from AED 550,000. Waterfront branded living with John Richmond.";
    const keywords =
      "John Richmond Residences, Richmond Residences Mira Coral Bay, Richmond Residences Ras Al Khaimah, Richmond Residences RAK, Mira Coral Bay, Mira Coral Bay Ras Al Khaimah, John Richmond Residences Al Mairid, Richmond Residences Al Mairid, Mira Coral Bay brochure, Mira Coral Bay price list, branded residences Ras Al Khaimah, waterfront apartments Ras Al Khaimah, properties in Ras Al Khaimah";

    const depth = 1;
    const schemas = [
      jsonLd(realEstateListingSchemaCoral()),
      jsonLd(
        breadcrumbs([
          { name: "Richmond Residences", path: "/" },
          { name: "Mira Coral Bay", path: `${CORAL_BAY_PATH}/` },
        ]),
      ),
      faqSchema(CORAL_FAQS),
    ];

    const body = `
    <section class="hero section">
      <div class="hero-bg" style="background-image:url('${img(depth, "hero/hero-1.webp")}')"></div>
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow eyebrow-light">Richmond Residences, Ras Al Khaimah</p>
          <h1>John Richmond Residences at Mira Coral Bay — Ras Al Khaimah</h1>
          <p class="hero-sub">Waterfront branded homes by Mira Developments and John Richmond at <strong>Mira Coral Bay, Al Mairid</strong> — studios to 3-bed duplexes from <strong>AED 550,000</strong>. Expression of Interest open; confirm current sale status before booking.</p>
          <div class="hero-stats">
            <div><span class="stat-label">From</span><span class="stat-value">AED 550,000</span></div>
            <div><span class="stat-label">Homes</span><span class="stat-value">293</span></div>
            <div><span class="stat-label">Status</span><span class="stat-value">Under construction</span></div>
          </div>
        </div>
        <div class="hero-form-card">
          <h2>Register Your Interest</h2>
          <p>Request Mira Coral Bay brochure, floor plans, and price list for Richmond Residences, RAK.</p>
          <form class="form form-compact" action="${assetPrefix(depth)}api/enquire" method="post" novalidate>
            <input type="hidden" name="source_page" value="${SITE}${CORAL_BAY_PATH}/">
            <input type="hidden" name="project_slug" value="${CORAL_BAY_SLUG}">
            <input type="hidden" name="project_name" value="${CORAL_BAY_NAME}">
            <div class="form-alert" role="status" aria-live="polite" hidden></div>
            <label class="field"><span>Name</span><input type="text" name="name" required maxlength="200"></label>
            <label class="field"><span>Email</span><input type="email" name="email" required maxlength="200"></label>
            <div class="field phone-field"><span>Phone</span><div class="phone-row">
              <select name="country_code"><option value="+971" selected>+971</option><option value="+44">+44</option><option value="+1">+1</option></select>
              <input type="tel" name="phone" required maxlength="30">
            </div></div>
            <label class="field"><span>Interest</span><select name="interest" required>
              <option value="">Select</option>
              <option value="Brochure & Project Details">Brochure &amp; Project Details</option>
              <option value="Floor Plans">Floor Plans</option>
              <option value="Price List & Availability">Price List &amp; Availability</option>
              <option value="Payment Plan">Payment Plan</option>
              <option value="Investment Opportunity">Investment Opportunity</option>
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
            <h2>Mira Coral Bay — John Richmond Collection, Ras Al Khaimah</h2>
          </div>
          <p>John Richmond Residences forms a distinct 293-home collection within Mira Coral Bay, which Mira Developments describes as the world's first multi-branded waterfront community. The wider masterplan sits in Al Mairid, Ras Al Khaimah, under Marjan — the emirate's master developer, operating under a different regulatory framework from Dubai RERA.</p>
          <p>The same John Richmond collaboration that defines Richmond Residences in Dubai is applied here as fully furnished, move-in-ready waterfront homes. The project is under construction, with escrow confirmed in place per the August 2026 source snapshot. Sale status was EOI (Expression of Interest) at that date — verify current availability before committing.</p>
          <p class="cross-link">Also exploring <a href="${assetPrefix(depth)}">Richmond Residences in Dubai</a>? The Al Furjan project shares the John Richmond brand but is a separate Mira development in Dubai.</p>
        </div>
        <figure class="media-frame">
          <img src="${img(depth, "exterior/ext-1.webp")}" alt="Mira Coral Bay waterfront community, Ras Al Khaimah" loading="lazy">
        </figure>
      </div>
    </section>

    <section class="section section-alt" id="pricing">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Unit types &amp; pricing</p>
          <h2>Richmond Residences Mira Coral Bay — Starting Prices</h2>
          <p>Studios through 3-bed duplexes at Richmond Residences, Ras Al Khaimah. <a href="./price-list/">View the Mira Coral Bay price list</a>.</p>
        </div>
        ${pricingTableCoral(depth)}
        <div class="cta-row">
          <a class="btn btn-accent" href="./price-list/">Mira Coral Bay Price List</a>
          <a class="btn btn-outline" href="./payment-plan/">Payment Plan</a>
        </div>
      </div>
    </section>

    <section class="section" id="interiors">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Interiors &amp; design</p>
          <h2>Italian Finishes &amp; John Richmond Styling — Move-In Ready</h2>
        </div>
        <div class="feature-grid">
          <article class="feature-card">
            <img src="${img(depth, "interior/int-1.webp")}" alt="John Richmond interior at Mira Coral Bay, RAK" loading="lazy">
            <h3>Fully Furnished Collection</h3>
            <p>Each of the 293 Richmond Residences homes arrives complete with Italian-made furniture, premium appliances, designer lighting, luxury linens, full kitchen equipment, and tableware — ready to occupy from handover without additional fit-out.</p>
          </article>
          <article class="feature-card">
            <img src="${img(depth, "interior/int-2.webp")}" alt="Premium interior finishes at Richmond Residences Ras Al Khaimah" loading="lazy">
            <h3>John Richmond Design Language</h3>
            <p>The British fashion house's aesthetic runs through every residence in this Ras Al Khaimah collection, matching the brand partnership Mira Developments also brings to its Dubai Richmond project — applied here as waterfront living at Al Mairid.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-dark" id="amenities">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow eyebrow-light">Amenities</p>
          <h2>Waterfront Lifestyle at Mira Coral Bay, RAK</h2>
        </div>
        <ul class="amenity-grid">
          <li>Direct private beach access</li>
          <li>Yacht club</li>
          <li>Multiple swimming pools</li>
          <li>Kids' pool and splash zone</li>
          <li>Pool deck</li>
          <li>Beach club</li>
          <li>Restaurant, cafés and retail</li>
          <li>Lobby café</li>
          <li>Fully equipped gym</li>
          <li>Separate gym spaces</li>
          <li>Steam room &amp; massage room</li>
          <li>Wellness centre</li>
          <li>Landscaped walking areas &amp; outdoor trails</li>
          <li>Family-oriented spaces</li>
          <li>Concierge &amp; valet parking</li>
          <li>Housekeeping (5-star hotel-level services)</li>
        </ul>
        <div class="gallery-grid">
          <img src="${img(depth, "amenities/beach.webp")}" alt="Beach access at Mira Coral Bay" loading="lazy">
          <img src="${img(depth, "amenities/pool.webp")}" alt="Swimming pools at Mira Coral Bay RAK" loading="lazy">
          <img src="${img(depth, "amenities/wellness.webp")}" alt="Wellness centre at Richmond Residences RAK" loading="lazy">
          <img src="${img(depth, "exterior/ext-2.webp")}" alt="Mira Coral Bay exterior" loading="lazy">
        </div>
      </div>
    </section>

    <section class="section" id="location">
      <div class="container split-grid">
        <div class="stack">
          <div class="section-head">
            <p class="eyebrow">Location</p>
            <h2>Al Mairid, Ras Al Khaimah — Mountains &amp; Sea</h2>
          </div>
          <p>Richmond Residences Mira Coral Bay occupies Al Mairid, where Ras Al Khaimah's mountain backdrop meets the Arabian Gulf. Downtown Ras Al Khaimah is minutes away for everyday needs.</p>
          <ul class="proximity-list">
            <li><strong>Al Marjan Island</strong> — within easy reach, home to Wynn Al Marjan Island resort</li>
            <li><strong>Al Hamra Golf Club</strong> — nearby</li>
            <li><strong>Ras Al Khaimah International Airport</strong> — short journey</li>
            <li><strong>Dubai</strong> — within comfortable driving distance</li>
          </ul>
        </div>
        <figure class="media-frame">
          <img src="${img(depth, "location/location.webp")}" alt="Al Mairid and Mira Coral Bay location context, Ras Al Khaimah" loading="lazy">
        </figure>
      </div>
    </section>

    <section class="section section-alt" id="mira-care">
      <div class="container stack">
        <div class="section-head">
          <p class="eyebrow">Mira Care</p>
          <h2>Five-Year Warranty at Richmond Residences, RAK</h2>
        </div>
        <p>Every home at John Richmond Residences, Mira Coral Bay includes Mira Care — Mira Developments' five-year maintenance warranty, described as the first developer in the UAE to offer this as standard across its portfolio. Coverage includes core building systems, structural elements, MEP installations, lighting, and paintwork. Loose furniture is warrantied for three years; fixtures for five years.</p>
      </div>
    </section>

    <section class="section" id="payment">
      <div class="container stack">
        <div class="section-head">
          <p class="eyebrow">Payment plan</p>
          <h2>50/50 Plan — Richmond Residences, Ras Al Khaimah</h2>
          <p>Official Mira brochure structure for John Richmond Residences at Mira Coral Bay.</p>
        </div>
        ${paymentPlanDetail()}
        <p class="verify-note">${esc(HANDOVER_NOTE)} Escrow is confirmed in place per the August 2026 source snapshot.</p>
      </div>
    </section>

    ${faqBlock(CORAL_FAQS)}
    ${coralLeadForm(depth, { heading: "Request Mira Coral Bay Brochure &amp; Price List", button: "Submit Enquiry" })}
  `;

    return pageShell({
      depth,
      title,
      description,
      canonical: `${SITE}${CORAL_BAY_PATH}/`,
      path: `${CORAL_BAY_PATH}/`,
      keywords,
      schemas,
      body,
      geo: CORAL_BAY_GEO,
      ...ogOpts,
    });
  }

  function coralBrochurePage() {
    const depth = 2;
    const title = "Mira Coral Bay Brochure | John Richmond Residences, Ras Al Khaimah";
    const description =
      "Request the John Richmond Residences at Mira Coral Bay brochure — project overview, unit types, amenities, and payment plan for Richmond Residences, RAK.";
    const schemas = [
      jsonLd(
        breadcrumbs([
          { name: "Richmond Residences", path: "/" },
          { name: "Mira Coral Bay", path: `${CORAL_BAY_PATH}/` },
          { name: "Brochure", path: `${CORAL_BAY_PATH}/brochure/` },
        ]),
      ),
    ];
    const body = `
    ${subpageHero("Mira Coral Bay Brochure", "Fact sheet for John Richmond Residences at Mira Coral Bay, Al Mairid, Ras Al Khaimah.")}
    <p class="back-link container"><a href="../">Back to Richmond Residences Mira Coral Bay</a></p>
    <section class="section">
      <div class="container stack prose-full">
        <h2>Richmond Residences, Ras Al Khaimah — Summary</h2>
        <p>293 fully furnished homes by Mira Developments and John Richmond within the Mira Coral Bay waterfront masterplan. G + 8 floors + roof. Under construction; EOI status as of August 2026 — confirm current sale phase.</p>
        <h3>Unit Types &amp; Prices</h3>
        ${pricingTableCoral(depth)}
        <h3>Payment Plan (50/50)</h3>
        ${paymentPlanDetail()}
        <h3>Handover</h3>
        <p>${esc(HANDOVER_NOTE)}</p>
        <p>Submit the form below for the full Mira Coral Bay brochure. Materials are shared upon verified enquiry.</p>
      </div>
    </section>
    ${coralLeadForm(depth, { path: `${CORAL_BAY_PATH}/brochure/`, defaultInterest: "Brochure & Project Details", heading: "Request Mira Coral Bay Brochure", button: "Request Brochure" })}
  `;
    return pageShell({ depth, title, description, canonical: `${SITE}${CORAL_BAY_PATH}/brochure/`, path: `${CORAL_BAY_PATH}/brochure/`, schemas, body, geo: CORAL_BAY_GEO, ...ogOpts });
  }

  function coralFloorPlansPage() {
    const depth = 2;
    const title = "Mira Coral Bay Floor Plans | John Richmond Residences, RAK";
    const description =
      "Floor plans for John Richmond Residences at Mira Coral Bay — studios to 3-bed duplexes in Al Mairid, Ras Al Khaimah. Sizes and starting prices confirmed.";
    const schemas = [
      jsonLd(
        breadcrumbs([
          { name: "Richmond Residences", path: "/" },
          { name: "Mira Coral Bay", path: `${CORAL_BAY_PATH}/` },
          { name: "Floor Plans", path: `${CORAL_BAY_PATH}/floor-plans/` },
        ]),
      ),
    ];
    const cards = CORAL_BAY_UNITS.map(
      (u, i) => `
      <article class="unit-card">
        <img src="${img(depth, `interior/int-${(i % 3) + 1}.webp`)}" alt="${esc(u.type)} at Richmond Residences Mira Coral Bay, RAK" loading="lazy">
        <h2>${esc(u.type)}</h2>
        <p>${u.sqft} sqft / ${u.sqm} sqm · From AED ${fmtAed(u.aed)}</p>
        <p>Request the ${esc(u.type.toLowerCase())} floor plan PDF for Richmond Residences, Ras Al Khaimah.</p>
      </article>`,
    ).join("\n");
    const body = `
    ${subpageHero("Mira Coral Bay Floor Plans", "Studios to 3-bed duplexes at John Richmond Residences, Al Mairid, Ras Al Khaimah.")}
    <p class="back-link container"><a href="../">Richmond Residences Mira Coral Bay — Overview</a></p>
    <section class="section"><div class="container"><div class="unit-grid unit-grid-wide">${cards}</div>
    <p class="section-note">Building: G + 8 + Roof. Layout drawings provided on request for current EOI inventory at Mira Coral Bay.</p></div></section>
    ${coralLeadForm(depth, { path: `${CORAL_BAY_PATH}/floor-plans/`, defaultInterest: "Floor Plans", heading: "Request Mira Coral Bay Floor Plans", button: "Request Floor Plans" })}
  `;
    return pageShell({ depth, title, description, canonical: `${SITE}${CORAL_BAY_PATH}/floor-plans/`, path: `${CORAL_BAY_PATH}/floor-plans/`, schemas, body, geo: CORAL_BAY_GEO, ...ogOpts });
  }

  function coralPaymentPlanPage() {
    const depth = 2;
    const title = "Mira Coral Bay Payment Plan | 50/50, Ras Al Khaimah";
    const description =
      "Official 50/50 payment plan for John Richmond Residences at Mira Coral Bay, Ras Al Khaimah — pre- and post-handover instalments with advisor verification note.";
    const schemas = [
      jsonLd(
        breadcrumbs([
          { name: "Richmond Residences", path: "/" },
          { name: "Mira Coral Bay", path: `${CORAL_BAY_PATH}/` },
          { name: "Payment Plan", path: `${CORAL_BAY_PATH}/payment-plan/` },
        ]),
      ),
    ];
    const body = `
    ${subpageHero("Mira Coral Bay Payment Plan", "50/50 payment structure for Richmond Residences, Ras Al Khaimah — pre-handover and post-handover breakdown.")}
    <p class="back-link container"><a href="../">John Richmond Residences at Mira Coral Bay</a></p>
    <section class="section"><div class="container stack plan-page-wrap">${paymentPlanDetail()}
    <p>${esc(HANDOVER_NOTE)} See the <a href="../price-list/">Mira Coral Bay price list</a> for starting prices.</p></div></section>
    ${coralLeadForm(depth, { path: `${CORAL_BAY_PATH}/payment-plan/`, defaultInterest: "Payment Plan", heading: "Get Payment Schedule Details", button: "Request Payment Plan" })}
  `;
    return pageShell({ depth, title, description, canonical: `${SITE}${CORAL_BAY_PATH}/payment-plan/`, path: `${CORAL_BAY_PATH}/payment-plan/`, schemas, body, geo: CORAL_BAY_GEO, ...ogOpts });
  }

  function coralPriceListPage() {
    const depth = 2;
    const title = "Mira Coral Bay Price List | From AED 550,000, Ras Al Khaimah";
    const description =
      "Confirmed starting prices for John Richmond Residences at Mira Coral Bay, Al Mairid, Ras Al Khaimah. Studios to 3-bed duplexes.";
    const schemas = [
      jsonLd(realEstateListingSchemaCoral()),
      jsonLd(
        breadcrumbs([
          { name: "Richmond Residences", path: "/" },
          { name: "Mira Coral Bay", path: `${CORAL_BAY_PATH}/` },
          { name: "Price List", path: `${CORAL_BAY_PATH}/price-list/` },
        ]),
      ),
    ];
    const body = `
    ${subpageHero("Mira Coral Bay Price List", "Starting prices for Richmond Residences, Ras Al Khaimah — John Richmond collection at Mira Coral Bay.")}
    <p class="back-link container"><a href="../../">Richmond Residences — Dubai home</a> · <a href="../">Mira Coral Bay overview</a></p>
    <section class="section"><div class="container">
    <p>All prices for fully furnished John Richmond Residences at Mira Coral Bay. EOI status as of August 2026 — register for current availability at Richmond Residences, RAK.</p>
    ${pricingTableCoral(depth)}
    <p class="section-note">${esc(HANDOVER_NOTE)} ${esc(PAYMENT_NOTE)}</p>
    </div></section>
    ${coralLeadForm(depth, { path: `${CORAL_BAY_PATH}/price-list/`, defaultInterest: "Price List & Availability", heading: "Request Current Availability", button: "Get Price List" })}
  `;
    return pageShell({ depth, title, description, canonical: `${SITE}${CORAL_BAY_PATH}/price-list/`, path: `${CORAL_BAY_PATH}/price-list/`, schemas, body, geo: CORAL_BAY_GEO, ...ogOpts });
  }

  function flagshipSection() {
    return `
    <section class="section section-flagship" id="flagship-projects">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Flagship projects</p>
          <h2>Richmond Residences, Ras Al Khaimah</h2>
          <p>Mira Developments and John Richmond have also brought this collaboration to Mira Coral Bay in Ras Al Khaimah. Explore John Richmond Residences at Mira Coral Bay.</p>
        </div>
        <a class="project-card" href="./richmond-residences-mira-coral-bay/">
          <img src="./images/coral-bay/exterior/ext-3.webp" alt="John Richmond Residences at Mira Coral Bay, Ras Al Khaimah" loading="lazy">
          <div class="project-card-body">
            <p class="project-card-location">Al Mairid · Ras Al Khaimah · Mira Coral Bay</p>
            <h3>John Richmond Residences at Mira Coral Bay</h3>
            <p class="project-card-meta">Studios to 3-bed duplexes · 293 homes · From AED 550,000</p>
            <span class="project-card-cta">Explore Richmond Residences, RAK &rarr;</span>
          </div>
        </a>
      </div>
    </section>`;
  }

  return {
    CORAL_BAY_PATH,
    flagshipSection,
    pages: () => ({
      main: coralMainPage(),
      brochure: coralBrochurePage(),
      floorPlans: coralFloorPlansPage(),
      paymentPlan: coralPaymentPlanPage(),
      priceList: coralPriceListPage(),
    }),
    sitemapPaths: () => [
      `${CORAL_BAY_PATH}/`,
      `${CORAL_BAY_PATH}/brochure/`,
      `${CORAL_BAY_PATH}/floor-plans/`,
      `${CORAL_BAY_PATH}/payment-plan/`,
      `${CORAL_BAY_PATH}/price-list/`,
    ],
  };
}

module.exports = { register, CORAL_BAY_PATH, CORAL_BAY_SLUG, CORAL_BAY_NAME };
