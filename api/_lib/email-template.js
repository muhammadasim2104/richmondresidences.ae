const { SITE_URL } = require("./config");

const BRAND_URL = "https://theupsides.ae";
const LOGO_URL = `${BRAND_URL}/brand/logos/footer-logo-cream-400.png`;

let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}

const COUNTRY_FALLBACK = {
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  PK: "Pakistan",
  EG: "Egypt",
};

function formatCountryLabel(code) {
  if (!code) return "";
  const upper = String(code).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return String(code).trim();
  let name = null;
  try {
    name = regionNames?.of(upper) || null;
  } catch {
    name = null;
  }
  if (!name || name === upper) name = COUNTRY_FALLBACK[upper] || null;
  return name ? `${name} (${upper})` : upper;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || "");
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
}

function leadFieldRows(fields) {
  return fields
    .filter((field) => field.value)
    .map((field, index) => {
      const bg = index % 2 === 0 ? "#f9f6f0" : "#ffffff";
      const valueHtml = field.href
        ? `<a href="${escapeHtml(field.href)}" style="color:#0b2118;text-decoration:underline;word-break:break-all">${escapeHtml(field.value)}</a>`
        : `<span style="color:#1a2b24;word-break:break-word">${escapeHtml(field.value)}</span>`;
      return `
        <tr>
          <td style="padding:12px 16px;background:${bg};border-bottom:1px solid #ddd4c4;width:38%;vertical-align:top;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#5c6b62;letter-spacing:0.02em">
            ${escapeHtml(field.label)}
          </td>
          <td style="padding:12px 16px;background:${bg};border-bottom:1px solid #ddd4c4;vertical-align:top;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#1a2b24">
            ${valueHtml}
          </td>
        </tr>`;
    })
    .join("");
}

function leadNotifyHtml(opts) {
  const headline = opts.headline || "New project inquiry";
  const subhead = opts.subhead
    ? `<p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#efe6d4">${escapeHtml(opts.subhead)}</p>`
    : "";
  const footer =
    opts.footerNote ||
    "Reply to this email to contact the visitor. Do not send an automatic reply.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ebe0;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #ddd4c4">
          <tr>
            <td style="background:#0b2118;padding:28px 28px 24px;border-bottom:3px solid #c5a059">
              <a href="${escapeHtml(BRAND_URL)}" style="display:inline-block;text-decoration:none">
                <img
                  src="${escapeHtml(LOGO_URL)}"
                  alt="The Upsides"
                  width="200"
                  height="53"
                  style="display:block;width:200px;height:auto;border:0;outline:none"
                />
              </a>
              <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:24px;line-height:1.25;color:#f9f6f0">
                ${escapeHtml(headline)}
              </h1>
              ${subhead}
            </td>
          </tr>
          <tr>
            <td style="padding:0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${leadFieldRows(opts.fields || [])}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;background:#f9f6f0;border-top:1px solid #ddd4c4">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:#5c6b62">
                ${escapeHtml(footer)}
              </p>
              <p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#8b6f35">
                <a href="${escapeHtml(SITE_URL)}" style="color:#8b6f35;text-decoration:none">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function leadNotifyText(opts) {
  const lines = (opts.fields || [])
    .filter((field) => field.value)
    .map((field) => `${field.label}: ${field.value}`);
  return [
    opts.headline || "New project inquiry",
    opts.subhead || "",
    "",
    ...lines,
    "",
    opts.footerNote ||
      "Reply to this email to contact the visitor. Do not send an automatic reply.",
    "",
    SITE_URL,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildLeadFields({
  fullName,
  email,
  phone,
  projectName,
  productKey,
  interest,
  message,
  sourcePage,
  attribution,
  stamp,
  clientIp,
  submittedAt,
}) {
  const safeAttribution = attribution || {};
  const fields = [
    { label: "Name", value: fullName },
    { label: "Email", value: email, href: email ? `mailto:${email}` : undefined },
    { label: "Phone", value: phone, href: phone ? `tel:${phone}` : undefined },
    { label: "Project", value: projectName },
    { label: "Product", value: productKey },
  ];
  if (interest) fields.push({ label: "Interest", value: interest });
  if (message) fields.push({ label: "Message", value: message });
  if (sourcePage) {
    fields.push({
      label: "Page URL",
      value: sourcePage,
      href: String(sourcePage).startsWith("http") ? sourcePage : undefined,
    });
  }
  if (safeAttribution.landing_page) {
    fields.push({
      label: "Landing URL",
      value: safeAttribution.landing_page,
      href: String(safeAttribution.landing_page).startsWith("http")
        ? safeAttribution.landing_page
        : undefined,
    });
  }
  if (safeAttribution.current_page) {
    fields.push({
      label: "Current URL",
      value: safeAttribution.current_page,
      href: String(safeAttribution.current_page).startsWith("http")
        ? safeAttribution.current_page
        : undefined,
    });
  }
  if (safeAttribution.referrer) fields.push({ label: "Referrer", value: safeAttribution.referrer });
  if (safeAttribution.channel) fields.push({ label: "Traffic channel", value: safeAttribution.channel });
  if (safeAttribution.utm_source) fields.push({ label: "UTM source", value: safeAttribution.utm_source });
  if (safeAttribution.utm_medium) fields.push({ label: "UTM medium", value: safeAttribution.utm_medium });
  if (safeAttribution.utm_campaign) {
    fields.push({ label: "UTM campaign", value: safeAttribution.utm_campaign });
  }
  if (safeAttribution.organic_keyword) {
    fields.push({ label: "Organic keyword", value: safeAttribution.organic_keyword });
  }
  const countryLabel = formatCountryLabel(stamp?.country);
  if (countryLabel) fields.push({ label: "Country", value: countryLabel });
  if (clientIp) fields.push({ label: "IP address", value: clientIp });
  const device = [stamp?.device_name, stamp?.device].filter(Boolean).join(" · ");
  if (device) fields.push({ label: "Device", value: device });
  fields.push({ label: "Timestamp", value: formatTimestamp(submittedAt || new Date().toISOString()) });
  return fields;
}

module.exports = {
  buildLeadFields,
  formatCountryLabel,
  leadNotifyHtml,
  leadNotifyText,
  formatTimestamp,
};
