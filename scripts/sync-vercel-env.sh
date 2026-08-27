#!/usr/bin/env bash
# Copy Vercel environment variables from a source property site to this project.
# Usage: ./scripts/sync-vercel-env.sh [source-project]
# Default source: al-ghadeer-parks (same shared Supabase / Resend / ingest stack)
set -euo pipefail

SOURCE_PROJECT="${1:-al-ghadeer-parks}"
TARGET_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_ENV="$(mktemp)"
SOURCE_DIR=""

case "$SOURCE_PROJECT" in
  al-ghadeer-parks) SOURCE_DIR="$HOME/Sites/al-ghadeer-parks" ;;
  valiabyemaar)     SOURCE_DIR="$HOME/Sites/valiabyemaar" ;;
  seisaadiyat.ae)   SOURCE_DIR="$HOME/Sites/seisaadiyat.ae" ;;
  *)
    echo "Unknown source project: $SOURCE_PROJECT" >&2
    exit 1
    ;;
esac

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

echo "Pulling env from $SOURCE_PROJECT …"
(cd "$SOURCE_DIR" && npx vercel env pull "$TMP_ENV" --environment=production --yes)

# Keys shared across all property sites (site-branded RESEND_FROM only)
KEYS=(
  SUPABASE_URL
  SUPABASE_SECRET_KEY
  RESEND_API_KEY
  LEAD_FORWARD_EMAIL
  CONTACT_INBOX
  UPSIDES_INGEST_URL
  UPSIDES_INGEST_KEY
  CHALLENGE_COUNTRIES
  CONTACT_WHATSAPP_E164
  TURNSTILE_SITE_KEY
  TURNSTILE_SECRET_KEY
)

PROJECT_SLUG="$(basename "$TARGET_DIR" | sed 's/\.ae$//')"
BRAND_NAME="$(node -e "console.log(require('$TARGET_DIR/api/_lib/config.js').PROJECT_NAME)")"
FROM_EMAIL="$BRAND_NAME <onboarding@resend.dev>"

add_env() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" == "[SENSITIVE]" ]]; then
    echo "  skip $name (no local value)"
    return
  fi
  for env in production preview development; do
    printf '%s' "$value" | (cd "$TARGET_DIR" && npx vercel env add "$name" "$env" --force >/dev/null)
    echo "  set $name ($env)"
  done
}

echo "Pushing to $(basename "$TARGET_DIR") on Vercel …"
for key in "${KEYS[@]}"; do
  value="$(grep -E "^${key}=" "$TMP_ENV" | head -1 | cut -d= -f2- | tr -d '"')"
  # Fall back to source .env.local for secrets Vercel won't pull
  if [[ -z "$value" || "$value" == "[SENSITIVE]" ]]; then
    if [[ -f "$SOURCE_DIR/.env.local" ]]; then
      value="$(grep -E "^${key}=" "$SOURCE_DIR/.env.local" | head -1 | cut -d= -f2- | tr -d '"')"
    fi
  fi
  if [[ -z "$value" || "$value" == "[SENSITIVE]" ]]; then
    if [[ -f "$HOME/Sites/the-upsides/.env.local" ]]; then
      case "$key" in
        SUPABASE_URL) value="https://rljwvxqabcksaycyhpfh.supabase.co" ;;
        SUPABASE_SECRET_KEY) value="$(grep -E '^SUPABASE_SECRET_KEY=' "$HOME/Sites/the-upsides/.env.local" | cut -d= -f2- | tr -d '"')" ;;
        RESEND_API_KEY) value="$(grep -E '^RESEND_API_KEY=' "$HOME/Sites/the-upsides/.env.local" | cut -d= -f2- | tr -d '"')" ;;
        UPSIDES_INGEST_KEY) value="$(grep -E '^UPSIDES_INGEST_KEY=' "$HOME/Sites/the-upsides/.env.local" | cut -d= -f2- | tr -d '"')" ;;
        LEAD_FORWARD_EMAIL|CONTACT_INBOX) value="muhammadasim124@gmail.com" ;;
        UPSIDES_INGEST_URL) value="https://theupsides.ae/api/ingest" ;;
        CHALLENGE_COUNTRIES) value="US" ;;
        CONTACT_WHATSAPP_E164) value="971527891955" ;;
      esac
    fi
  fi
  add_env "$key" "$value"
done

add_env RESEND_FROM_EMAIL "$FROM_EMAIL"
rm -f "$TMP_ENV"

echo "Done. Redeploy with: npx vercel --prod"
echo "Add Turnstile hostnames for this domain in Cloudflare if not already set."
