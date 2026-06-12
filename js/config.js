// ============================================================
// Sift Quiz Funnel — Global Config
// Edit these values to wire the funnel to your store/analytics.
// ============================================================
const SIFT_CONFIG = {
  brandName: "Sift",

  // ---------- Checkout routing ----------
  // Your Shopify store domain (no protocol, no trailing slash).
  shopifyDomain: "your-store.myshopify.com",

  // Shopify variant IDs for each finish. When set, CTAs build a
  // cart permalink: https://{domain}/cart/{variantId}:{qty}
  // (qty comes from the visitor's "how many showers" answer).
  // Find variant IDs in Shopify Admin > Products > Variants.
  variantIds: {
    black: "",   // e.g. "44519253868725"
    chrome: "",  // e.g. "44519253901493"
  },

  // Fallback product URL used when variant IDs are blank.
  checkoutUrl: "https://your-store.com/products/sift-filtered-shower-head",

  // ---------- Lead capture (Google Sheets export) ----------
  // Deploy google-apps-script/lead-capture.gs as a Web App and
  // paste its URL here. Every unlocked report POSTs the lead
  // (name, email, ZIP, score, all quiz answers) to your Sheet.
  // Leave blank to disable (gate still works, no export).
  leadWebhookUrl: "",

  // ---------- Offer ----------
  price: "$89",
  compareAtPrice: "$129",
  guaranteeDays: 60,

  // ---------- Analytics ----------
  // Meta Pixel ID — blank disables. Events: PageView, Lead (ZIP),
  // CompleteRegistration (quiz done), ViewContent (report),
  // Lead (email unlock), InitiateCheckout (CTA click).
  fbPixelId: "",
};
