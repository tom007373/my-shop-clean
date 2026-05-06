require("dotenv").config();

/* ================== IMPORTY ================== */
const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");

/* ================== WALIDACJA ENV ================== */
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ BRAK STRIPE_SECRET_KEY");
}

if (!process.env.DATABASE_URL) {
  console.error("❌ BRAK DATABASE_URL");
}

/* ================== ŚCIEŻKA UPLOAD ================== */
const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/* ================== MULTER ================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const safeName =
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g, "_");

    cb(null, safeName);
  }
});

const upload = multer({ storage });

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

app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadPath));

/* ================== INIT DATABASE ================== */
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_projects (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        main_file TEXT,
        main_file_url TEXT,
        extra_files JSONB,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Database ready");

  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    setTimeout(initDatabase, 5000);
  }
}

initDatabase();

/* ================== ROUTES ================== */

app.get("/ping", (req, res) => {
  res.send("OK");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/admin/orders", async (req, res) => {

  const token = req.headers["x-admin-token"];

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Brak dostępu" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Admin orders error:", err);
    res.status(500).json({ error: "Błąd pobierania zamówień" });
  }
});
/* ===== NEWSLETTER ===== */
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      error: "Nieprawidłowy email"
    });
  }

  try {
    await pool.query(
      `INSERT INTO newsletter (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Newsletter error:", err.message);
    res.status(500).json({
      error: "Błąd zapisu"
    });
  }
});

/* ===== CUSTOM PROJECT UPLOAD ===== */
app.post(
  "/project-upload",
  upload.fields([
    { name: "mainFile", maxCount: 1 },
    { name: "extraFiles", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const { description } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({
          error: "Brak opisu projektu"
        });
      }

      const mainFileData = req.files?.mainFile?.[0] || null;

      const mainFile = mainFileData?.filename || null;

      const mainFileUrl = mainFileData
        ? `${process.env.DOMAIN}/uploads/${mainFileData.filename}`
        : null;

      const extraFiles = req.files?.extraFiles
        ? req.files.extraFiles.map(file => ({
            filename: file.filename,
            url: `${process.env.DOMAIN}/uploads/${file.filename}`
          }))
        : [];

      // ✅ JEDEN INSERT
      const result = await pool.query(
        `INSERT INTO custom_projects
        (description, main_file, main_file_url, extra_files)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id`,
        [
          description.trim(),
          mainFile,
          mainFileUrl,
          JSON.stringify(extraFiles)
        ]
      );

      const projectId = result.rows[0].id;

      res.json({
        success: true,
        projectId,
        uploaded: {
          mainFile,
          mainFileUrl
        }
      });

    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({
        error: "Błąd wysyłania plików"
      });
    }
  }
);
/* ===== STRIPE WEBHOOK ===== */
app.post("/webhook", async (req, res) => {
  let event;

  try {
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {

    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      const orderId = session.metadata.order_id;

      await pool.query(
        `UPDATE orders
         SET status = 'paid'
         WHERE id = $1`,
        [orderId]
      );

      console.log("✅ Order paid:", orderId);
    }

    res.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook DB error:", err);
    res.status(500).send("Server error");
  }
});
/* ===== CHECKOUT ===== */
app.post("/checkout", async (req, res) => {
  try {
    const { customer, cart, projectId } = req.body;

    if (!customer || !cart || cart.length === 0) {
      return res.status(400).json({
        error: "Nieprawidłowe dane"
      });
    }

    // 🔥 LICZENIE SUMY
    const total = cart.reduce((sum, item) =>
      sum + item.price * item.quantity, 0
    );

    const orderResult = await pool.query(
  `INSERT INTO orders
  (email, name, phone, address, cart, status, total, project_id)
  VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)
  RETURNING id`,
  [
    customer.email,
    customer.name,
    customer.phone,
    JSON.stringify(customer.address),
    JSON.stringify(cart),
    'pending',
    total,
    projectId || null
  ]
);

    const orderId = orderResult.rows[0].id;

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

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,

        success_url:
          `${process.env.DOMAIN}/success.html`,

        cancel_url:
          `${process.env.DOMAIN}/cancel.html`,

        metadata: {
          order_id: orderId
        }
      });

    res.json({
      url: session.url
    });

  } catch (err) {
    console.error("❌ Checkout error:", err);

    res.status(500).json({
      error: "Błąd płatności"
    });
  }
});

/* ================== START ================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server listening on port", PORT);
});

/* ================== SHUTDOWN ================== */
process.on("SIGTERM", () => {
  console.log(
    "⚠️ SIGTERM from Railway (normal shutdown)"
  );
});