require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();

// ⛔ NIE dawaj fallbacku 3000
const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ PORT nie został ustawiony przez Railway");
  process.exit(1);
}

// Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Brak STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Test
app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

// Start serwera — TO JEST KLUCZ
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server działa na porcie ${PORT}`);
});
