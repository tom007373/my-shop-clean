require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

/* Railway / lokalnie */
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server działa na porcie", PORT);
});
