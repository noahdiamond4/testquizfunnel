/**
 * Sift Quiz Funnel — Lead Capture → Google Sheets
 *
 * Receives a POST from report.js whenever a visitor unlocks their
 * water report, and appends one row per lead to a Google Sheet.
 *
 * SETUP (one time, ~3 minutes):
 *  1. Go to sheets.new and create a sheet named e.g. "Sift Leads".
 *  2. Extensions > Apps Script. Delete the boilerplate, paste this file.
 *  3. Deploy > New deployment > type: Web app.
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  4. Copy the Web app URL it gives you.
 *  5. Paste that URL into js/config.js as `leadWebhookUrl`.
 *
 * Each unlock appends: timestamp, name, email, zip, area, state,
 * score, grade, hardness, chlorine, concern, symptoms, hair,
 * fixtures, finish, showers, household, page URL.
 */

var SHEET_NAME = "Leads";

var HEADERS = [
  "Timestamp", "Name", "Email", "ZIP", "Area", "State",
  "Score", "Grade", "Hardness (ppm)", "Hardness", "Chlorine",
  "Concern", "Symptoms", "Hair", "Fixtures", "Finish",
  "Showers", "Household", "Page",
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.ts || new Date().toISOString(),
      data.name || "",
      data.email || "",
      "'" + (data.zip || ""), // leading apostrophe keeps ZIP leading zeros
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

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check: open the web app URL in a browser to verify deployment.
function doGet() {
  return ContentService.createTextOutput("Sift lead capture is live.")
    .setMimeType(ContentService.MimeType.TEXT);
}
