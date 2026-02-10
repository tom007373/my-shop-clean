require("dotenv").config();

/* ================== IMPORTY ================== */
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const { Pool } = require("pg");

/* ================== WALIDACJA ENV ================== */
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ BRAK STRIPE_SECRET_KEY");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("❌ BRAK DATABASE_URL");
  process.exit(1);
}

/* ================== DB ================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================== STRIPE ================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================== APP ================== */
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== DB INIT ================== */
/*
  Co robi ten kod?
  - Przy starcie serwera upewnia się, że tabela istnieje
  - Nie tworzy jej drugi raz
  - Nie powoduje crashy przy redeploy
*/
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Newsletter table ready");
  } catch (err) {
    console.error("❌ DB init error:", err.message);
    process.exit(1);
  }
})();

/* ================== ROUTES ================== */

/* TEST */
app.get("/ping", (req, res) => {
  res.send("OK");
});

/* NEWSLETTER */
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  // Walidacja danych
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Nieprawidłowy email" });
  }

  try {
    await pool.query(
      "INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
      [email]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Newsletter DB error:", err.message);
    res.status(500).json({ error: "Błąd zapisu" });
  }
});

/* CHECKOUT */
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
    console.error("❌ Stripe error:", err.message);
    res.status(500).json({ error: "Stripe error" });
  }
});

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================== START ================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server listening on port", PORT);
});

/* ================== SHUTDOWN ================== */
/*
  Railway wysyła SIGTERM przy:
  - redeploy
  - zmianie variables
  - skali
  To NIE jest błąd
*/
process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM from Railway (normal shutdown)");
});