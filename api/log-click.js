import UAParser from 'ua-parser-js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { uid, url, campaign, ip, userAgent } = req.body;

    const parser = new UAParser(userAgent);
    const ua = parser.getResult();

    const deviceType = ua.device.type || 'desktop';
    const browser = ua.browser.name || '';
    const os = ua.os.name || '';

    // Location lookup (optional)
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

    // Google Sheets Logging
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_JSON, "base64").toString("utf-8")
    );

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;
    const timestamp = new Date().toISOString();

       // Log to Google Sheets
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, uid, campaign, url, ip, location.city, location.region, location.country, location.org, deviceType, browser, os]],
      },
    });

    return res.status(200).send("Logged");
  } catch (err) {
    console.error("Logging failed:", err);
    return res.status(500).send("Error logging click");
  }
}

