const express = require("express");
const cors = require("cors");
const db = require("./models");

const app = express();

// CORS configuration
app.use(cors());

// Parse requests of content-type - application/json
app.use(express.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Routes
const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);

// Sync database
db.sequelize.sync()
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

// Set port and listen for requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});