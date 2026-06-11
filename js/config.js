// ============================================================
// Sift Quiz Funnel — Global Config
// Edit these values to wire the funnel to your store/analytics.
// ============================================================
const SIFT_CONFIG = {
  brandName: "Sift",

  // Where the final CTA buttons send people. Point this at your
  // Shopify checkout / product page. Quiz answers are appended as
  // UTM-style params for attribution.
  checkoutUrl: "https://your-store.com/products/sift-filtered-shower-head",

  // Pricing shown on the report page.
  price: "$89",
  compareAtPrice: "$129",

  // Offer framing
  guaranteeDays: 60,
  freeShippingThreshold: true,

  // Facebook Pixel ID — leave blank to disable. Fires Lead on quiz
  // completion and InitiateCheckout on CTA click if fbq is present.
  fbPixelId: "",
};
