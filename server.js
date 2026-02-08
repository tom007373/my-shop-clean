const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== NEWSLETTER ===== */
const NEWSLETTER_FILE = path.join(__dirname, "newsletter.txt");

app.post("/newsletter", (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }

  fs.appendFile(NEWSLETTER_FILE, email + "\n", err => {
    if (err) return res.status(500).json({ error: "Błąd zapisu" });
    res.json({ success: true });
  });
});

/* ===== CHECKOUT ===== */
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
      payment_method_types: ["card"],
      line_items,
      success_url: `${process.env.DOMAIN}/success.html`,
      cancel_url: `${process.env.DOMAIN}/cancel.html`
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
console.log("PORT:", process.env.PORT);
console.log("DOMAIN:", process.env.DOMAIN);
console.log("STRIPE:", !!process.env.STRIPE_SECRET_KEY);
/* ===== START ===== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server działa na porcie ${PORT}`);
});
