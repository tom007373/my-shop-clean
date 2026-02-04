require('dotenv').config();

const express = require("express");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Testowy endpoint
app.get("/ping", (req, res) => {
    res.send("Server działa! 🚀");
});

// Endpoint Stripe Checkout
app.post("/checkout", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "pln",
                        product_data: { name: "Test Product" },
                        unit_amount: 1000, // 10 zł
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "http://localhost:3000/success.html",
            cancel_url: "http://localhost:3000/cart.html",
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).send("Błąd Stripe");
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Server działa na porcie ${PORT}`);
});
