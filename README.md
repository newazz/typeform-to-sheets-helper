# Typeform to Google Sheets Helper

A small Node.js utility that normalizes a messy Typeform webhook payload into a clean, flat row and appends it to a Google Sheet. The transform runs offline with a built-in sample, so you can see the output immediately.

## Why

Typeform webhooks arrive as a nested `answers` array where each answer has a different shape depending on its type. This helper flattens that into one tidy row keyed by your field refs, ready for a spreadsheet or a CRM.

## Files

- `index.js` : the transform, a Google Sheets append, and an optional webhook server.

## Run the demo

node index.js


With no SHEET_ID set, it prints the normalized row from a sample payload.

## Live mode (optional)

npm install express googleapis
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
export SHEET_ID=your_sheet_id
node index.js


This starts a webhook server at `/webhook` that appends each Typeform submission to your sheet.

## Notes

Generic sample, no client data. In production I add field validation and a retry on the Sheets call.

---

Built by Newaz, FormLogic Studio (https://formlogicstudio.com).
