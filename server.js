const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
const db = require("./models");

// Sync database
db.sequelize.sync({ force: true })
  .then(() => {
    console.log("Drop and re-sync db.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

// Routes
require("./routes/product.routes")(app);

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Welcome to phone shop application." });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}.`);
});