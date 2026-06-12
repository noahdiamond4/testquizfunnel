// ============================================================
// Sift — Funnel Event Tracker
// Sends every funnel step to the Apps Script webhook so the
// dashboard can show live sessions, drop-off, and abandonment.
// Uses sendBeacon so exit events survive tab closes.
// ============================================================

window.SiftTrack = (function () {
  // Stable per-visitor session id.
  let sid = localStorage.getItem("sift_sid");
  if (!sid) {
    sid = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("sift_sid", sid);
  }

  const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";

  function send(type, data) {
    const url = SIFT_CONFIG.leadWebhookUrl;
    if (!url) return;
    const payload = JSON.stringify(Object.assign({
      kind: "event",
      sid, type, device,
      page: location.pathname.replace(/^.*\//, "") || "index.html",
      ts: new Date().toISOString(),
    }, data || {}));
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "text/plain;charset=utf-8" }));
      } else {
        fetch(url, { method: "POST", mode: "no-cors", keepalive: true,
          headers: { "Content-Type": "text/plain;charset=utf-8" }, body: payload });
      }
    } catch (e) { /* tracking must never break the funnel */ }
  }

  return { send, sid };
})();
