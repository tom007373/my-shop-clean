require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT;

if (!PORT) {
  console.error("❌ Brak PORT z Railway");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server działa! 🚀 na porcie ${PORT}`);
});

