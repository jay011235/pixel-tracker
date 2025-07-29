import crypto from 'crypto';

export default async function handler(req, res) {
  const { uid, campaign, url, h } = req.query;
  const secret = process.env.HMAC_SECRET;

  // for pinging to keep server warm
  if (req.query.uid === 'ping') {
    console.log("Ping received – keeping function warm.");
    return res.status(200).send("OK – warmed");
  }
  
  if (!uid || !campaign || !url || !h) {
    return res.status(400).send("Missing required parameters");
  }

  const base = `uid=${encodeURIComponent(uid)}&campaign=${encodeURIComponent(campaign)}&url=${encodeURIComponent(url)}`;
  const hash = crypto.createHmac('sha256', secret).update(base).digest('hex');

  if (hash !== h) {
    return res.status(403).send("Invalid signature");
  }

  // Extract IP and User-Agent
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';

  // Fire and forget logging
  fetch(`https://ivey-invest-jay011235s-projects.vercel.app/api/log-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, campaign, ip, userAgent }),
  }).catch(console.error);

  // Redirect immediately
  res.writeHead(302, { Location: decodeURIComponent(url) });
  res.end();
}

