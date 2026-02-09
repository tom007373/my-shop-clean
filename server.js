const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");

/* ===== ENV CHECK ===== */
const PORT = process.env.PORT;
const DOMAIN = process.env.DOMAIN;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

console.log("PORT:", PORT);
console.log("DOMAIN:", DOMAIN);
console.log("STRIPE:", !!STRIPE_KEY);

if (!PORT) {
  console.error("❌ BRAK process.env.PORT (Railway)");
  process.exit(1);
}

if (!DOMAIN) {
  console.error("❌ BRAK process.env.DOMAIN");
  process.exit(1);
}

if (!STRIPE_KEY) {
  console.error("❌ BRAK STRIPE_SECRET_KEY");
  process.exit(1);
}

/* ===== APP ===== */
const app = express();
const stripe = require("stripe")(STRIPE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== HEALTHCHECK (WAŻNE DLA RAILWAY) ===== */
app.get("/", (req, res) => {
  res.send("OK");
});

/* ===== NEWSLETTER ===== */
const NEWSLETTER_FILE = path.join(__dirname, "newsletter.txt");

app.post("/newsletter", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }

  fs.appendFile(NEWSLETTER_FILE, email + "\n", err => {
    if (err) {
      console.error("❌ Błąd zapisu newslettera:", err);
      return res.status(500).json({ error: "Błąd zapisu" });
    }

    res.json({ success: true });
  });
});

/* ===== CHECKOUT (STRIPE) ===== */
app.post("/checkout", async (req, res) => {
  try {
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
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
      payment_method_types: ["card"],
      line_items,
      success_url: `${DOMAIN}/success.html`,
      cancel_url: `${DOMAIN}/cancel.html`
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: "Stripe error" });
  }
});

/* ===== START ===== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server działa na porcie", PORT);
});

