require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("OK 🚀 App działa");
});

app.get("/ping", (req, res) => {
  res.send("Server działa! 🚀");
});

app.listen(PORT, () => {
  console.log(`Server działa! 🚀 na porcie ${PORT}`);
});
