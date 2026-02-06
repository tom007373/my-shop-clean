const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT nie został ustawiony");
  process.exit(1);
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Brak STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// newsletter
app.post("/newsletter", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }

  const line = `${email} | ${new Date().toISOString()}\n`;

  fs.appendFile("newsletter.txt", line, (err) => {
    if (err) {
      console.error("Błąd zapisu:", err);
      return res.status(500).json({ error: "Błąd serwera" });
    }

    console.log("Zapisano email:", email);
    res.json({ success: true });
  });
});

// test
app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

// start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server działa na porcie ${PORT}`);
});
