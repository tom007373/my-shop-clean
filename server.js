const fs = require("fs");
require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ BRAK STRIPE_SECRET_KEY");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== TEST ===== */
app.get("/ping", (req, res) => {
  res.send("OK");
});

/* ===== NEWSLETTER ===== */
app.post("/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }
  fs.appendFileSync("newsletter.txt", email + "\n");
  res.json({ success: true });
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
        product_data: { name: item.name },
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
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
});

/* ===== START ===== */
const server = app.listen(PORT, () => {
  console.log("✅ Server listening on port", PORT);
});
