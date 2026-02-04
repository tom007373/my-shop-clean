require("dotenv").config();

const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Test
app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

// Stripe Checkout
app.post("/che
