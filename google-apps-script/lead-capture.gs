/**
 * Sift Quiz Funnel — Backend (Leads + Live Funnel Analytics)
 *
 * One Apps Script web app does three jobs:
 *   1. POST {kind:"lead"}  -> appends a row to the "Leads" sheet
 *   2. POST {kind:"event"} -> appends a row to the "Events" sheet
 *      (every quiz step, answer, report view, offer view, unlock,
 *       checkout click, and exit/abandon beacon)
 *   3. GET  ?key=YOUR_KEY  -> returns recent events + leads as JSON
 *      (this is what dashboard.html polls to show live activity)
 *
 * SETUP (one time, ~3 minutes):
 *  1. sheets.new -> name it "Sift Funnel".
 *  2. Extensions > Apps Script -> paste this file over the boilerplate.
 *  3. Change DASHBOARD_KEY below to your own secret.
 *  4. Deploy > New deployment > Web app
 *       Execute as: Me · Who has access: Anyone
 *  5. Copy the web app URL into js/config.js as `leadWebhookUrl`.
 *  6. Open dashboard.html, paste the same URL + your key. Done.
 *
 * NOTE: after editing this script you must create a NEW deployment
 * version (Deploy > Manage deployments > edit > new version) for
 * changes to go live.
 */

var DASHBOARD_KEY = "change-me"; // <-- set your own secret

var LEADS_SHEET = "Leads";
var EVENTS_SHEET = "Events";

var LEAD_HEADERS = [
  "Timestamp", "Session", "Name", "Email", "ZIP", "Area", "State",
  "Score", "Grade", "Hardness (ppm)", "Hardness", "Chlorine",
  "Concern", "Symptoms", "Hair", "Fixtures", "Finish",
  "Showers", "Household", "Page",
];

var EVENT_HEADERS = [
  "Timestamp", "Session", "Type", "Step", "Detail", "ZIP", "Device", "Page",
];

function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.kind === "event") {
      getSheet(EVENTS_SHEET, EVENT_HEADERS).appendRow([
        data.ts || new Date().toISOString(),
        data.sid || "",
        data.type || "",
        data.step || "",
        data.detail || "",
        "'" + (data.zip || ""),
        data.device || "",
        data.page || "",
      ]);
    } else {
      // lead
      getSheet(LEADS_SHEET, LEAD_HEADERS).appendRow([
        data.ts || new Date().toISOString(),
        data.sid || "",
        data.name || "",
        data.email || "",
        "'" + (data.zip || ""),
        data.area || "",
        data.state || "",
        data.score || "",
        data.grade || "",
        data.hardnessPpm || "",
        data.hardnessLabel || "",
        data.chlorine || "",
        data.concern || "",
        data.symptoms || "",
        data.hair || "",
        data.fixtures || "",
        data.finish || "",
        data.showers || "",
        data.household || "",
        data.page || "",
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Health check without key.
  if (!e || !e.parameter || !e.parameter.key) {
    return ContentService.createTextOutput("Sift funnel backend is live.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
  if (e.parameter.key !== DASHBOARD_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "bad key" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var limit = Math.min(parseInt(e.parameter.limit || "2000", 10) || 2000, 5000);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  function tail(name, n) {
    var sheet = ss.getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return [];
    var last = sheet.getLastRow();
    var start = Math.max(2, last - n + 1);
    return sheet.getRange(start, 1, last - start + 1, sheet.getLastColumn()).getValues();
  }

  var out = {
    ok: true,
    now: new Date().toISOString(),
    events: tail(EVENTS_SHEET, limit),
    leads: tail(LEADS_SHEET, 200),
  };
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
