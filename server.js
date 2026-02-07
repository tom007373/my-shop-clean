const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();

// ✅ PORT – BEZ ZABIJANIA PROCESU
const PORT = process.env.PORT || 8080;

// ✅ STRIPE
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Brak STRIPE_SECRET_KEY");
  process.exit(1);
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== NEWSLETTER =====
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

    res.json({ success: true });
  });
});

// ===== STRIPE CHECKOUT =====
app.post("/checkout", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Pusty koszyk" });
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: "pln",
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.DOMAIN}/success.html`,
      cancel_url: `${process.env.DOMAIN}/cancel.html`
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Błąd Stripe" });
  }
});

// ===== TEST =====
app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

// ===== START =====
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server działa na porcie ${PORT}`);
});
