import { google } from "googleapis";
import fs from "fs";
import path from "path";

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
const SHEET_ID = "1V3_whFAiiUu-lGUeEGfx0pA0VFpG0_HFEVgpcB0occg"; // from the URL

export default async function handler(req, res) {
  const { uid = "unknown", campaign = "none" } = req.query;
  const timestamp = new Date().toISOString();

  // ✅ Extract User-Agent and IP
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

  // Fetch geolocation from ip-api.com
  let location = { city: '', country: '', region: '', org: '' };
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
    const geoData = await geoRes.json();
    if (geoData.status === 'success') {
      location = {
        city: geoData.city || '',
        region: geoData.regionName || '',
        country: geoData.country || '',
        org: geoData.org || ''
      };
    }
  } catch (e) {
    console.error('Geo lookup failed:', e);
  }

   // 🧠 Parse User-Agent
  const parser = new UAParser(userAgent);
  const ua = parser.getResult();

  const deviceType = ua.device.type || 'desktop';
  const browser = ua.browser.name || '';
  const browserVersion = ua.browser.version || '';
  const os = ua.os.name || '';
  const osVersion = ua.os.version || '';

  
  // Log to Google Sheets
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[timestamp, uid, campaign, , ip, location.city, location.region, location.country, location.org,deviceType, browser, os]],
      },
    });
  } catch (err) {
    console.error("Google Sheets logging failed:", err);
  }

  // from previous code, for logging data to Vercel also, not just Google Sheets
    console.log(`[Tracking Pixel] ${new Date().toISOString()} | ${uid} | ${campaign}`);

  // Return transparent pixel
  const imagePath = path.resolve("./public/pixel.gif");
  const imageBuffer = fs.readFileSync(imagePath);

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).send(imageBuffer);
}
