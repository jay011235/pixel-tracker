import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { email = "unknown", campaign = "none" } = req.query;

  console.log(`[Tracking Pixel] ${new Date().toISOString()} | ${email} | ${campaign}`);

  // Return transparent gif
  const imagePath = path.resolve('./public/pixel.gif');
  const imageBuffer = fs.readFileSync(imagePath);

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).send(imageBuffer);
}
