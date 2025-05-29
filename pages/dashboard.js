export default function Dashboard() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📈 Pixel Tracker Dashboard</h1>
      <p>This page is working!</p>
    </div>
  );
}

import { google } from "googleapis";

export async function getServerSideProps() {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_JSON, "base64").toString("utf-8")
  );

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: "1V3_whFAiiUu-lGUeEGfx0pA0VFpG0_HFEVgpcB0occg",
    range: "Sheet1!A:F",
  });

  const rows = res.data.values || [];

  return { props: { rows } };
}

export default function Dashboard({ rows }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📈 Pixel Tracker Dashboard</h1>
      <table border="1" cellPadding="5" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Email</th>
            <th>Campaign</th>
            <th>IP</th>
            <th>User Agent</th>
            <th>Referrer</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).reverse().map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
