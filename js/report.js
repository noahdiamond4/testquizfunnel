// ============================================================
// Sift — Personalized Report Page
// Reads quiz answers + water profile from sessionStorage and
// composes the advertorial. Gates the full report behind an
// email unlock, exports the lead to Google Sheets, and routes
// checkout by fixture color (variant) and shower count (qty).
// ============================================================

(function () {
  const raw = sessionStorage.getItem("sift_quiz");
  if (!raw) { window.location.replace("index.html"); return; }

  const { answers, profile } = JSON.parse(raw);
  const p = profile;
  const a = answers;
  const $ = (id) => document.getElementById(id);

  // -------- Pixel --------
  if (SIFT_CONFIG.fbPixelId && !window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", SIFT_CONFIG.fbPixelId);
    fbq("track", "PageView");
    fbq("track", "ViewContent", { content_name: "water_report" });
  }
  function track(event, data) { if (window.fbq) fbq("track", event, data || {}); }

  // -------- Reveal system (animations fire on unlock, not behind blur) --------
  let revealed = false;
  const revealQueue = [];
  function onReveal(fn) { if (revealed) fn(); else revealQueue.push(fn); }
  function reveal() { if (revealed) return; revealed = true; revealQueue.forEach((f) => { try { f(); } catch (e) {} }); }

  // -------- Funnel events --------
  let unlockedFlag = false, offerSeen = false, checkoutClicked = false;
  SiftTrack.send("report_view", { zip: p.zip, detail: "score " + p.score });
  window.addEventListener("pagehide", () => {
    if (checkoutClicked) return;
    SiftTrack.send("exit", {
      zip: p.zip,
      step: !unlockedFlag ? "email_gate" : (offerSeen ? "report_after_offer" : "report_before_offer"),
      detail: "score " + p.score + " · " + (a.concern || "") + " · finish " + (a.fixtures || ""),
    });
  });

  // -------- Derived severity helpers --------
  const hardBad = p.hardnessTier >= 2;
  const hardMid = p.hardnessTier === 1;
  const chlorBad = p.chlorineLevel >= 3;
  const lowScore = p.score < 55;
  const sym = new Set(a.symptoms || []);

  const CONCERN_WORDS = { hair: "your hair", skin: "your skin", scalp: "your scalp", curious: "your hair and skin" };
  const concernWord = CONCERN_WORDS[a.concern] || "your hair and skin";

  // National-average benchmark framing (avg score ~61).
  const percentile = Math.max(2, Math.min(96, Math.round((p.score / 94) * 100)));

  // -------- Checkout routing: color variant + quantity --------
  // Funnel-recommended defaults (used to pre-select the offer config).
  const recFinish = a.fixtures === "chrome" ? "chrome" : "black"; // mixed/unsure -> black
  const recQty = Math.max(1, Math.min(6, parseInt(a.showers || "1", 10)));
  function finishLabelOf(f) { return f === "chrome" ? "Chrome" : "Gloss Black"; }

  // Live selection (visitor can change it on the offer card).
  let selFinish = recFinish;
  let selQty = recQty;

  function buildCheckoutUrl(f, q) {
    const params = new URLSearchParams({
      utm_source: "quiz_funnel", utm_medium: "report", utm_campaign: "water_report",
      zip: p.zip, score: p.score, concern: a.concern || "", finish: f, qty: q,
    });
    const variantId = SIFT_CONFIG.variantIds && SIFT_CONFIG.variantIds[f];
    if (variantId) {
      return "https://" + SIFT_CONFIG.shopifyDomain + "/cart/" + variantId + ":" + q + "?" + params.toString();
    }
    const base = SIFT_CONFIG.checkoutUrl;
    return base + (base.includes("?") ? "&" : "?") + params.toString();
  }

  // ============================================================
  // SECTION 1 — HERO
  // ============================================================
  $("hero-kicker").textContent = "Official Water Analysis · " + p.areaName + " · ZIP " + p.zip;
  if (lowScore) {
    $("hero-headline").textContent =
      "Your water scored " + p.score + " out of 100. " +
      (a.concern === "skin" ? "Your skin found out before you did."
        : a.concern === "scalp" ? "Your scalp found out before you did."
        : "Your hair found out before you did.");
  } else if (p.score < 70) {
    $("hero-headline").textContent =
      "Your water scored " + p.score + " out of 100 — and the missing " + (100 - p.score) + " points land on " + concernWord + ".";
  } else {
    $("hero-headline").textContent =
      "Your water scored " + p.score + " out of 100. Here's what's in the gap.";
  }
  $("hero-sub").textContent =
    "We cross-referenced regional water data for ZIP " + p.zip + " with your answers. " +
    "What's coming out of your shower head explains almost everything you told us — " +
    "the symptoms, the products that stopped working, all of it. Here's your full report.";

  // ============================================================
  // SECTION 2 — SCORE
  // ============================================================
  $("score-zip").textContent = p.zip;
  const arc = $("gauge-arc");
  const ARC_LEN = Math.PI * 90;
  arc.style.strokeDasharray = ARC_LEN;
  arc.style.strokeDashoffset = ARC_LEN;
  const color = p.score < 55 ? "#d9534f" : p.score < 70 ? "#e09a17" : "#1e9e6a";
  arc.style.stroke = color;

  const gradeEl = $("gauge-grade");
  gradeEl.textContent = "Grade: " + p.grade;
  gradeEl.className = "gauge-grade " + (p.score < 55 ? "grade-bad" : p.score < 70 ? "grade-mid" : "grade-good");

  $("score-benchmark").innerHTML = lowScore
    ? "The national average is <strong>61</strong>. Your water ranks in the <strong>bottom " + Math.max(5, Math.round(percentile / 2)) + "% of US ZIP codes</strong> for hair and skin compatibility."
    : p.score < 70
    ? "The national average is <strong>61</strong> — your water sits below the line most people assume they're above."
    : "The national average is <strong>61</strong>. Your water beats it — but unfiltered chlorine still strips moisture with every shower.";

  // Gauge animation runs when the report unlocks (it sits behind
  // the blur until then, so animating on load would be wasted).
  let gaugeAnimated = false;
  function animateGauge() {
    if (gaugeAnimated) return;
    gaugeAnimated = true;
    setTimeout(() => {
      arc.style.strokeDashoffset = ARC_LEN * (1 - p.score / 100);
      let n = 0;
      const numEl = $("gauge-num");
      numEl.style.color = color;
      const stepUp = () => {
        n += Math.max(1, Math.round(p.score / 40));
        if (n >= p.score) { numEl.textContent = p.score; return; }
        numEl.textContent = n;
        requestAnimationFrame(stepUp);
      };
      stepUp();
    }, 350);
  }
  onReveal(animateGauge);

  // ============================================================
  // SECTION 3 — EMAIL GATE
  // ============================================================
  const gateZone = $("gate-zone");
  const gated = $("gated");

  function unlock(skipAnimation) {
    unlockedFlag = true;
    gateZone.classList.add("unlocked");
    reveal();
    if (!skipAnimation) {
      track("Lead", { content_name: "report_unlocked" });
      SiftTrack.send("gate_unlock", { zip: p.zip });
      setTimeout(() => gated.querySelectorAll(".fade-in").forEach(watchFade), 100);
    }
  }

  $("gate-sub").textContent =
    "The complete analysis for ZIP " + p.zip + " — what we found in your water, what it's doing to " +
    concernWord.replace("your ", "your ") + ", and exactly how to fix it — is one step away.";

  const existingLead = localStorage.getItem("sift_lead");

  $("gate-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("gate-name").value.trim();
    const email = $("gate-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("gate-error").textContent = "Please enter a valid email address.";
      $("gate-email").focus();
      return;
    }
    $("gate-error").textContent = "";

    const lead = {
      kind: "lead",
      sid: SiftTrack.sid,
      name, email,
      zip: p.zip, area: p.areaName, state: p.state,
      score: p.score, grade: p.grade,
      hardnessPpm: p.hardnessPpm, hardnessLabel: p.hardnessLabel,
      chlorine: p.chlorineLabel,
      concern: a.concern, symptoms: (a.symptoms || []).join("|"),
      hair: a.hair, fixtures: a.fixtures, finish: selFinish, showers: a.showers, household: a.household,
      page: location.href, ts: new Date().toISOString(),
    };
    localStorage.setItem("sift_lead", JSON.stringify({ email, ts: Date.now() }));

    // Export to Google Sheets via Apps Script webhook (fire & forget).
    if (SIFT_CONFIG.leadWebhookUrl) {
      try {
        fetch(SIFT_CONFIG.leadWebhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(lead),
        }).catch(function () {});
      } catch (err) { /* never block the unlock on analytics */ }
    }
    unlock(false);
  });

  // Returning visitor who already unlocked once: skip the gate.
  if (existingLead) unlock(true);

  // ============================================================
  // SECTION 4 — WHAT WE FOUND
  // ============================================================
  $("findings-title").textContent =
    (a.concern === "skin" ? "Three things are hitting your skin every morning."
      : a.concern === "scalp" ? "Three things are hitting your scalp every morning."
      : "Three things are hitting your hair every morning.");

  const hClass = hardBad ? "bad" : hardMid ? "mid" : "good";
  const hv = $("hardness-val");
  hv.textContent = p.hardnessLabel.toUpperCase() + " · ~" + p.hardnessPpm + " ppm";
  hv.classList.add(hClass);
  const hBar = $("hardness-bar");
  hBar.classList.add(hClass);
  $("hardness-note").textContent = hardBad
    ? p.areaName.charAt(0).toUpperCase() + p.areaName.slice(1).replace(/^the /, "") + " water carries one of the heavier mineral loads in America — roughly " + p.hardnessGrains + " grains of dissolved rock per gallon. Every shower, calcium and magnesium bond to your hair shaft the same way they crust onto your faucet. You scrub the faucet. Your hair just keeps it."
    : hardMid
    ? "At ~" + p.hardnessGrains + " grains per gallon, your water deposits enough mineral residue to build a film on hair and skin over weeks of daily showers — slower than the hard-water states, but the direction is the same."
    : "Your water is on the softer side — minerals aren't your main problem. Chlorine is.";

  const cClass = chlorBad ? "bad" : p.chlorineLevel === 2 ? "mid" : "good";
  const cv = $("chlorine-val");
  cv.textContent = p.chlorineLabel.toUpperCase();
  cv.classList.add(cClass);
  const cBar = $("chlorine-bar");
  cBar.classList.add(cClass);
  $("chlorine-note").textContent = chlorBad
    ? "Your utility disinfects at the high end of the EPA-allowed range. That keeps the water safe in the pipe — and strips it onto you in the shower." + (sym.has("smell") ? " You know the smell. You told us you've noticed it." : "")
    : "Your water is disinfected with chlorine or chloramine — safe to drink, but it strips the natural oils that keep skin and hair moisturized." + (sym.has("smell") ? " That smell you've noticed? That's it leaving the water." : "");

  const flags = $("flags");
  p.contaminants.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    flags.appendChild(li);
  });

  setTimeout(() => {
    hBar.style.width = Math.min(96, Math.round((p.hardnessPpm / 320) * 100)) + "%";
    cBar.style.width = (p.chlorineLevel * 30 + 8) + "%";
  }, 600);

  // ============================================================
  // SECTION 5 — THE SCIENCE
  // ============================================================
  $("science-lungs").textContent =
    "Chlorine evaporates dramatically faster in hot water. A ten-minute hot shower in a closed bathroom is, functionally, ten minutes in a chlorine vapor room. " +
    (sym.has("smell")
      ? "That \"pool smell\" you told us you've noticed? That's the chlorine leaving the water — and you're the only thing in the room breathing."
      : "That faint \"pool smell\" some showers have? That's the chlorine leaving the water — and you're the only thing in the room breathing.");
  $("science-hair").textContent =
    "Wet hair shafts swell open like pine cones. " +
    (hardBad
      ? "Hard-water minerals slip in, then harden as the hair dries — a microscopic mineral cast, every single day. It's why hair in " + p.areaName + " feels \"coated,\" why lather dies, and why conditioner sits on top instead of sinking in."
      : "Chlorinated water slips in and strips the proteins and oils that keep hair flexible — which is why even soft-water hair can feel dry and look dull by week's end.");
  $("science-kicker").textContent =
    "A 10-minute shower runs ~20 gallons over you. You drink about half a gallon a day. You're filtering the half gallon — and standing in the twenty.";

  // ============================================================
  // SECTION 4b — WATER PROFILE RADAR (driven by their answers)
  // ============================================================
  (function buildRadar() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = $("radar");
    const cx = 160, cy = 150, R = 98;

    const symCount = sym.has("none") ? 0 : (a.symptoms || []).filter((s) => s !== "none").length;
    const hh2 = parseInt(a.household || "1", 10);
    const sh2 = recQty;

    // Each axis 0-100 where higher = worse for hair/skin.
    const axes = [
      { label: "Hardness", val: Math.min(100, Math.round(p.hardnessPpm / 3.3)) },
      { label: "Chlorine", val: Math.min(100, p.chlorineLevel * 30 + 5) },
      { label: "Sediment", val: Math.min(100, p.agingPipes * 28 + 6) },
      { label: "Symptoms", val: symCount ? Math.min(95, symCount * 22 + 18) : 12 },
      { label: "Exposure", val: Math.min(98, sh2 * 13 + hh2 * 8 + 8) },
    ];
    const ideal = [14, 16, 12, 10, 15];
    const N = axes.length;
    const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;
    const pt = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

    function poly(vals, scale) {
      return vals.map((v, i) => pt(i, R * (v / 100) * scale).join(",")).join(" ");
    }
    function mk(tag, attrs) {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    }

    // grid rings
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      svg.appendChild(mk("polygon", {
        points: axes.map((_, i) => pt(i, R * f).join(",")).join(" "),
        fill: "none", stroke: "rgba(11,39,51,.10)", "stroke-width": 1,
      }));
    });
    // spokes + labels
    axes.forEach((ax, i) => {
      const [x, y] = pt(i, R);
      svg.appendChild(mk("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: "rgba(11,39,51,.10)", "stroke-width": 1 }));
      const [lx, ly] = pt(i, R + 20);
      const t = mk("text", {
        x: lx, y: ly, "text-anchor": Math.abs(lx - cx) < 6 ? "middle" : lx < cx ? "end" : "start",
        "dominant-baseline": "middle", "font-size": "11", "font-weight": "700", fill: "#41606c",
      });
      t.textContent = ax.label;
      svg.appendChild(t);
      const v = mk("text", {
        x: lx, y: ly + 13, "text-anchor": Math.abs(lx - cx) < 6 ? "middle" : lx < cx ? "end" : "start",
        "dominant-baseline": "middle", "font-size": "10", "font-weight": "800",
        fill: ax.val >= 60 ? "#d9534f" : ax.val >= 35 ? "#b07d10" : "#1e9e6a",
      });
      v.textContent = ax.val + "/100";
      svg.appendChild(v);
    });
    // ideal polygon (static, small green)
    svg.appendChild(mk("polygon", {
      points: poly(ideal, 1), fill: "rgba(30,158,106,.10)",
      stroke: "rgba(30,158,106,.55)", "stroke-width": 1.5,
    }));
    // your polygon — animated grow via transform scale
    const you = mk("polygon", {
      points: poly(axes.map((x) => x.val), 1),
      fill: "rgba(232,81,47,.22)", stroke: "#e8512f", "stroke-width": 2.5,
      "stroke-linejoin": "round",
      style: "transform-origin:" + cx + "px " + cy + "px; transform:scale(0); transition:transform 1.1s cubic-bezier(.2,.8,.3,1);",
    });
    svg.appendChild(you);
    // vertices
    axes.forEach((ax, i) => {
      const [x, y] = pt(i, R * (ax.val / 100));
      svg.appendChild(mk("circle", { cx: x, cy: y, r: 3.5, fill: "#e8512f",
        style: "transform-origin:" + cx + "px " + cy + "px; transform:scale(0); transition:transform .8s ease " + (0.4 + i * 0.08) + "s;" }));
    });

    const worst = axes.slice().sort((m, n) => n.val - m.val)[0];
    $("radar-intro").textContent =
      "We scored five things that decide what your water does to your hair and skin. Yours spikes hardest on " +
      worst.label.toLowerCase() + " — the bigger the red shape, the harder your water is working against you. The small green shape is what filtered water looks like.";

    onReveal(() => {
      svg.querySelectorAll('[style*="scale(0)"]').forEach((el) => {
        el.style.transform = "scale(1)";
      });
    });
  })();

  // ============================================================
  // SECTION 5b — CHLORINE EXPOSURE COUNTER (something crazy)
  // ============================================================
  (function buildChlorine() {
    const hh3 = parseInt(a.household || "1", 10);
    const gallonsYr = hh3 * 20 * 365;            // ~20 gal per 10-min shower
    const poolGal = 18000;                        // avg backyard pool
    const pools10yr = (gallonsYr * 10) / poolGal; // over the next decade

    $("chlorine-headline").textContent =
      (hh3 > 1 ? "Your household will shower in " : "You'll shower in ") +
      gallonsYr.toLocaleString() + " gallons of chlorinated water this year.";

    const poolsRounded = Math.max(1, Math.round(pools10yr));
    $("chlorine-punch").innerHTML =
      "Over the next 10 years that's <strong>roughly " + poolsRounded +
      " backyard swimming pools</strong> of chlorinated water running over " +
      (hh3 > 1 ? "your family's" : "your") + " skin and hair — none of it filtered. " +
      "Sift takes the chlorine out before it ever reaches you.";

    // pool icons
    const icons = Math.min(12, poolsRounded);
    $("pool-row").innerHTML = "<span class='pool-cap'>10-year exposure:</span> " +
      Array.from({ length: icons }, () => "🏊").join("") +
      (poolsRounded > icons ? " <span class='pool-more'>+" + (poolsRounded - icons) + " more</span>" : "");

    onReveal(() => {
      // count up the big number
      const el = $("chlorine-gallons");
      const dur = 1400, t0 = performance.now();
      function step(t) {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(gallonsYr * eased).toLocaleString();
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      // fill the meter
      setTimeout(() => { $("chlorine-fill").style.height = "100%"; }, 100);
    });
  })();

  // ============================================================
  // SECTION 6 — YOUR ANSWERS, DECODED
  // ============================================================
  const bits = [];
  if (sym.has("buildup")) bits.push({
    h: "That crust on your fixtures? You're rinsing your hair in it.",
    p: "You told us you see white buildup on faucets and glass. That's " + p.hardnessPpm + " ppm water leaving its signature on everything it touches — and \"everything\" includes you. On metal it looks like scale. On hair it looks like dullness. Same mineral. Same source. Every day.",
  });
  if (sym.has("tight-skin")) bits.push({
    h: "\"Squeaky clean\" skin isn't clean — it's stripped.",
    p: "That tight feeling after a shower is your skin's lipid barrier being washed away by chlorine and bonded minerals. The moisturizer you apply afterwards is patching damage the water caused minutes earlier.",
  });
  if (sym.has("flat-hair")) bits.push({
    h: "Your hair isn't the problem. The coating on it is.",
    p: "Hair that feels heavy, coated, or won't lather is the classic signature of hard-water mineral film. It blocks conditioner from penetrating — which is why even good products seem to \"stop working\" in " + p.areaName + ".",
  });
  if (a.hair === "color") bits.push({
    h: "Your color is being paid for twice — once at the salon, once down the drain.",
    p: "Chlorine oxidizes dye molecules. Minerals shift tone — the brassiness you keep toning out isn't your colorist's fault, and it isn't yours. In water like " + p.areaName + "'s, color fade isn't a maintenance problem. It's a plumbing problem.",
  });
  if (a.hair === "products") bits.push({
    h: "You're investing in products — and your water is undoing them.",
    p: "Quality shampoos and serums are formulated in labs using soft, neutral water. At ~" + p.hardnessPpm + " ppm, much of what you're paying for is neutralized before it can work.",
  });
  if (sym.has("none") && bits.length === 0) bits.push({
    h: "No visible symptoms yet — which is exactly the point.",
    p: "Hard water and chlorine damage is cumulative. By the time it shows as dullness, dryness, or fading color, the barrier damage is months in. Catching it while you still feel fine is the cheap version of this problem.",
  });

  const hh = parseInt(a.household || "1", 10);
  const gallonsYear = (hh * 20 * 365).toLocaleString();
  const tubs = Math.round((hh * 20 * 365) / 60);
  bits.push({
    h: (hh > 1 ? "Your household pours ~" + gallonsYear + " gallons of this over itself per year."
               : "You pour ~" + gallonsYear + " gallons of this over yourself per year."),
    p: "Roughly " + tubs.toLocaleString() + " bathtubs of " + p.hardnessLabel.toLowerCase() + ", " +
       (chlorBad ? "heavily chlorinated" : "chlorinated") + " water across hair and skin annually — through " +
       (recQty > 1 ? recQty + " shower heads, all unfiltered." : "one shower head."),
  });

  const pb = $("personal-body");
  bits.slice(0, 4).forEach((bit) => {
    const div = document.createElement("div");
    div.className = "callout";
    const h3 = document.createElement("h3"); h3.textContent = bit.h;
    const para = document.createElement("p"); para.textContent = bit.p;
    div.appendChild(h3); div.appendChild(para);
    pb.appendChild(div);
  });

  // ============================================================
  // SECTION 7 — COST OF DOING NOTHING
  // ============================================================
  $("cost-intro").textContent =
    (a.hair === "color" || a.hair === "products"
      ? "You told us you invest in your hair. Here's the uncomfortable arithmetic: quality shampoo, conditioner, masks" + (a.hair === "color" ? ", and toner" : "") + " run most people $30–60 a month — and every one of those formulas was designed in a lab using soft, neutral water. "
      : "Even a simple routine — shampoo, soap, moisturizer — runs $20–40 a month, and every one of those formulas was designed for soft, neutral water. ") +
    "At " + p.hardnessPpm + " ppm" + (chlorBad ? " with elevated chlorine" : "") + ", your water " +
    (hardBad ? "neutralizes active ingredients and seals everything behind a mineral film the products can't get through."
             : "strips what the products put in, almost as fast as they put it in.");
  $("math-spend").textContent = (a.hair === "color" || a.hair === "products") ? "~$540" : "~$360";
  $("math-price").textContent = SIFT_CONFIG.price;

  // ============================================================
  // SECTION 8 — THE TURN
  // ============================================================
  $("turn-1").textContent =
    "Every product you use is applied through this water and rinsed off with this water. As long as the last thing touching " +
    concernWord + " is " + p.hardnessPpm + " ppm chlorinated water, the last word belongs to the water.";
  $("turn-2").textContent =
    "Three ways to deal with that: a whole-home softener ($2,000–$6,000, a plumber, impossible in a rental). Doing nothing " +
    "(you've been running that experiment — you described the results in your quiz). Or filtering at the exact point your body " +
    "meets the water: the shower head itself.";

  // ============================================================
  // SECTION 9 — THE PRODUCT
  // ============================================================
  $("product-headline").textContent = "Sift. Configured for ZIP " + p.zip + ".";
  // (product image, price, labels, and CTA hrefs are all set by updateOffer())

  const benefits = [];
  benefits.push("<strong>15-stage filtration with KDF-55 + calcium sulfite</strong> — the media combination for " + (hardBad ? "very hard, high-chlorine water like " + p.areaName + "'s" : "chlorinated water like " + p.areaName + "'s"));
  benefits.push("<strong>Reduces chlorine up to 99%</strong> — the #1 cause of stripped " + (a.concern === "skin" ? "skin" : "hair and fading color"));
  benefits.push("<strong>Captures sediment, rust &amp; pipe particles</strong> before they reach you");
  if (a.hair === "color") benefits.push("<strong>Color-safe by design</strong> — slower fade, less brass between salon visits");
  if (a.concern === "scalp") benefits.push("<strong>Gentler on the scalp</strong> — removing chlorine helps calm flaking and itch for many users");
  benefits.push("<strong>Spa-grade pressure</strong> — filtration without the trickle");
  $("benefits").innerHTML = benefits.slice(0, 5).map((b) => "<li>" + b + "</li>").join("");

  // ---- Interactive offer config (finish + quantity) ----
  const UNIT = parseFloat(SIFT_CONFIG.price.replace(/[^0-9.]/g, ""));
  const CMP = parseFloat(SIFT_CONFIG.compareAtPrice.replace(/[^0-9.]/g, ""));
  const savePct = CMP > UNIT ? Math.round((1 - UNIT / CMP) * 100) : 0;
  const money = (n) => "$" + n.toFixed(2);
  const QTY_MAX = 6;

  $("reco-note").textContent =
    "Pre-filled from your quiz: " + finishLabelOf(recFinish) +
    (a.fixtures === "mixed" ? " (our most-loved finish)" : " to match your fixtures") +
    " · " + recQty + " unit" + (recQty > 1 ? "s for your " + recQty + " showers" : "") +
    ". Change anything you like.";

  const ctaIds = ["cta-main", "cta-guarantee", "cta-faq", "cta-sticky"];

  function updateOffer() {
    const label = finishLabelOf(selFinish);
    // finish toggle active state
    document.querySelectorAll("#color-toggle button").forEach((b) =>
      b.classList.toggle("active", b.dataset.finish === selFinish));
    // quantity
    $("qty-val").textContent = selQty;
    $("qty-minus").disabled = selQty <= 1;
    $("qty-plus").disabled = selQty >= QTY_MAX;
    // product image
    $("product-img").src = selFinish === "chrome" ? "images/product-chrome.jpg" : "images/product-black.jpg";
    $("product-img").alt = "The Sift filtered shower head in " + label;
    // pricing (scales with quantity)
    $("price-now").textContent = money(UNIT * selQty);
    $("price-was").textContent = CMP ? money(CMP * selQty) : "";
    $("price-badge").textContent = savePct ? "Save " + savePct + "%" : "";
    $("price-each").textContent = selQty > 1 ? selQty + " × " + money(UNIT) + " each · free shipping" : "";
    // ctas
    const href = buildCheckoutUrl(selFinish, selQty);
    ctaIds.forEach((id) => { $(id).href = href; });
    $("cta-main").textContent = "Get My Sift — " + label + (selQty > 1 ? " ×" + selQty : "") + " →";
  }

  document.querySelectorAll("#color-toggle button").forEach((b) => {
    b.addEventListener("click", () => {
      selFinish = b.dataset.finish;
      updateOffer();
      SiftTrack.send("offer_config", { zip: p.zip, detail: "finish=" + selFinish });
    });
  });
  $("qty-minus").addEventListener("click", () => { if (selQty > 1) { selQty--; updateOffer(); } });
  $("qty-plus").addEventListener("click", () => { if (selQty < QTY_MAX) { selQty++; updateOffer(); } });

  $("cta-micro").innerHTML =
    "🔄 Includes a fresh replacement filter every 90 days to keep it working — cancel anytime. " +
    "Your report &amp; configuration are saved for 24 hours.";

  $("guarantee-title").textContent = SIFT_CONFIG.guaranteeDays + "-Day \"Feel the Difference\" Guarantee";

  // ============================================================
  // SECTION 10 — PROOF
  // ============================================================
  $("proof-headline").textContent =
    (hardBad ? "Ninety days in " + p.areaName.replace(/^the /, "") + " water. This is what didn't reach you."
             : "Ninety days of filtering. This is what didn't reach you.");

  // ============================================================
  // SECTION 11 — TESTIMONIALS
  // ============================================================
  const T = [];
  if (hardBad) T.push({ s: 5, t: "I live with seriously hard water and assumed my hair was just like this now. Two weeks in, my conditioner actually lathers and rinses clean. I'm annoyed I waited.", w: "Melissa R.", d: "hard-water area" });
  if (a.hair === "color") T.push({ s: 5, t: "My colorist asked what I changed, because my blonde stopped going brassy between appointments. It was the shower head. That's it.", w: "Dana K.", d: "color-treated hair" });
  if (sym.has("tight-skin") || a.concern === "skin") T.push({ s: 5, t: "The tight, itchy feeling after showers is just… gone. I've cut my body lotion use in half.", w: "Priya S.", d: "dry skin" });
  if (a.concern === "scalp") T.push({ s: 5, t: "Flaky scalp for years, tried every shampoo. Filtering the chlorine out is the only thing that's calmed it down.", w: "Marcus T.", d: "scalp issues" });
  T.push({ s: 5, t: "Installed in two minutes, no tools. Pressure is honestly better than my old head.", w: "Jordan L.", d: "verified buyer" });
  T.push({ s: 4, t: "Took about a week to notice, but my hair is visibly shinier and my husband's dandruff improved.", w: "Caitlin M.", d: "verified buyer" });

  $("testimonial-title").textContent = "What changed for people with water like " + p.areaName + "'s.";
  $("testimonials").innerHTML = T.slice(0, 4).map((t) =>
    '<div class="testimonial"><div class="stars">' + "★".repeat(t.s) + "☆".repeat(5 - t.s) +
    "</div><p>“" + t.t + "”</p><div class='who'>" + t.w + " <span>· " + t.d + "</span></div></div>"
  ).join("");

  // ============================================================
  // SECTIONS 12–14 — COMPARISON / GUARANTEE / FAQ
  // ============================================================
  $("compare-headline").textContent = "Your three options in " + p.areaName.replace(/^the /, "") + ".";
  $("compare-price").textContent = SIFT_CONFIG.price;

  $("guarantee-headline").textContent = "Shower on it for " + SIFT_CONFIG.guaranteeDays + " days. Then decide.";
  $("guarantee-body").textContent =
    "Install Sift. Live with it. If " + concernWord + " " + (a.concern === "curious" ? "don't" : (concernWord.includes("and") ? "don't" : "doesn't")) +
    " feel the difference within " + SIFT_CONFIG.guaranteeDays + " days, send it back for a full refund — we cover return shipping. " +
    "The only way to know what your water has been doing is to feel what happens when it stops.";
  $("guarantee-price").textContent = SIFT_CONFIG.price;

  $("faq-filter-life").textContent =
    "3–4 months typical. " +
    (hardBad ? "In very hard water like yours, we recommend the refill schedule — 30-second swap, cancel anytime."
             : "Replacement filters swap in 30 seconds and ship on a schedule you control — cancel anytime.");
  $("faq-guarantee").textContent =
    "Then it costs you nothing — " + SIFT_CONFIG.guaranteeDays + " days, full refund, return shipping on us.";
  $("faq-micro").innerHTML =
    "🔄 Includes a fresh filter every 90 days — cancel anytime · " + SIFT_CONFIG.guaranteeDays + "-day guarantee<br>" +
    "ZIP " + p.zip + " · Report expires in 24 hours";

  // ============================================================
  // CTAs + STICKY
  // ============================================================
  ctaIds.forEach((id) => {
    $(id).addEventListener("click", () => {
      checkoutClicked = true;
      track("InitiateCheckout", { content_name: "sift_shower_head", finish: selFinish, qty: selQty });
      SiftTrack.send("checkout_click", { zip: p.zip, detail: selFinish + " x" + selQty + " via " + id });
    });
  });

  // Initial paint of the offer config (sets hrefs, price, image, labels).
  updateOffer();

  // Offer visibility — lets the dashboard distinguish "left before
  // seeing the price" from "saw the price and left".
  new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        offerSeen = true;
        SiftTrack.send("offer_seen", { zip: p.zip });
        obs.disconnect();
      }
    });
  }, { threshold: 0.2 }).observe($("offer"));

  $("sticky-title").textContent = lowScore ? "Your water scored " + p.score + "/100" : "Fix your water for " + SIFT_CONFIG.price;
  $("sticky-sub").textContent = SIFT_CONFIG.guaranteeDays + "-day money-back guarantee · Free shipping";

  const sticky = $("sticky-cta");
  const offerCard = $("offer");
  window.addEventListener("scroll", () => {
    const past = window.scrollY > 500;
    const unlocked = gateZone.classList.contains("unlocked");
    const r = offerCard.getBoundingClientRect();
    const offerVisible = r.top < window.innerHeight && r.bottom > 0;
    sticky.classList.toggle("show", past && unlocked && !offerVisible);
  }, { passive: true });

  // ============================================================
  // Scroll fade-ins
  // ============================================================
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  function watchFade(el) { io.observe(el); }
  document.querySelectorAll(".fade-in").forEach(watchFade);
  // Safety net: never leave content hidden if the observer misses.
  setTimeout(() => {
    document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => el.classList.add("visible"));
  }, 3000);
})();
