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

  // ---- The offer structure (confirmed working) ----
  // The SHOWER HEAD is a ONE-TIME purchase. The recurring subscription
  // lives on a cheap FILTER product, so the checkout's "recurring
  // subtotal" correctly reads the filter price (not the head price — a
  // non-Plus store can't otherwise change that display). A 100%-off,
  // first-order-only discount makes the first filter free, so order one
  // is just the head price. The checkout link chains:
  //   /cart/add (head, one-time)
  //     -> return_to /cart/add (filter, subscription)
  //       -> return_to /discount/{code}?redirect=/checkout
  // This is the only combination that reliably attaches the subscription
  // on this store (plain /cart/ permalinks silently drop the selling plan).

  // One-time shower head variant IDs per finish.
  variantIds: {
    black: "42651147567200",   // Sift Filtered Showerhead - Black
    chrome: "42871694950496",  // Sift Filtered Showerhead - Silver
  },

  // The filter subscription (shared across finishes).
  filterVariantId: "42985499721824",   // SIFT Filter Replacement ($34.99)
  filterSellingPlanId: "1968144480",   // its 90-day subscription plan

  // 100%-off, first-order-only, filter-scoped discount code. Auto-applied
  // so the first filter is free (first charge = head only). Blank to skip.
  discountCode: "FREEFILTER",

  // Fallback product URL used when variant IDs are blank.
  checkoutUrl: "https://choosesift.com/products/sift-filtered-showerhead",

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
