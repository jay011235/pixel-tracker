const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.get("/pixel.gif", (req, res) => {
  const { email = "unknown", campaign = "none" } = req.query;
  const logLine = `${new Date().toISOString()},${email},${campaign}\n`;

  fs.appendFile("log.csv", logLine, (err) => {
    if (err) console.error("Logging error:", err);
  });

  res.setHeader("Content-Type", "image/gif");
  fs.createReadStream(path.join(__dirname, "pixel.gif")).pipe(res);
});

app.listen(port, () => {
  console.log(`Tracking pixel server running at http://localhost:${port}`);
});
