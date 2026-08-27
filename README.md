# Richmond Residences — richmondresidences.ae

Independent marketing site for **Richmond Residences** (officially **Richmond District**) by Mira Developments in Al Furjan, Dubai.

## Environment variables

Copy shared keys from an existing property site (default: `al-ghadeer-parks`):

```bash
./scripts/sync-vercel-env.sh al-ghadeer-parks
npx vercel env pull .env.local --environment=development
npx vercel --prod
```

Shared stack: Supabase, Resend, Upsides ingest — same as Al Ghadeer Parks / Valia / Sei Saadiyat.

## Local development

```bash
npm run generate   # Regenerate HTML from scripts/generate.js
npm run dev        # http://localhost:4174
```

## Deploy (staging only)

Do **not** connect `richmondresidences.ae` to production until explicit go-ahead.

```bash
npx vercel          # Preview deployment
# npx vercel --prod  # Only after approval
```

## Image rights notice

Images were downloaded from the official project site for staging purposes. The John Richmond brand collaboration may carry stricter usage terms — confirm redistribution rights with Mira Developments before publishing.

## Regenerate content

Edit `scripts/generate.js` and run `npm run generate`.
