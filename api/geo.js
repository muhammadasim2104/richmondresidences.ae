const { geoCode, header, json } = require("./_lib/context");

/**
 * ISO country for phone defaults and WhatsApp gating.
 * Live headers only — never invent AE when geo is missing.
 * Invalid Cloudflare/Vercel placeholders (XX, T1, EU, …) stay unknown.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { ok: false });
    return;
  }

  const country =
    geoCode(header(req, "cf-ipcountry")) ||
    geoCode(header(req, "CF-IPCountry")) ||
    geoCode(header(req, "x-vercel-ip-country")) ||
    geoCode(header(req, "x-country-code")) ||
    null;

  const secure =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const cookie = country
    ? [
        `tu_phone_country=${country}`,
        "Path=/",
        `Max-Age=${60 * 60 * 24 * 7}`,
        "SameSite=Lax",
        secure ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ")
    : [
        "tu_phone_country=",
        "Path=/",
        "Max-Age=0",
        "SameSite=Lax",
        secure ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Set-Cookie", cookie);
  res.end(JSON.stringify({ country }));
};
