import { google } from 'googleapis';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { uid, campaign, url, h } = req.query;
  const secret = process.env.HMAC_SECRET;

  if (!uid || !campaign || !url || !h) {
    return res.status(400).send("Missing required parameters");
  }

  const base = `uid=${encodeURIComponent(uid)}&campaign=${encodeURIComponent(campaign)}&url=${encodeURIComponent(url)}`;
  const hash = crypto.createHmac('sha256', secret).update(base).digest('hex');

  if (hash !== h) {
    return res.status(403).send("Invalid signature");
  }

  try {
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
    const range = "Sheet1!A:D";
    const timestamp = new Date().toISOString();

    // ✅ Extract User-Agent and IP
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';


    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, uid, campaign, ip, userAgent, "click"]],
      },
    });
  } catch (error) {
    console.error("Google Sheets logging failed:", error);
  }

  res.writeHead(302, { Location: decodeURIComponent(url) });
  res.end();
}
