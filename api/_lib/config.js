const PROJECT_SLUG = "richmond-residences";
const PROJECT_NAME = "Richmond Residences";
const SITE_HOST = "richmondresidences.ae";
const SITE_URL = "https://richmondresidences.ae";
const SITE_KEY = "richmondresidences";

const DEFAULT_AGENCY_INBOX = "muhammadasim124@gmail.com";
const DEFAULT_FROM = '"Richmond Residences" <onboarding@resend.dev>';

const FUNNEL_EVENT_NAMES = new Set([
  "form_success",
  "form_error",
  "form_submit",
  "form_open",
  "form_start",
  "form_typing",
  "form_abandon",
  "whatsapp_click",
  "generate_lead",
  "cta_click",
  "page_view",
  "brochure_download",
]);

function env(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function agencyInbox() {
  return env("LEAD_FORWARD_EMAIL") || env("CONTACT_INBOX") || DEFAULT_AGENCY_INBOX;
}

function resendFrom() {
  const raw = env("RESEND_FROM") || env("RESEND_FROM_EMAIL") || DEFAULT_FROM;
  if (/@theupsides\.ae\b/i.test(raw)) return DEFAULT_FROM;
  return raw;
}

function supabaseUrl() {
  return env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
}

function supabaseSecret() {
  return env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
}

module.exports = {
  PROJECT_SLUG,
  PROJECT_NAME,
  SITE_HOST,
  SITE_KEY,
  SITE_URL,
  DEFAULT_AGENCY_INBOX,
  DEFAULT_FROM,
  FUNNEL_EVENT_NAMES,
  env,
  agencyInbox,
  resendFrom,
  supabaseUrl,
  supabaseSecret,
};
