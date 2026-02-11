require("dotenv").config();

/* ================== IMPORTY ================== */
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const { Pool } = require("pg");

/* ================== WALIDACJA ENV ================== */
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ BRAK STRIPE_SECRET_KEY");
}

if (!process.env.DATABASE_URL) {
  console.error("❌ BRAK DATABASE_URL");
}

/* ================== DB ================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

/* ================== STRIPE ================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================== APP ================== */
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== BEZPIECZNY DB INIT ================== */

async function initDB(retries = 10) {
  while (retries) {
    try {
      await pool.query("SELECT 1");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS newsletter (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          email TEXT,
          name TEXT,
          phone TEXT,
          address JSONB,
          cart JSONB,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      console.log("✅ Database ready");
      return;
    } catch (err) {
      console.log("⏳ Waiting for DB...");
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  console.error("❌ Could not connect to DB after retries");
}

initDB();

/* ================== ROUTES ================== */

app.get("/ping", (req, res) => {
  res.send("OK");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ===== NEWSLETTER ===== */
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;

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
    console.error("❌ Newsletter error:", err.message);
    res.status(500).json({ error: "Błąd zapisu" });
  }
});

/* ===== CHECKOUT ===== */
app.post("/checkout", async (req, res) => {
  try {
    const { customer, cart } = req.body;

    if (!customer || !cart || cart.length === 0) {
      return res.status(400).json({ error: "Nieprawidłowe dane" });
    }

    const order = await pool.query(
      `INSERT INTO orders (email, name, phone, address, cart)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        customer.email,
        customer.name,
        customer.phone,
        customer.address,
        cart
      ]
    );

    const orderId = order.rows[0].id;

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
      cancel_url: `${process.env.DOMAIN}/cancel.html`,
      metadata: { order_id: orderId }
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Checkout error:", err.message);
    res.status(500).json({ error: "Błąd płatności" });
  }
});

/* ================== START ================== */

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server listening on port", PORT);
});

/* ================== SHUTDOWN ================== */

process.on("SIGTERM", () => {
  console.log("⚠️ SIGTERM from Railway (normal shutdown)");
}); 