require("dotenv").config();

/* ================== IMPORTY ================== */
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const { Pool } = require("pg");
const multer = require("multer");
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

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  })
});
/* ================== BEZPIECZNY DB INIT ================== */

async function initDatabase() {
  try {
    await pool.query(`SELECT 1`);
    console.log("✅ DB connected");

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
  } catch (err) {
    console.error("❌ DB connection error (will retry):", err.message);
    setTimeout(initDatabase, 5000); // próba ponownie za 5 sek
  }
  await pool.query(`
  CREATE TABLE IF NOT EXISTS custom_projects (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    main_file TEXT,
    extra_files JSONB,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
}

initDatabase();

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
/* ===== CUSTOM PROJECT UPLOAD ===== */

app.post("/project-upload", upload.fields([
  { name: "mainFile", maxCount: 1 },
  { name: "extraFiles", maxCount: 5 }
]), async (req, res) => {

  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Brak opisu" });
    }

    const mainFile = req.files["mainFile"]?.[0]?.originalname || null;

    const extraFiles = req.files["extraFiles"]
      ? req.files["extraFiles"].map(f => f.originalname)
      : [];

    await pool.query(
      `INSERT INTO custom_projects (description, main_file, extra_files)
       VALUES ($1, $2, $3::jsonb)`,
      [description, mainFile, JSON.stringify(extraFiles)]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Project upload error:", err.message);
    res.status(500).json({ error: "Błąd zapisu projektu" });
  }

});
/* ===== CHECKOUT ===== */
app.post("/checkout", async (req, res) => {
  try {
    const { customer, cart } = req.body;

    if (!customer || !cart || cart.length === 0) {
      return res.status(400).json({ error: "Nieprawidłowe dane" });
    }

    // ✅ zapis do bazy
    const orderResult = await pool.query(
      `INSERT INTO orders (email, name, phone, address, cart)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       RETURNING id`,
      [
        customer.email,
        customer.name,
        customer.phone,
        JSON.stringify(customer.address),
        JSON.stringify(cart)
      ]
    );

    const orderId = orderResult.rows[0].id;

    // ✅ budujemy line items do Stripe
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

    // ✅ tworzymy sesję Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.DOMAIN}/success.html`,
      cancel_url: `${process.env.DOMAIN}/cancel.html`,
      metadata: {
        order_id: orderId
      }
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