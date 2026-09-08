#!/usr/bin/env node
"use strict";

/** Richmond District tower pages — Tower 1 + Business Tower + Towers 2–5 */

function pricingCta(towerName) {
  return `Pricing for ${towerName} is available on request — get in touch and we'll confirm current pricing and availability for your preferred unit type.`;
}

function paymentCta(towerName) {
  return `Ask us about the ${towerName} payment plan — our team has the latest structure and will walk you through it.`;
}

function floorPlansCta(towerName) {
  return `Request the ${towerName} floor plans — we'll send them directly as soon as they're confirmed.`;
}

function brochureCta(towerName) {
  return `Request the ${towerName} brochure — our team will share the latest project materials for your enquiry.`;
}

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
  } = deps;

  const SHARED = {
    developer: "Mira Developments",
    location: "Al Furjan, Dubai",
    brand: "John Richmond",
    constructionStatus: "Under Construction",
    constructionStart: "20 April 2026",
    salesStart: "20 April 2026",
  };

  const TOWERS = [
    {
      id: "tower-1",
      slug: "richmond-district-tower-1",
      label: "Tower 1",
      fullName: "Richmond District Tower 1",
      commercial: false,
      launched: true,
      unitTypes: ["Studio", "1-Bedroom", "2-Bedroom"],
      unitCount: null,
      completion: "Q1 2029",
      paymentPlan: "45/5/50 — 45% during construction, 5% on completion, 50% over 39 months post-handover.",
      paymentPlanConfirmed: true,
      pricingConfirmed: true,
      amenities: null,
      title:
        "Richmond District Tower 1 | Launched Residential Tower, Richmond Residences Al Furjan",
      description:
        "Richmond District Tower 1 — the launched residential phase at Richmond Residences, Al Furjan. Studios and 1-2 bed apartments from AED 943,500, 45/5/50 payment plan, Q1 2029 handover.",
      lead: "The launched residential opening phase at Richmond District by Mira Developments — fully furnished John Richmond homes in Al Furjan, Dubai.",
      earlyAccess: false,
    },
    {
      id: "business-tower",
      slug: "richmond-district-business-tower",
      label: "Business Tower",
      fullName: "Richmond District Business Tower",
      commercial: true,
      launched: false,
      unitTypes: ["Retail", "Office"],
      unitCount: 62,
      completion: "1 January 2029",
      paymentPlan: "45/5/50 (45% deposit, 5% during construction, 50% on handover)",
      paymentPlanConfirmed: true,
      pricingConfirmed: false,
      amenities: ["Gym", "Kids Play Area", "Sauna/Steam Room", "Swimming Pool", "Yoga Studio"],
      title: "Richmond District Business Tower | Commercial, Richmond Residences Al Furjan",
      description:
        "Richmond District Business Tower — 62 retail and office units in Al Furjan by Mira Developments. Register for pricing and availability on request.",
      lead: "Commercial tower within Richmond District — retail and office spaces in Al Furjan, Dubai (Richmond Residences masterplan).",
      earlyAccess: true,
    },
    {
      id: "tower-2",
      slug: "richmond-district-tower-2",
      label: "Tower 2",
      fullName: "Richmond District Tower 2",
      commercial: false,
      launched: false,
      unitTypes: ["2-Bedroom", "3-Bedroom"],
      unitCount: 24,
      completion: "1 June 2029",
      paymentPlan: "45/5/50 (45% deposit, 5% during construction, 50% on handover)",
      paymentPlanConfirmed: true,
      pricingConfirmed: false,
      amenities: ["Gym", "Kids Play Area", "SPA/Salon", "Swimming Pool", "Yoga Studio"],
      title: "Richmond District Tower 2 | 2 & 3 Bed Homes, Richmond Residences Al Furjan",
      description:
        "Richmond District Tower 2 — 24 two- and three-bedroom homes in Al Furjan. Early-access enquiries open; register for pricing and availability.",
      lead: "Two- and three-bedroom residences at Richmond District Tower 2 — part of the Al Furjan masterplan (Richmond Residences).",
      earlyAccess: true,
    },
    {
      id: "tower-3",
      slug: "richmond-district-tower-3",
      label: "Tower 3",
      fullName: "Richmond District Tower 3",
      commercial: false,
      launched: false,
      unitTypes: ["Studio", "1-Bedroom", "2-Bedroom", "Retail"],
      unitCount: 38,
      completion: "1 January 2029",
      paymentPlan: "45/5/50 (45% deposit, 5% during construction, 50% on handover)",
      paymentPlanConfirmed: true,
      pricingConfirmed: false,
      amenities: ["Gym", "Kids Play Area", "SPA/Salon", "Swimming Pool", "Yoga Studio"],
      title: "Richmond District Tower 3 | Mixed Residential & Retail, Al Furjan",
      description:
        "Richmond District Tower 3 — 38 studio, 1-bed, 2-bed and retail units in Al Furjan. Register your interest for pricing and floor plans.",
      lead: "Mixed residential and retail tower at Richmond District — studios through 2-bed homes plus retail in Al Furjan.",
      earlyAccess: true,
    },
    {
      id: "tower-4",
      slug: "richmond-district-tower-4",
      label: "Tower 4",
      fullName: "Richmond District Tower 4",
      commercial: false,
      launched: false,
      unitTypes: ["Studio", "1-Bedroom", "2-Bedroom", "3-Bedroom"],
      unitCount: 51,
      completion: "1 January 2029",
      paymentPlan: null,
      paymentPlanConfirmed: false,
      pricingConfirmed: false,
      amenities: ["Gym", "Kids Play Area", "Sauna/Steam Room", "Swimming Pool", "Yoga Studio"],
      title: "Richmond District Tower 4 | Studios to 3 Bed, Richmond Residences Al Furjan",
      description:
        "Richmond District Tower 4 — 51 homes from studio to 3-bedroom in Al Furjan. Enquire now for pricing, payment plan, and floor plans.",
      lead: "Studios through 3-bedroom residences at Richmond District Tower 4 in Al Furjan, Dubai.",
      earlyAccess: true,
    },
    {
      id: "tower-5",
      slug: "richmond-district-tower-5",
      label: "Tower 5",
      fullName: "Richmond District Tower 5",
      commercial: false,
      launched: false,
      unitTypes: ["Studio", "1-Bedroom", "2-Bedroom", "3-Bedroom"],
      unitCount: 80,
      completion: "1 January 2029",
      paymentPlan: "45/5/50 (45% deposit, 5% during construction, 50% on handover)",
      paymentPlanConfirmed: true,
      pricingConfirmed: false,
      amenities: ["Gym", "Kids Play Area", "Sauna/Steam Room", "Swimming Pool", "Yoga Studio"],
      title: "Richmond District Tower 5 | Largest Tower, Richmond Residences Al Furjan",
      description:
        "Richmond District Tower 5 — 80 studio to 3-bedroom homes in Al Furjan. Register for early-access pricing and availability.",
      lead: "Richmond District's largest upcoming residential tower — 80 homes from studio to 3-bedroom in Al Furjan.",
      earlyAccess: true,
    },
  ];

  const TRACKED_UNIT_TOTAL = 255;

  function towerById(id) {
    return TOWERS.find((t) => t.id === id);
  }

  function towerBasePath(tower) {
    return `/${tower.slug}/`;
  }

  function unitTypesTable(tower) {
    const rows = tower.unitTypes
      .map((type) => `<tr><td>${esc(type)}</td><td>${esc(tower.fullName)}</td></tr>`)
      .join("\n");
    return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Unit Type</th><th>Tower</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
  }

  function amenitiesList(tower) {
    if (!tower.amenities?.length) return "";
    return `<ul class="amenity-grid">${tower.amenities.map((a) => `<li>${esc(a)}</li>`).join("\n")}</ul>`;
  }

  function towerFaqs(tower) {
    const priceAnswer = tower.pricingConfirmed
      ? `Studios start from AED ${fmtAed(943500)} at Richmond District Tower 1. 1-bedroom apartments from AED ${fmtAed(1871700)}. 2-bedroom apartments from AED ${fmtAed(2584680)}. Register below for current Tower 1 availability.`
      : pricingCta(tower.fullName);

    const paymentAnswer = tower.paymentPlanConfirmed
      ? tower.paymentPlan
      : paymentCta(tower.fullName);

    return [
      {
        q: `What unit types are available at ${tower.fullName}?`,
        a: `${tower.fullName} offers ${tower.unitTypes.join(", ")}${tower.unitCount ? ` across ${tower.unitCount} units` : ""}.`,
      },
      {
        q: `What is the price at ${tower.fullName}?`,
        a: priceAnswer,
      },
      {
        q: `What is the payment plan for ${tower.fullName}?`,
        a: paymentAnswer,
      },
      {
        q: `When is ${tower.fullName} expected to complete?`,
        a: `Target completion for ${tower.fullName} is ${tower.completion}.`,
      },
    ];
  }

  function towerListingSchema(tower) {
    const base = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: tower.fullName,
      alternateName: `${tower.fullName} — ${PROJECT_SECONDARY}`,
      description: tower.description,
      url: `${SITE}${towerBasePath(tower)}`,
      datePosted: "2026-09-04",
      image: OG_DUBAI,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Al Furjan",
        addressRegion: "Dubai",
        addressCountry: "AE",
      },
    };
    if (tower.unitCount) {
      base.numberOfRooms = tower.unitCount;
    }
    if (tower.pricingConfirmed) {
      base.offers = UNITS.map((u) => ({
        "@type": "Offer",
        name: `${u.type} — ${tower.fullName}`,
        price: String(u.aed),
        priceCurrency: "AED",
        availability: "https://schema.org/PreOrder",
        url: `${SITE}${towerBasePath(tower)}price-list/`,
      }));
    }
    return base;
  }

  function towerCrossNav(depth, currentTower) {
    const prefix = assetPrefix(depth);
    const items = TOWERS.map((t) => {
      const href = `${prefix}${t.slug}/`;
      if (t.id === currentTower.id) {
        return `<li><span class="tower-nav-current" aria-current="page">${esc(t.label)}</span></li>`;
      }
      return `<li><a href="${href}">${esc(t.label)}</a></li>`;
    }).join("\n          ");
    return `
    <nav class="tower-nav" aria-label="Richmond District towers">
      <p class="eyebrow">Explore towers</p>
      <ul class="tower-nav-list">${items}</ul>
    </nav>`;
  }

  function towerResourceLinks(depth, tower) {
    const prefix = assetPrefix(depth);
    const base = `${prefix}${tower.slug}/`;
    return `
    <div class="cta-row tower-resource-links">
      <a class="btn btn-outline btn-sm" href="${base}price-list/"${newTabAttrs(`${base}price-list/`)}>Request Pricing</a>
      <a class="btn btn-outline btn-sm" href="${base}floor-plans/"${newTabAttrs(`${base}floor-plans/`)}>Floor Plans</a>
      <a class="btn btn-outline btn-sm" href="${base}payment-plan/"${newTabAttrs(`${base}payment-plan/`)}>Payment Plan</a>
      <a class="btn btn-outline btn-sm" href="${base}brochure/"${newTabAttrs(`${base}brochure/`)}>Brochure</a>
    </div>`;
  }

  function whatWeKnowSection(tower) {
    const parts = [
      `<p>Richmond District (also marketed as ${PROJECT_SECONDARY}) is developed by ${SHARED.developer} in ${SHARED.location}, in collaboration with ${SHARED.brand}.`,
    ];
    if (!tower.launched) {
      parts.push(
        `<p>${esc(tower.fullName)} is ${SHARED.constructionStatus.toLowerCase()} with construction starting ${SHARED.constructionStart}. Sales opened ${SHARED.salesStart}.`,
      );
    } else {
      parts.push(
        `<p>${esc(tower.fullName)} is the launched residential opening phase — fully furnished John Richmond homes delivered move-in ready.`,
      );
    }
    if (tower.unitCount) {
      parts.push(`<p>${esc(tower.fullName)} comprises ${tower.unitCount} units. Across the five towers currently tracked at Richmond District, there are ${TRACKED_UNIT_TOTAL} units in total (Business Tower, Towers 2–5).</p>`);
    }
    parts.push(`<p>${pricingCta(tower.fullName)}</p>`);
    if (tower.earlyAccess) {
      parts.push(
        `<p>Early-access enquiries are open for ${esc(tower.fullName)} ahead of its official launch — register your interest to be among the first contacted with pricing and availability.</p>`,
      );
    }
    return parts.join("\n        ");
  }

  function towerMainPage(tower) {
    const path = towerBasePath(tower);
    const h1 = `${tower.fullName} — ${PROJECT_SECONDARY}, Al Furjan`;
    const faqs = towerFaqs(tower);
    const schemas = [
      jsonLd(towerListingSchema(tower)),
      jsonLd(
        breadcrumbs([
          { name: PROJECT_PRIMARY, path: "/" },
          { name: tower.label, path },
        ]),
      ),
      faqSchema(faqs),
    ];

    let pricingBlock = "";
    if (tower.pricingConfirmed) {
      pricingBlock = `
        <h2>Starting Prices — ${esc(tower.fullName)}</h2>
        ${pricingTable()}
        <p class="section-note">Confirmed starting prices apply to ${esc(tower.fullName)} only — not other towers in the masterplan.</p>`;
    }

    const body = `
    ${subpageHero(h1, tower.lead)}
    <section class="section">
      <div class="container stack prose-full">
        <h2>What We Know About ${esc(tower.fullName)} Today</h2>
        ${whatWeKnowSection(tower)}
        <h2>Unit Types</h2>
        ${unitTypesTable(tower)}
        ${pricingBlock}
        ${tower.amenities?.length ? `<h2>Amenities</h2>${amenitiesList(tower)}` : ""}
        ${towerResourceLinks(1, tower)}
        ${towerCrossNav(1, tower)}
      </div>
    </section>
    ${faqBlockInline(faqs)}
    ${leadForm(1, {
      path,
      defaultInterest: "Price List & Availability",
      heading: `Register Your Interest — ${tower.fullName}`,
      button: "Enquire Now",
      projectName: `${tower.fullName} — ${PROJECT_PRIMARY}`,
    })}`;

    return pageShell({
      depth: 1,
      title: tower.title,
      description: tower.description,
      canonical: `${SITE}${path}`,
      path,
      schemas,
      body,
      projectName: PROJECT_PRIMARY,
    });
  }

  function faqBlockInline(faqs) {
    return `
    <section class="section section-alt">
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

  function towerSubpage(tower, kind) {
    const basePath = towerBasePath(tower);
    const path = `${basePath}${kind}/`;
    const depth = 2;
    const prefix = assetPrefix(depth);
    const kindLabel = { "price-list": "Price List", "floor-plans": "Floor Plans", "payment-plan": "Payment Plan", brochure: "Brochure" }[kind];
    const h1 = `Richmond District ${tower.label} ${kindLabel}`;
    const title = `${h1} | ${PROJECT_SECONDARY}, Al Furjan`;
    const schemas = [
      jsonLd(
        breadcrumbs([
          { name: PROJECT_PRIMARY, path: "/" },
          { name: tower.label, path: basePath },
          { name: kindLabel, path },
        ]),
      ),
    ];

    let content = "";
    let description = "";
    let button = "Enquire Now";
    let defaultInterest = "Price List & Availability";

    if (kind === "price-list") {
      description = `${tower.fullName} price list — ${PROJECT_PRIMARY}, Al Furjan. Register for current pricing and availability.`;
      if (tower.pricingConfirmed) {
        content = `
        <p>Confirmed starting prices for ${esc(tower.fullName)} at Richmond District (also marketed as ${PROJECT_SECONDARY}). These figures apply to Tower 1 only.</p>
        ${pricingTable()}
        <p class="section-note">Payment plan for Tower 1: 45/5/50. Handover Q1 2029.</p>`;
        button = "Request Pricing";
      } else {
        content = `<p>${pricingCta(tower.fullName)}</p>`;
        defaultInterest = "Price List & Availability";
      }
    } else if (kind === "floor-plans") {
      description = `Request ${tower.fullName} floor plans — Richmond District, Al Furjan.`;
      if (tower.pricingConfirmed) {
        content = `<p>Detailed layout drawings for ${esc(tower.fullName)} are available on request. ${floorPlansCta(tower.fullName)}</p>`;
      } else {
        content = `<p>${floorPlansCta(tower.fullName)}</p>`;
      }
      defaultInterest = "Floor Plans";
      button = "Request Floor Plans";
    } else if (kind === "payment-plan") {
      description = `${tower.fullName} payment plan — Richmond District, Al Furjan.`;
      if (tower.paymentPlanConfirmed) {
        content = `<p>${esc(tower.fullName)} follows a ${esc(tower.paymentPlan)}</p><p>Target completion: ${esc(tower.completion)}.</p>`;
        button = "Get In Touch";
      } else {
        content = `<p>${paymentCta(tower.fullName)}</p>`;
        defaultInterest = "Payment Plan";
      }
    } else if (kind === "brochure") {
      description = `Request the ${tower.fullName} brochure — Richmond District, Al Furjan.`;
      content = `<p>${brochureCta(tower.fullName)}</p>`;
      defaultInterest = "Brochure & Project Details";
      button = "Register Your Interest";
    }

    const body = `
    ${subpageHero(h1, description)}
    <section class="section">
      <div class="container stack prose-full">
        ${content}
        ${towerResourceLinks(depth, tower)}
      </div>
    </section>
    ${leadForm(depth, {
      path,
      defaultInterest,
      heading: `${kindLabel} — ${tower.fullName}`,
      button,
      projectName: `${tower.fullName} — ${PROJECT_PRIMARY}`,
    })}`;

    return pageShell({
      depth,
      title,
      description,
      canonical: `${SITE}${path}`,
      path,
      schemas,
      body,
      projectName: PROJECT_PRIMARY,
    });
  }

  function towersHomeSection() {
    const cards = TOWERS.filter((t) => t.id !== "tower-1")
      .map((tower) => {
        const tag = tower.commercial ? "Commercial" : `${tower.unitCount} units`;
        const cta = tower.earlyAccess
          ? `Early-access enquiries are open for ${tower.fullName} — register your interest to be among the first contacted with pricing and availability.`
          : "";
        return `
        <article class="tower-card">
          <h3><a href="./${tower.slug}/">${esc(tower.fullName)}</a></h3>
          <p class="tower-card-meta">${esc(tag)} · Target completion ${esc(tower.completion)}</p>
          <p class="tower-card-types">${esc(tower.unitTypes.join(" · "))}</p>
          <p>${esc(cta || pricingCta(tower.fullName))}</p>
          <a class="btn btn-outline btn-sm" href="./${tower.slug}/">Enquire Now</a>
        </article>`;
      })
      .join("\n");

    return `
    <section class="section section-alt" id="towers">
      <div class="container">
        <div class="section-head">
          <p class="eyebrow">Richmond District towers</p>
          <h2>Business Tower &amp; Towers 2–5</h2>
          <p>Richmond District (also marketed as ${PROJECT_SECONDARY}) brings together five residential buildings and one office tower on a shared podium. <a href="./richmond-district-tower-1/">Tower 1</a> is the launched residential phase; the towers below are the next phases within the same masterplan.</p>
        </div>
        <div class="tower-card-grid">${cards}</div>
        <p class="section-note">Across Business Tower and Towers 2–5, ${TRACKED_UNIT_TOTAL} units are currently tracked. Tower 1 pricing and payment plan apply to the launched phase only.</p>
      </div>
    </section>`;
  }

  function catalogEntries() {
    const entries = [];
    for (const tower of TOWERS) {
      entries.push({
        path: towerBasePath(tower),
        priority: tower.launched ? "0.75" : "0.7",
        group: "Al Furjan, Dubai",
        title: tower.fullName,
        description: tower.description,
      });
      for (const kind of ["price-list", "floor-plans", "payment-plan", "brochure"]) {
        entries.push({
          path: `${towerBasePath(tower)}${kind}/`,
          priority: "0.65",
          group: "Al Furjan, Dubai",
          title: `${tower.fullName} ${kind.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
          description: `${tower.fullName} — register for ${kind.replace("-", " ")} at Richmond District, Al Furjan.`,
        });
      }
    }
    return entries;
  }

  function sitemapImagePaths() {
    return TOWERS.flatMap((t) => [towerBasePath(t), ...["price-list", "floor-plans", "payment-plan", "brochure"].map((k) => `${towerBasePath(t)}${k}/`)]);
  }

  function writeAll(writeFile) {
    for (const tower of TOWERS) {
      writeFile(`${tower.slug}/index.html`, towerMainPage(tower));
      for (const kind of ["price-list", "floor-plans", "payment-plan", "brochure"]) {
        writeFile(`${tower.slug}/${kind}/index.html`, towerSubpage(tower, kind));
      }
    }
  }

  return {
    TOWERS,
    TRACKED_UNIT_TOTAL,
    towersHomeSection,
    catalogEntries,
    sitemapImagePaths,
    writeAll,
    pricingCta,
    paymentCta,
    floorPlansCta,
  };
}

module.exports = { register, pricingCta, paymentCta, floorPlansCta };
