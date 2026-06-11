// ============================================================
// Sift — Personalized Report Page
// Reads quiz answers + water profile from sessionStorage and
// composes the advertorial. If someone lands here directly
// (no quiz data), they're sent back to the quiz.
// ============================================================

(function () {
  const raw = sessionStorage.getItem("sift_quiz");
  if (!raw) { window.location.replace("index.html"); return; }

  const { answers, profile } = JSON.parse(raw);
  const p = profile;
  const a = answers;

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

  const $ = (id) => document.getElementById(id);

  // -------- Derived severity helpers --------
  const hardBad = p.hardnessTier >= 2;       // hard or very hard
  const hardMid = p.hardnessTier === 1;
  const chlorBad = p.chlorineLevel >= 3;
  const lowScore = p.score < 55;

  const CONCERN_WORDS = {
    hair: "your hair",
    skin: "your skin",
    scalp: "your scalp",
    curious: "your hair and skin",
  };
  const concernWord = CONCERN_WORDS[a.concern] || "your hair and skin";

  // -------- HERO --------
  $("hero-kicker").textContent = "Water Report · " + p.areaName + " · ZIP " + p.zip;
  if (lowScore) {
    $("hero-headline").textContent =
      "Your water in " + p.areaName + " scored " + p.score + "/100 — and it shows up in " + concernWord + ".";
  } else if (p.score < 70) {
    $("hero-headline").textContent =
      "Your water in " + p.areaName + " scored " + p.score + "/100. Here's what that means for " + concernWord + ".";
  } else {
    $("hero-headline").textContent =
      "Good news and bad news about your water in " + p.areaName + ".";
  }
  $("hero-sub").textContent =
    "Based on regional water data for ZIP " + p.zip + " and your " +
    "answers, here's what's coming out of your shower head — and what it's doing every time you rinse.";

  // -------- SCORE GAUGE --------
  $("score-zip").textContent = p.zip;
  const arc = $("gauge-arc");
  const ARC_LEN = Math.PI * 90; // semicircle r=90
  arc.style.strokeDasharray = ARC_LEN;
  arc.style.strokeDashoffset = ARC_LEN;
  const color = p.score < 55 ? "#d9534f" : p.score < 70 ? "#f4b942" : "#1e9e6a";
  arc.style.stroke = color;

  const gradeEl = $("gauge-grade");
  gradeEl.textContent = "Grade: " + p.grade;
  gradeEl.className = "gauge-grade " + (p.score < 55 ? "grade-bad" : p.score < 70 ? "grade-mid" : "grade-good");

  $("score-note").textContent = lowScore
    ? "Scores below 55 indicate water that actively works against " + concernWord + " — most homes in " + p.areaName + " fall in this range."
    : p.score < 70
    ? "A score in this range means your water is doing low-grade, daily damage most people blame on their products."
    : "Your water is better than most — but unfiltered chlorine and trace sediment still strip moisture with every shower.";

  // Animate gauge + counter after layout
  requestAnimationFrame(() => {
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
    }, 300);
  });

  // -------- METRICS --------
  $("findings-title").textContent = "Key findings for " + p.areaName;

  const hClass = hardBad ? "bad" : hardMid ? "mid" : "good";
  const hv = $("hardness-val");
  hv.textContent = p.hardnessLabel + " · ~" + p.hardnessPpm + " ppm";
  hv.classList.add(hClass);
  const hBar = $("hardness-bar");
  hBar.classList.add(hClass);
  $("hardness-note").textContent = hardBad
    ? "At ~" + p.hardnessGrains + " grains per gallon, your water carries heavy calcium and magnesium loads. These minerals bond to hair and skin, leaving the film that makes hair dull and skin tight."
    : hardMid
    ? "Moderately hard water still deposits enough mineral residue to build up on hair and skin over weeks of daily showers."
    : "Your water is on the softer side — chlorine and sediment are the bigger factors in your area.";

  const cClass = chlorBad ? "bad" : p.chlorineLevel === 2 ? "mid" : "good";
  const cv = $("chlorine-val");
  cv.textContent = p.chlorineLabel;
  cv.classList.add(cClass);
  const cBar = $("chlorine-bar");
  cBar.classList.add(cClass);
  $("chlorine-note").textContent = chlorBad
    ? "Utilities in your region run disinfectant levels at the higher end of the EPA-allowed range. Hot showers vaporize chlorine, so you absorb and inhale it — that's the \"pool smell\" some people notice."
    : "Your water is disinfected with chlorine or chloramine — safe to drink, but it strips the natural oils that keep skin and hair moisturized.";

  const flags = $("flags");
  p.contaminants.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    flags.appendChild(li);
  });
  if (a.homeAge === "old") {
    const li = document.createElement("li");
    li.textContent = "Pipe sediment & metal traces — likely elevated given your 40+ year-old plumbing";
    flags.appendChild(li);
  }

  // Animate bars on scroll into view
  setTimeout(() => {
    hBar.style.width = Math.min(96, Math.round((p.hardnessPpm / 320) * 100)) + "%";
    cBar.style.width = (p.chlorineLevel * 30 + 8) + "%";
  }, 600);

  // -------- PERSONALIZED ANALYSIS --------
  const sym = new Set(a.symptoms || []);
  const personalBits = [];

  if (sym.has("buildup")) {
    personalBits.push({
      h: "That white crust on your faucets? It's on you, too.",
      p: "You told us you see mineral spots on fixtures and glass. That's " + p.hardnessLabel.toLowerCase() + " water leaving its signature — and the same scale that crusts your faucet is depositing on " + concernWord + " every single shower. It just doesn't show as white flakes; it shows as dullness, dryness, and product that won't rinse clean.",
    });
  }
  if (sym.has("smell")) {
    personalBits.push({
      h: "That \"pool smell\" is chlorine vaporizing onto you.",
      p: "You noticed a chemical smell in the shower. Chlorine evaporates ~100x faster in hot water, which means your shower becomes a chlorine steam room. It's the same chemical that turns swimmers' hair brittle — just slower.",
    });
  }
  if (sym.has("tight-skin")) {
    personalBits.push({
      h: "\"Squeaky clean\" skin isn't clean — it's stripped.",
      p: "That tight feeling after a shower is your skin's lipid barrier being washed away by chlorine and bonded minerals. Moisturizer afterwards is patching damage that the water itself caused minutes earlier.",
    });
  }
  if (sym.has("flat-hair")) {
    personalBits.push({
      h: "Your hair isn't the problem. The coating on it is.",
      p: "Hair that feels heavy, coated, or won't lather is the classic signature of hard-water mineral film. It blocks conditioner from penetrating — which is why even good products seem to \"stop working\" in " + p.areaName + ".",
    });
  }
  if (a.hair === "color") {
    personalBits.push({
      h: "Your color is fading faster than it should.",
      p: "Chlorine oxidizes hair dye and minerals shift its tone (brassiness in blondes is usually hard water, not the toner). Colorists in hard-water areas routinely tell clients to filter their shower before booking another correction appointment.",
    });
  }
  if (a.hair === "products") {
    personalBits.push({
      h: "You're investing in products — and your water is undoing them.",
      p: "Quality shampoos and serums are formulated for neutral, soft water. At ~" + p.hardnessPpm + " ppm hardness, much of what you're paying for is neutralized before it can work.",
    });
  }
  if (a.homeAge === "old" || a.homeAge === "mid") {
    personalBits.push({
      h: "Your building's plumbing adds its own layer.",
      p: "Water leaves the treatment plant tested — then travels through miles of aging municipal mains and your building's own pipes. Older plumbing sheds sediment, rust, and metal traces that no city report accounts for. A filter at the shower head is the only thing that catches what your pipes add.",
    });
  }
  if (sym.has("none") && personalBits.length === 0) {
    personalBits.push({
      h: "No visible symptoms yet — which is exactly the point.",
      p: "Hard water and chlorine damage is cumulative. By the time it's visible as dullness, dryness, or fading color, the barrier damage is months in. Catching it while your water scores " + p.score + "/100 and you feel fine is the cheap version of this problem.",
    });
  }

  const hh = parseInt(a.household || "1", 10);
  const gallonsYear = (hh * 20 * 365).toLocaleString();
  personalBits.push({
    h: hh > 1 ? "Your household runs ~" + gallonsYear + " gallons of this water a year." : "You run ~" + gallonsYear + " gallons of this water over yourself a year.",
    p: (hh > 1 ? "Across " + (a.household === "5" ? "five or more" : a.household) + " people, that's " : "That's ") +
       "roughly " + gallonsYear + " gallons of " + p.hardnessLabel.toLowerCase() + ", " +
       (chlorBad ? "heavily chlorinated" : "chlorinated") + " water across hair and skin annually — one small filter at the shower head treats all of it.",
  });

  $("personal-title").textContent = "What your answers tell us, " + (lowScore ? "and why it adds up" : "in plain terms");
  const pb = $("personal-body");
  personalBits.slice(0, 4).forEach((bit) => {
    const div = document.createElement("div");
    div.className = "callout";
    div.innerHTML = "<h3>" + bit.h + "</h3><p>" + bit.p + "</p>";
    pb.appendChild(div);
  });

  // -------- NARRATIVE --------
  $("narrative-1").textContent =
    "If you've cycled through shampoos, conditioners, and moisturizers wondering why nothing sticks, here's the uncomfortable answer: in " +
    p.areaName + ", the problem renews itself every morning. " +
    (hardBad
      ? "Water at ~" + p.hardnessPpm + " ppm hardness redeposits minerals faster than any product can remove them."
      : "Chlorinated water strips your skin's barrier faster than any moisturizer can rebuild it.");
  $("narrative-2").textContent =
    "Dermatologists and trichologists have pointed at the same culprit for years: it's not your routine, it's your rinse. " +
    "Every product you apply gets applied through this water and rinsed off with this water.";

  // -------- OFFER --------
  $("product-tagline").textContent =
    "15-stage filtration tuned for " + (hardBad ? "hard-water regions like " : "water like ") + p.areaName + "'s.";

  const benefits = [];
  benefits.push("<strong>Reduces chlorine up to 98%</strong> — the #1 cause of stripped, dry " + (a.concern === "skin" ? "skin" : "hair and skin"));
  if (hardBad || hardMid) benefits.push("<strong>KDF-55 + calcium sulfite media</strong> targets the hard-water minerals behind buildup and dullness");
  benefits.push("<strong>Captures sediment, rust & pipe particles</strong>" + (a.homeAge === "old" ? " — important for your 40+ year-old plumbing" : " before they reach you"));
  if (a.hair === "color") benefits.push("<strong>Protects color-treated hair</strong> — slower fade, less brassiness between salon visits");
  if (a.concern === "scalp") benefits.push("<strong>Gentler on the scalp</strong> — removing chlorine helps calm flaking and itch for many users");
  benefits.push("<strong>Spa-grade pressure</strong> from a precision spray plate — filtration without the trickle");
  $("benefits").innerHTML = benefits.slice(0, 5).map((b) => "<li>" + b + "</li>").join("");

  $("price-now").textContent = SIFT_CONFIG.price;
  $("price-was").textContent = SIFT_CONFIG.compareAtPrice;
  const pct = Math.round(
    (1 - parseFloat(SIFT_CONFIG.price.replace(/[^0-9.]/g, "")) / parseFloat(SIFT_CONFIG.compareAtPrice.replace(/[^0-9.]/g, ""))) * 100
  );
  $("price-badge").textContent = "Save " + pct + "%";
  $("compare-price").textContent = SIFT_CONFIG.price;
  $("guarantee-title").textContent = SIFT_CONFIG.guaranteeDays + "-Day \"Feel the Difference\" Guarantee";
  $("faq-guarantee").textContent =
    "Then it costs you nothing. You have " + SIFT_CONFIG.guaranteeDays + " days to shower with Sift. If you don't feel a difference in your " +
    (a.concern === "skin" ? "skin" : a.concern === "scalp" ? "scalp" : "hair and skin") +
    ", return it for a full refund — including return shipping.";
  $("faq-filter-life").textContent =
    "About 3–4 months of typical use. " +
    (hh >= 3 ? "For a household your size, replacement filters ship on a schedule you control — cancel anytime." : "Replacement filters take 30 seconds to swap and ship automatically if you want them to — cancel anytime.");

  // -------- TESTIMONIALS (matched to profile) --------
  const T = [];
  if (hardBad) T.push({ stars: 5, text: "I live with seriously hard water and assumed my hair was just like this now. Two weeks with Sift and my conditioner actually lathers and rinses clean. I'm annoyed I waited.", who: "Melissa R.", where: "hard-water area" });
  if (a.hair === "color") T.push({ stars: 5, text: "My colorist asked what I changed because my blonde stopped going brassy between appointments. It was the shower head. That's it.", who: "Dana K.", where: "color-treated hair" });
  if (sym.has("tight-skin") || a.concern === "skin") T.push({ stars: 5, text: "The tight, itchy feeling after showers is just… gone. I've cut my body lotion use in half.", who: "Priya S.", where: "dry skin" });
  if (a.concern === "scalp") T.push({ stars: 5, text: "Flaky scalp for years, tried every shampoo. Filtering the chlorine out is the only thing that's calmed it down.", who: "Marcus T.", where: "scalp issues" });
  T.push({ stars: 5, text: "Installed it in two minutes, no tools. Pressure is honestly better than my old shower head.", who: "Jordan L.", where: "verified buyer" });
  T.push({ stars: 4, text: "Took about a week to notice, but my hair is visibly shinier and my husband's dandruff improved. Filter swap is easy.", who: "Caitlin M.", where: "verified buyer" });

  $("testimonial-title").textContent = "From people with water like " + p.areaName + "'s";
  $("testimonials").innerHTML = T.slice(0, 4).map((t) =>
    '<div class="testimonial"><div class="stars">' + "★".repeat(t.stars) + "☆".repeat(5 - t.stars) + "</div><p>“" + t.text + "”</p><div class='who'>" + t.who + " <span>· " + t.where + "</span></div></div>"
  ).join("");

  // -------- CTAs --------
  const params = new URLSearchParams({
    utm_source: "quiz_funnel",
    utm_medium: "report",
    utm_campaign: "water_report",
    zip: p.zip,
    score: p.score,
    concern: a.concern || "",
  });
  const checkoutHref = SIFT_CONFIG.checkoutUrl + (SIFT_CONFIG.checkoutUrl.includes("?") ? "&" : "?") + params.toString();
  ["cta-main", "cta-faq", "cta-sticky"].forEach((id) => {
    const el = $(id);
    el.href = checkoutHref;
    el.addEventListener("click", () => {
      if (window.fbq) fbq("track", "InitiateCheckout", { content_name: "sift_shower_head" });
    });
  });

  // -------- Sticky CTA --------
  $("sticky-title").textContent = lowScore
    ? "Your water scored " + p.score + "/100"
    : "Fix your water for " + SIFT_CONFIG.price;
  $("sticky-sub").textContent = SIFT_CONFIG.guaranteeDays + "-day money-back guarantee · Free shipping";

  const sticky = $("sticky-cta");
  const offerCard = $("offer");
  window.addEventListener("scroll", () => {
    const past = window.scrollY > 500;
    const offerVisible = (() => {
      const r = offerCard.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    })();
    sticky.classList.toggle("show", past && !offerVisible);
  }, { passive: true });

  // -------- Scroll fade-ins --------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));
  // Safety net: never leave content hidden if the observer misses.
  setTimeout(() => {
    document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => el.classList.add("visible"));
  }, 3000);
})();
