# Sift — Quiz Funnel

A conversion-focused, conditional quiz funnel for the Sift filtered shower head,
built for paid traffic from Facebook/Instagram ads.

## Flow

1. **`index.html` — the quiz.** ZIP code (the hook: a free water report), then
   6 questions: concern, symptoms, hair type, fixture finish, shower count,
   household size. Animated "analyzing" sequence, then redirect.
2. **`report.html` — the personalized advertorial.** Hero + score gauge are
   shown free; everything below is **blurred behind an email gate**. After
   unlock: findings, the absorption science section, answer-driven callouts,
   cost-of-inaction math, the offer (variant + quantity pre-configured),
   filter proof, testimonials, comparison table, guarantee, FAQ, sticky CTA.
3. **Checkout.** CTAs build a Shopify cart permalink with the **finish variant**
   (from the fixtures question) and **quantity** (from the shower-count
   question): `https://{store}/cart/{variantId}:{qty}` + attribution params.
   Falls back to `checkoutUrl` with params if variant IDs aren't set.

## Lead capture → Google Sheets

Every report unlock POSTs the lead (name, email, ZIP, score, all answers) to
a Google Apps Script webhook that appends a row to your Sheet.

Setup (~3 min): follow the comments at the top of
`google-apps-script/lead-capture.gs`, then paste the deployed web-app URL
into `js/config.js` as `leadWebhookUrl`. Returning visitors who already
unlocked skip the gate (stored in `localStorage`).

## Configuration — `js/config.js`

- `shopifyDomain` + `variantIds.black` / `variantIds.chrome` — cart routing
- `checkoutUrl` — fallback product URL
- `leadWebhookUrl` — Apps Script web-app URL for the Sheets export
- `price`, `compareAtPrice`, `guaranteeDays`
- `fbPixelId` — Meta Pixel (PageView, Lead ×2, CompleteRegistration,
  ViewContent, InitiateCheckout)

## Images

Six files go in `images/` — see `images/README.md` for filenames, aspect
ratios, and the drag-and-drop GitHub upload path. Missing images degrade
gracefully (sections render without them).

## Deploy

Pure static files — Vercel, Netlify, Cloudflare Pages, S3, or GitHub Pages.
No build step.

```bash
# local preview
python3 -m http.server 8000
```

## Compliance notes (read before scaling spend)

- Water figures are **regional estimates**, not lab results — the report
  footnote discloses this; keep it. For utility-exact data, integrate the
  EPA SDWIS API or EWG Tap Water Database later.
- "Reduces chlorine up to 98%", filter-life, and testimonials are
  **placeholders** — replace with your lab results and real reviews before
  running ads (FTC + Meta substantiation rules).
- The email gate sends marketing email — keep the consent microcopy and an
  unsubscribe path (CAN-SPAM).
