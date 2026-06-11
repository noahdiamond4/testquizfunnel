// ============================================================
// Sift Quiz Funnel — quiz flow logic
// Collects answers, "generates" the water report during the
// question flow, then hands off to report.html via sessionStorage.
// ============================================================

(function () {
  const TOTAL_STEPS = 7; // 0..6
  const answers = {
    zip: "",
    concern: "",
    symptoms: [],
    hair: "",
    homeAge: "",
    household: "",
  };
  let profile = null;
  let current = 0;

  const progressEl = document.getElementById("progress");
  const steps = document.querySelectorAll(".step");

  // -------- Facebook Pixel (optional) --------
  if (SIFT_CONFIG.fbPixelId) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", SIFT_CONFIG.fbPixelId);
    fbq("track", "PageView");
  }
  function track(event, data) {
    if (window.fbq) fbq("track", event, data || {});
  }

  function goTo(step) {
    current = step;
    steps.forEach((s) => s.classList.toggle("active", +s.dataset.step === step));
    progressEl.style.width = Math.round((step / (TOTAL_STEPS - 1)) * 100) + "%";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // -------- Step 0: ZIP --------
  const zipInput = document.getElementById("zip");
  const zipError = document.getElementById("zip-error");

  function submitZip() {
    const zip = zipInput.value.trim();
    if (!/^\d{5}$/.test(zip)) {
      zipError.textContent = "Please enter a valid 5-digit ZIP code.";
      zipInput.focus();
      return;
    }
    const p = getWaterProfile(zip);
    if (!p) {
      zipError.textContent = "Hmm, we couldn't find that ZIP. Double-check and try again.";
      zipInput.focus();
      return;
    }
    zipError.textContent = "";
    answers.zip = zip;
    profile = p; // report "generates in the background" from here on
    document.getElementById("analyze-zip").textContent = zip;
    document.getElementById("s1-kicker").textContent =
      "Pulling water data for " + p.areaName + "…";
    track("Lead", { content_name: "quiz_zip_submitted" });
    goTo(1);
  }
  document.getElementById("zip-go").addEventListener("click", submitZip);
  zipInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitZip(); });
  zipInput.addEventListener("input", () => {
    zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
  });

  // -------- Single-select questions auto-advance --------
  const stepAfter = { concern: 2, hair: 4, homeAge: 5, household: 6 };

  document.querySelectorAll('.options[data-multi="false"]').forEach((group) => {
    const q = group.dataset.q;
    group.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        group.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        answers[q] = opt.dataset.val;
        setTimeout(() => {
          const next = stepAfter[q];
          goTo(next);
          if (next === 6) runAnalysis();
        }, 320);
      });
    });
  });

  // -------- Multi-select (symptoms) --------
  const symptomsGroup = document.querySelector('.options[data-q="symptoms"]');
  const symptomsNext = document.getElementById("symptoms-next");

  symptomsGroup.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.dataset.val;
      if (val === "none") {
        symptomsGroup.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        answers.symptoms = ["none"];
      } else {
        symptomsGroup.querySelector('[data-val="none"]').classList.remove("selected");
        opt.classList.toggle("selected");
        answers.symptoms = [...symptomsGroup.querySelectorAll(".option.selected")].map(
          (o) => o.dataset.val
        );
      }
      symptomsNext.disabled = answers.symptoms.length === 0;
    });
  });
  symptomsNext.addEventListener("click", () => goTo(3));

  // -------- Step 6: analysis animation, then redirect --------
  function runAnalysis() {
    track("CompleteRegistration", { content_name: "quiz_completed" });

    // Persist everything the report page needs.
    sessionStorage.setItem(
      "sift_quiz",
      JSON.stringify({ answers, profile, ts: Date.now() })
    );

    const rows = document.querySelectorAll(".analyze-step");
    let i = 0;
    function tick() {
      if (i > 0) {
        rows[i - 1].classList.remove("working");
        rows[i - 1].classList.add("on");
      }
      if (i < rows.length) {
        rows[i].classList.add("working");
        i++;
        setTimeout(tick, 850 + Math.random() * 500);
      } else {
        document.getElementById("analyze-title").textContent = "Your report is ready.";
        setTimeout(() => { window.location.href = "report.html"; }, 600);
      }
    }
    tick();
  }
})();
