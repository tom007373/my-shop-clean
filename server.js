const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT nie został ustawiony");
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const NEWSLETTER_FILE = path.join(__dirname, "newsletter.txt");

app.post("/newsletter", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }

  const line = `${email} | ${new Date().toISOString()}\n`;

  fs.appendFile(NEWSLETTER_FILE, line, (err) => {
    if (err) {
      console.error("Błąd zapisu:", err);
      return res.status(500).json({ error: "Błąd serwera" });
    }

    console.log("Zapisano email:", email);
    res.json({ success: true });
  });
});

app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server działa na porcie ${PORT}`);
});
