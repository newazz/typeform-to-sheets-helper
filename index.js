/**
 * Typeform to Google Sheets helper
 *
 * Normalizes a Typeform webhook payload into a clean, flat row and appends it
 * to a Google Sheet. The transform function runs offline with a built-in
 * sample, so you can see the output without any credentials.
 *
 * Author: Newaz, FormLogic Studio
 */

// ---- Transform: Typeform payload -> flat row -------------------------------

function typeformToRow(payload) {
  const form = payload.form_response || {};
  const answers = form.answers || [];

  const row = {
    submitted_at: form.submitted_at || "",
    form_id: form.form_id || "",
  };

  for (const answer of answers) {
    const key =
      (answer.field && answer.field.ref) ||
      (answer.field && answer.field.id) ||
      "unknown";
    row[key] = readAnswer(answer);
  }

  return row;
}

function readAnswer(answer) {
  switch (answer.type) {
    case "text":
    case "email":
    case "phone_number":
    case "url":
      return answer[answer.type] || "";
    case "number":
      return answer.number;
    case "boolean":
      return answer.boolean ? "Yes" : "No";
    case "choice":
      return (answer.choice && answer.choice.label) || "";
    case "choices":
      return ((answer.choices && answer.choices.labels) || []).join(", ");
    case "date":
      return answer.date || "";
    default:
      return answer[answer.type] || "";
  }
}

// ---- Append to Google Sheets (used when credentials are present) -----------

async function appendToSheet(row) {
  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [Object.values(row)] },
  });
}

// ---- Webhook server (optional) ---------------------------------------------

function startServer() {
  const express = require("express");
  const app = express();
  app.use(express.json());

  app.post("/webhook", async (req, res) => {
    try {
      const row = typeformToRow(req.body);
      await appendToSheet(row);
      res.sendStatus(200);
    } catch (err) {
      console.error("Failed to process submission:", err.message);
      res.sendStatus(500);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

// ---- Demo: run offline with a sample payload -------------------------------

const SAMPLE = {
  form_response: {
    form_id: "abc123",
    submitted_at: "2026-10-15T09:00:00Z",
    answers: [
      { type: "text", text: "Alex Morgan", field: { ref: "full_name" } },
      { type: "email", email: "alex@example.com", field: { ref: "email" } },
      { type: "choice", choice: { label: "Coaching" }, field: { ref: "service" } },
      { type: "number", number: 3, field: { ref: "sessions_per_week" } },
      { type: "boolean", boolean: true, field: { ref: "agreed_terms" } },
    ],
  },
};

if (require.main === module) {
  if (process.env.SHEET_ID) {
    startServer();
  } else {
    console.log("Demo mode. No SHEET_ID set, so printing the normalized row:\n");
    console.log(typeformToRow(SAMPLE));
  }
}

module.exports = { typeformToRow, readAnswer };
