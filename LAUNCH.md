# Sift Funnel — Launch Runbook

Do these in order. Steps 1–6 are launch-blocking; step 7 is week-two.
Everything code-side is already built, deployed, and tested — these are
the account-level switches only the store owner can flip.

---

## Step 1 — Update the Apps Script backend (2 min)
Why: the deployed script predates the dashboard-reading (JSONP) update.
Lead/event STORAGE already works; this makes the DASHBOARD able to read.

1. Open your "Sift Funnel" Google Sheet → Extensions → Apps Script
2. Select ALL the code in the editor and delete it
3. Copy the entire current `google-apps-script/lead-capture.gs` from this
   repo and paste it in
4. Set `var DASHBOARD_KEY = "sift2026noah";` (keep your key)
5. Click **Deploy → Manage deployments → ✏️ (pencil) → Version: "New
   version" → Deploy**
   - IMPORTANT: edit the EXISTING deployment. Do NOT create a new one —
     a new one gets a new URL and breaks the funnel config.

## Step 2 — Test the full tracking loop (3 min)
1. Open the live funnel in a normal browser tab
2. Run the whole quiz with a real-looking ZIP (e.g. 85032)
3. Enter a test email at the unlock gate
4. Click a "Get My Sift" button (you'll land on choosesift.com cart)
5. Check your Google Sheet:
   - "Leads" tab → one new row with your test email + answers
   - "Events" tab → rows for every step you took
6. Open `dashboard.html` on the live site → the URL is pre-filled →
   type key `sift2026noah` → Connect → you should see your session live
7. Meta Events Manager → your pixel → "Test events" → repeat the quiz →
   confirm PageView, Lead, CompleteRegistration, ViewContent,
   InitiateCheckout fire

If all three (Sheet, dashboard, pixel) light up → tracking is fully live.

## Step 3 — Publish on quiz.choosesift.com (10 min + DNS wait)
ORDER MATTERS. DNS first, GitHub second — reversing this froze Pages
last time.

1. Porkbun → choosesift.com → DNS Records → Add:
   - Type: `CNAME`
   - Host: `quiz`
   - Answer: `noahdiamond4.github.io`
   - TTL: default → Save
2. Wait until https://quiz.choosesift.com shows ANYTHING other than a
   DNS error (a GitHub 404 is fine — that means DNS works). Usually
   5–30 minutes.
3. GitHub → repo → Settings → Pages → Custom domain → enter
   `quiz.choosesift.com` → Save
4. Wait for the green "DNS check successful" → tick **Enforce HTTPS**
   (the certificate can take a few more minutes to issue)
5. Final URL for ads: **https://quiz.choosesift.com**

## Step 4 — Shopify product fixes (5 min)
1. Products → "Sift Filtered Showerhead - Black" → in Pricing set
   **Compare-at price: 129.00** → Save
2. Same for "Sift Filtered Showerhead - Silver"
   (This makes the page's $129-crossed-out claim legally real.)
3. On the Silver product (created as a duplicate): confirm inventory
   quantity is set, shipping weight is set, and the product images are
   the silver unit — duplicated products often ship with gaps.

## Step 5 — Connect Meta to Shopify (10 min)
1. Shopify admin → Sales channels → add **Facebook & Instagram**
2. Sign into the Meta business account that owns pixel 1526275735945115
3. Connect that SAME pixel (do not create a new one)
4. In the channel's data-sharing settings choose **Maximum**
   (this enables the Conversions API = server-side Purchase events)
5. Verify: Events Manager should start showing Purchase events from
   Shopify test orders

## Step 6 — Replace placeholder claims (before real spend)
These are FTC / Meta account-safety items:
1. "Reduces chlorine up to 98%" → replace with your actual lab-tested
   figure (edit in `js/report.js`, or send me the number and I'll do it)
2. The four testimonials → replace with real customer reviews
   (send them to me and I'll swap them in)
3. `images/filter-compare.jpg` → replace with a photo of a REAL used
   Sift cartridge next to a new one when you have a 90-day unit
4. Confirm the 60-day money-back guarantee matches your actual refund
   policy (it's a binding promise once ads run)
5. Keep the estimates-disclosure footnote on the report page

## Step 7 — Week-two upgrades (not blocking)
- Klaviyo: import gate emails → "abandoned report" flow quoting their
  score. Highest-ROI email automation for this funnel.
- Advanced matching: hashed email → pixel at unlock (cheaper purchases)
- Shopify order webhook → Sheet, so the dashboard shows real revenue
- Discount code auto-applied at checkout ("quiz discount")
- Ad creatives: start with the report-screenshot native static + one
  UGC video; optimize the campaign for Purchase, not Lead

---

## Quick reference
- Live site: https://noahdiamond4.github.io/testquizfunnel/ (until Step 3)
- Dashboard: /dashboard.html (key: sift2026noah), demo: ?demo=1
- Sheet backend URL: set in `js/config.js` → `leadWebhookUrl`
- Pixel: 1526275735945115 (set in `js/config.js`)
- Variants: Black 42651147567200 · Silver 42871694950496
