// ============================================================
// Sift Quiz Funnel — Global Config
// Edit these values to wire the funnel to your store/analytics.
// ============================================================
const SIFT_CONFIG = {
  brandName: "Sift",

  // ---------- Checkout routing ----------
  // Primary store domain (no protocol, no trailing slash). Using the
  // public domain keeps checkout on choosesift.com so Meta's
  // first-party cookies survive the handoff (better attribution).
  shopifyDomain: "choosesift.com",

  // Shopify variant IDs for each finish. CTAs build a cart permalink:
  // https://{domain}/cart/{variantId}:{qty}  (qty from the "how many
  // showers" answer). "chrome" routes the Silver product.
  variantIds: {
    black: "42651147567200",   // Sift Filtered Showerhead - Black
    chrome: "42871694950496",  // Sift Filtered Showerhead - Silver
  },

  // Fallback product URL used when variant IDs are blank.
  checkoutUrl: "https://choosesift.com/products/sift-filtered-showerhead",

  // Recharge subscription selling-plan IDs (per finish — they differ
  // per product). When set, the checkout link becomes
  // /cart/{variantId}:{qty}?selling_plan={id} so the head is sold WITH
  // the 90-day subscription. Blank = one-time purchase.
  sellingPlanIds: {
    black: "1967947872",   // 90-day plan on the Black product
    chrome: "1967980640",  // 90-day plan on the Silver product
  },

  // Product-page handles per finish. This store's Recharge only reliably
  // attaches the subscription through the PRODUCT PAGE widget (a plain
  // /cart/ permalink does not), so CTAs link to the product page with the
  // subscription pre-selected via ?selling_plan=. Customer clicks
  // Add to Cart there. Blank = fall back to the /cart/ permalink.
  productHandles: {
    black: "sift-filtered-showerhead",             // Black product page
    chrome: "sift-filtered-showerhead-black-copy", // Silver product page
  },

  // ---------- Lead capture (Google Sheets export) ----------
  // Deployed Apps Script web app. Every report unlock + every funnel
  // event POSTs here and is appended to the Google Sheet.
  leadWebhookUrl: "https://script.google.com/macros/s/AKfycbwJq0Xqhxv-Py_gQBr8Q_lNoerrQ5U4I9e8-GLXDbvGALeaF7ufHEV9ZLft-wW-t62x/exec",

  // ---------- Offer ----------
  // Matches the live Shopify price exactly so the page and checkout
  // never disagree. compareAtPrice drives the strikethrough + "Save %"
  // — see note in chat: set a real compare-at in Shopify to back it up.
  price: "$89.99",
  compareAtPrice: "$129",
  guaranteeDays: 60,

  // ---------- Analytics ----------
  // Meta Pixel. Events: PageView, Lead (ZIP), CompleteRegistration
  // (quiz done), ViewContent (report), Lead (email unlock),
  // InitiateCheckout (CTA click).
  fbPixelId: "1526275735945115",
};
