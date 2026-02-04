require("dotenv").config();
const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Strona główna
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Test endpoint
app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

// Stripe checkout
app.post("/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: { name: "Test Product" },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      

    res.json({ url: session.url });
  } catch (err) {
    console.error("Błąd Stripe:", err);
    res.status(500).send("Błąd Stripe");
  }
});

// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`Server działa! 🚀 na porcie ${PORT}`);
});
