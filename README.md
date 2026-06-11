# Sift — Quiz Funnel

A conversion-focused, conditional quiz funnel for the Sift filtered shower head,
built for paid traffic from Facebook/Instagram ads.

## Flow

1. **`index.html` — the quiz.** Visitor enters their ZIP code (the hook: a free
   water quality report). While the report "generates," they answer 4 more
   questions (concern, symptoms, hair type, home age, household size). An
   animated "analyzing" sequence builds anticipation, then redirects.
2. **`report.html` — the personalized advertorial.** A water quality report for
   their ZIP (score gauge, hardness, chlorine, contaminant flags) interwoven
   with personalized callouts driven by their quiz answers, a product offer,
   matched testimonials, a comparison table, FAQ, and a sticky CTA.
3. **Checkout.** All CTAs link to `SIFT_CONFIG.checkoutUrl` with quiz data
   appended as URL params (`zip`, `score`, `concern`, plus UTMs).

## How personalization works

- `js/water-data.js` maps the ZIP prefix → state → a regional water profile
  (hardness ppm, chlorine level, common contaminants) based on USGS regional
  hardness patterns, with metro-level overrides for ~60 major cities
  (Phoenix, Vegas, Indianapolis, Tampa, NYC, etc.). A deterministic per-ZIP
  variance makes neighboring ZIPs read as distinct.
- `js/report.js` composes the advertorial conditionally: every headline,
  callout, benefit bullet, and testimonial set changes based on score,
  hardness tier, chlorine level, and the visitor's answers.
- No backend required — answers pass between pages via `sessionStorage`.
  Direct visits to `report.html` redirect back to the quiz.

## Setup

Edit `js/config.js`:

- `checkoutUrl` — your Shopify product/checkout URL (CTAs append attribution params)
- `price` / `compareAtPrice` / `guaranteeDays`
- `fbPixelId` — your Meta Pixel ID. Fires `PageView`, `Lead` (ZIP submitted),
  `CompleteRegistration` (quiz finished), `ViewContent` (report viewed), and
  `InitiateCheckout` (CTA click).

## Deploy

Pure static files — drop on Vercel, Netlify, Cloudflare Pages, or S3.
No build step.

```bash
# local preview
python3 -m http.server 8000
# open http://localhost:8000
```

## Compliance notes (read before scaling spend)

- Water figures are **regional estimates**, not lab results. The report page
  discloses this in its methodology footnote — keep that footnote. For exact
  per-utility data, consider integrating the EPA SDWIS API or EWG Tap Water
  Database on a small backend.
- The "reduces chlorine up to 98%", filter-life, and testimonial copy are
  **placeholders** — replace them with your actual lab results and real
  customer reviews before running ads. Meta and the FTC both require
  substantiation for performance claims and genuine testimonials.
