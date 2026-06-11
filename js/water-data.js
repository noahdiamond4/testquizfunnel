// ============================================================
// Sift — Regional Water Data Engine
//
// Maps a US ZIP code to an estimated water profile (hardness,
// chlorine, common contaminants) using:
//   1. 3-digit ZIP prefix -> state
//   2. State-level profiles built from USGS regional hardness
//      patterns and EPA disinfection norms
//   3. Metro-level overrides for notably hard-water cities
//   4. A deterministic per-ZIP variance so reports feel specific
//
// These are regional ESTIMATES, not utility test results. The
// report page discloses this in its methodology footnote.
// ============================================================

const ZIP_STATE_RANGES = [
  [5, 5, "NY"], [6, 9, "PR"], [10, 27, "MA"], [28, 29, "RI"],
  [30, 38, "NH"], [39, 49, "ME"], [50, 59, "VT"], [60, 69, "CT"],
  [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"], [197, 199, "DE"],
  [200, 205, "DC"], [206, 219, "MD"], [220, 246, "VA"], [247, 268, "WV"],
  [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"], [320, 349, "FL"],
  [350, 369, "AL"], [370, 385, "TN"], [386, 397, "MS"], [398, 399, "GA"],
  [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [570, 577, "SD"],
  [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"],
  [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"],
  [730, 749, "OK"], [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"],
  [832, 838, "ID"], [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"],
  [885, 885, "TX"], [889, 898, "NV"], [900, 961, "CA"], [967, 968, "HI"],
  [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

const STATE_NAMES = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California",
  CO:"Colorado", CT:"Connecticut", DE:"Delaware", DC:"Washington D.C.",
  FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois",
  IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana",
  ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan",
  MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana",
  NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey",
  NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota",
  OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", PR:"Puerto Rico",
  RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee",
  TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington",
  WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming",
};

// hardness: estimated grains-equivalent in ppm (mg/L as CaCO3)
// chlorine: 1 = low, 2 = moderate, 3 = high (typical residual levels)
// agingPipes: likelihood of older distribution infrastructure
const STATE_PROFILES = {
  AZ: { hardness: 290, chlorine: 3, agingPipes: 1, contaminants: ["calcium & magnesium scale", "chlorine byproducts", "arsenic traces (regional)"] },
  NV: { hardness: 280, chlorine: 3, agingPipes: 1, contaminants: ["calcium & magnesium scale", "chlorine byproducts"] },
  NM: { hardness: 240, chlorine: 2, agingPipes: 1, contaminants: ["calcium & magnesium scale", "sediment"] },
  UT: { hardness: 250, chlorine: 2, agingPipes: 1, contaminants: ["calcium & magnesium scale", "sediment"] },
  TX: { hardness: 220, chlorine: 3, agingPipes: 2, contaminants: ["calcium & magnesium scale", "chloramine", "sediment"] },
  KS: { hardness: 260, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "nitrate traces (regional)"] },
  OK: { hardness: 230, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "sediment"] },
  NE: { hardness: 240, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "nitrate traces (regional)"] },
  IA: { hardness: 250, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "nitrate traces (regional)"] },
  SD: { hardness: 250, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "iron"] },
  ND: { hardness: 240, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "iron"] },
  MN: { hardness: 220, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "iron"] },
  WI: { hardness: 210, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "iron"] },
  IN: { hardness: 230, chlorine: 2, agingPipes: 3, contaminants: ["calcium & magnesium scale", "chlorine byproducts", "aging pipe sediment"] },
  IL: { hardness: 200, chlorine: 3, agingPipes: 3, contaminants: ["calcium & magnesium scale", "chlorine byproducts", "aging pipe sediment"] },
  MO: { hardness: 200, chlorine: 2, agingPipes: 2, contaminants: ["calcium & magnesium scale", "chlorine byproducts"] },
  OH: { hardness: 180, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "chlorine byproducts", "aging pipe sediment"] },
  MI: { hardness: 170, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "chlorine byproducts", "aging pipe sediment"] },
  FL: { hardness: 200, chlorine: 3, agingPipes: 1, contaminants: ["calcium scale (limestone aquifer)", "chloramine", "sulfur compounds"] },
  CA: { hardness: 180, chlorine: 3, agingPipes: 2, contaminants: ["hardness minerals", "chloramine", "chlorine byproducts"] },
  CO: { hardness: 140, chlorine: 2, agingPipes: 1, contaminants: ["hardness minerals", "chlorine"] },
  ID: { hardness: 160, chlorine: 1, agingPipes: 1, contaminants: ["hardness minerals", "sediment"] },
  MT: { hardness: 170, chlorine: 1, agingPipes: 2, contaminants: ["hardness minerals", "sediment"] },
  WY: { hardness: 180, chlorine: 1, agingPipes: 2, contaminants: ["hardness minerals", "sediment"] },
  KY: { hardness: 150, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "chlorine byproducts", "aging pipe sediment"] },
  TN: { hardness: 110, chlorine: 2, agingPipes: 2, contaminants: ["moderate minerals", "chlorine"] },
  AR: { hardness: 120, chlorine: 2, agingPipes: 2, contaminants: ["moderate minerals", "chlorine"] },
  LA: { hardness: 110, chlorine: 3, agingPipes: 3, contaminants: ["chloramine", "aging pipe sediment", "organic matter"] },
  MS: { hardness: 90, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  AL: { hardness: 90, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  GA: { hardness: 60, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  NC: { hardness: 60, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "chloramine (some systems)"] },
  SC: { hardness: 50, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  VA: { hardness: 90, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "chloramine (some systems)"] },
  WV: { hardness: 130, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "aging pipe sediment"] },
  MD: { hardness: 110, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  DC: { hardness: 130, chlorine: 3, agingPipes: 3, contaminants: ["chloramine", "aging pipe sediment"] },
  DE: { hardness: 100, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "iron"] },
  NJ: { hardness: 100, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  NY: { hardness: 60, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  PA: { hardness: 140, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "chlorine byproducts", "aging pipe sediment"] },
  CT: { hardness: 60, chlorine: 2, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  RI: { hardness: 40, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  MA: { hardness: 40, chlorine: 2, agingPipes: 3, contaminants: ["chlorine", "aging pipe sediment"] },
  NH: { hardness: 40, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "iron (well-influenced systems)"] },
  VT: { hardness: 80, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  ME: { hardness: 30, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "iron (well-influenced systems)"] },
  OR: { hardness: 30, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  WA: { hardness: 40, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  AK: { hardness: 70, chlorine: 1, agingPipes: 2, contaminants: ["chlorine", "sediment"] },
  HI: { hardness: 80, chlorine: 1, agingPipes: 1, contaminants: ["chlorine", "volcanic minerals"] },
  PR: { hardness: 150, chlorine: 2, agingPipes: 3, contaminants: ["hardness minerals", "aging pipe sediment"] },
};

// Metro overrides keyed by 3-digit ZIP prefix — cities with water
// notably harder (or otherwise distinct) than their state average.
const METRO_OVERRIDES = {
  "850": { area: "the Phoenix metro area", hardness: 320 },
  "852": { area: "the Phoenix metro area", hardness: 320 },
  "853": { area: "the Phoenix West Valley", hardness: 310 },
  "857": { area: "the Tucson area", hardness: 230 },
  "891": { area: "the Las Vegas Valley", hardness: 290 },
  "782": { area: "the San Antonio area", hardness: 250 },
  "799": { area: "the El Paso area", hardness: 210 },
  "750": { area: "the Dallas–Fort Worth metro", hardness: 140 },
  "751": { area: "the Dallas area", hardness: 140 },
  "760": { area: "the Fort Worth area", hardness: 150 },
  "770": { area: "the Houston area", hardness: 120 },
  "787": { area: "the Austin area", hardness: 100 },
  "462": { area: "the Indianapolis area", hardness: 290 },
  "606": { area: "the Chicago area", hardness: 150 },
  "552": { area: "the Minneapolis–St. Paul metro", hardness: 230 },
  "554": { area: "the Minneapolis area", hardness: 230 },
  "551": { area: "the St. Paul area", hardness: 220 },
  "532": { area: "the Milwaukee area", hardness: 140 },
  "336": { area: "the Tampa Bay area", hardness: 230 },
  "337": { area: "the St. Petersburg area", hardness: 220 },
  "331": { area: "the Miami area", hardness: 220 },
  "332": { area: "the Miami area", hardness: 220 },
  "328": { area: "the Orlando area", hardness: 210 },
  "322": { area: "the Jacksonville area", hardness: 250 },
  "841": { area: "the Salt Lake City area", hardness: 250 },
  "871": { area: "the Albuquerque area", hardness: 230 },
  "921": { area: "the San Diego area", hardness: 250 },
  "920": { area: "the San Diego North County area", hardness: 250 },
  "900": { area: "the Los Angeles area", hardness: 200 },
  "913": { area: "the San Fernando Valley", hardness: 220 },
  "926": { area: "Orange County, CA", hardness: 230 },
  "928": { area: "Orange County, CA", hardness: 230 },
  "958": { area: "the Sacramento area", hardness: 130 },
  "945": { area: "the East Bay area", hardness: 90 },
  "941": { area: "San Francisco", hardness: 50 },
  "951": { area: "the Riverside–San Bernardino area", hardness: 260 },
  "923": { area: "the San Bernardino area", hardness: 250 },
  "936": { area: "the Fresno area", hardness: 120 },
  "100": { area: "New York City", hardness: 25 },
  "101": { area: "New York City", hardness: 25 },
  "112": { area: "Brooklyn", hardness: 25 },
  "104": { area: "the Bronx", hardness: 25 },
  "113": { area: "Queens", hardness: 30 },
  "115": { area: "Long Island (Nassau)", hardness: 60 },
  "117": { area: "Long Island (Suffolk)", hardness: 70 },
  "300": { area: "the Atlanta metro", hardness: 30 },
  "303": { area: "Atlanta", hardness: 30 },
  "802": { area: "the Denver metro", hardness: 120 },
  "972": { area: "the Portland area", hardness: 15 },
  "981": { area: "the Seattle area", hardness: 25 },
  "631": { area: "the St. Louis area", hardness: 140 },
  "641": { area: "the Kansas City area", hardness: 150 },
  "660": { area: "the Kansas City metro (KS)", hardness: 170 },
  "190": { area: "the Philadelphia area", hardness: 150 },
  "191": { area: "Philadelphia", hardness: 150 },
  "152": { area: "the Pittsburgh area", hardness: 130 },
  "200": { area: "the Washington D.C. area", hardness: 130 },
  "212": { area: "the Baltimore area", hardness: 90 },
  "021": { area: "the Boston area", hardness: 15 },
  "022": { area: "the Boston area", hardness: 15 },
  "482": { area: "the Detroit area", hardness: 100 },
  "441": { area: "the Cleveland area", hardness: 130 },
  "432": { area: "the Columbus area", hardness: 110 },
  "452": { area: "the Cincinnati area", hardness: 140 },
  "402": { area: "the Louisville area", hardness: 160 },
  "372": { area: "the Nashville area", hardness: 100 },
  "282": { area: "the Charlotte area", hardness: 35 },
  "276": { area: "the Raleigh area", hardness: 40 },
  "701": { area: "the New Orleans area", hardness: 130 },
};

// Deterministic small variance so the same ZIP always produces the
// same numbers, but neighboring ZIPs don't look identical.
function zipSeed(zip) {
  let h = 0;
  for (let i = 0; i < zip.length; i++) h = (h * 31 + zip.charCodeAt(i)) >>> 0;
  return h;
}

function stateForZip(zip) {
  const prefix = parseInt(zip.slice(0, 3), 10);
  for (const [lo, hi, st] of ZIP_STATE_RANGES) {
    if (prefix >= lo && prefix <= hi) return st;
  }
  return null;
}

function hardnessLabel(ppm) {
  if (ppm < 60) return { label: "Soft", tier: 0 };
  if (ppm < 120) return { label: "Moderately Hard", tier: 1 };
  if (ppm < 180) return { label: "Hard", tier: 2 };
  return { label: "Very Hard", tier: 3 };
}

const CHLORINE_LABELS = ["", "Low", "Moderate", "Elevated"];

// Main entry: ZIP string -> water profile object (or null if not a
// recognizable US ZIP prefix).
function getWaterProfile(zip) {
  const state = stateForZip(zip);
  if (!state) return null;

  const base = STATE_PROFILES[state];
  const override = METRO_OVERRIDES[zip.slice(0, 3)] || null;
  const seed = zipSeed(zip);

  let hardness = override ? override.hardness : base.hardness;
  hardness = Math.max(10, hardness + ((seed % 31) - 15)); // ±15 ppm variance

  const hl = hardnessLabel(hardness);
  const chlorine = base.chlorine;
  const grains = (hardness / 17.1).toFixed(1);

  // Composite shower-water score, 0–100 (higher = better). Weighted
  // toward hardness since that's the dominant hair/skin factor.
  let score = 100;
  score -= Math.min(55, Math.round(hardness / 6));
  score -= chlorine * 8;
  score -= base.agingPipes * 3;
  score -= seed % 4;
  score = Math.max(18, Math.min(94, score));

  let grade;
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return {
    zip,
    state,
    stateName: STATE_NAMES[state],
    areaName: override ? override.area : STATE_NAMES[state],
    isMetro: !!override,
    hardnessPpm: hardness,
    hardnessGrains: grains,
    hardnessLabel: hl.label,
    hardnessTier: hl.tier,
    chlorineLevel: chlorine,
    chlorineLabel: CHLORINE_LABELS[chlorine],
    agingPipes: base.agingPipes,
    contaminants: base.contaminants,
    score,
    grade,
  };
}
