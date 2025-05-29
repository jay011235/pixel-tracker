import { google } from "googleapis";
import fs from "fs";
import path from "path";

console.log("GOOGLE_SERVICE_JSON (first 100 chars):", process.env.GOOGLE_SERVICE_JSON?.slice(0, 100));

try {
  const decoded = Buffer.from(process.env.GOOGLE_SERVICE_JSON, "base64").toString("utf-8");
  console.log("Decoded JSON preview:", decoded.slice(0, 100));
  const serviceAccount = JSON.parse(decoded);
  // continue with using `serviceAccount`
} catch (err) {
  console.error("Failed to decode or parse GOOGLE_SERVICE_JSON", err);
  throw err;
}

// Decode base64 environment variable into JSON
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_JSON, "base64").toString("utf-8")
);

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// Your Google Sheet ID
const SHEET_ID = "https://docs.google.com/spreadsheets/d/1V3_whFAiiUu-lGUeEGfx0pA0VFpG0_HFEVgpcB0occg/edit"; // from the URL

export default async function handler(req, res) {
  const { email = "unknown", campaign = "none" } = req.query;
  const timestamp = new Date().toISOString();

  // Log to Google Sheets
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[timestamp, email, campaign]],
      },
    });
  } catch (err) {
    console.error("Google Sheets logging failed:", err);
  }

  // from previous code, for logging data to Vercel also, not just Google Sheets
    console.log(`[Tracking Pixel] ${new Date().toISOString()} | ${email} | ${campaign}`);

  // Return transparent pixel
  const imagePath = path.resolve("./public/pixel.gif");
  const imageBuffer = fs.readFileSync(imagePath);

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).send(imageBuffer);
}
