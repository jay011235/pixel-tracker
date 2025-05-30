import { google } from 'googleapis';
import crypto from 'crypto';

export default async function handler(req, res) {
  const { email, campaign, url, h } = req.query;
  const secret = process.env.HMAC_SECRET;

  if (!email || !campaign || !url || !h) {
    return res.status(400).send("Missing required parameters");
  }

  const base = `email=${encodeURIComponent(email)}&campaign=${encodeURIComponent(campaign)}&url=${encodeURIComponent(url)}`;
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

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, email, campaign, "click"]],
      },
    });
  } catch (error) {
    console.error("Google Sheets logging failed:", error);
  }

  res.writeHead(302, { Location: url });
  res.end();
}
