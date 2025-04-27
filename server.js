const express = require("express");
const cors = require("cors");
const db = require("./models");
const path = require("path");

const app = express();

// CORS configuration
app.use(cors());

// Parse requests of content-type - application/json
app.use(express.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const productVariantRoutes = require('./routes/productVariant.routes');
const userRoutes = require('./routes/user.routes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/variants', productVariantRoutes);
app.use('/api/users', userRoutes);

// Sync database
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

// Set port and listen for requests
const PORT = process.env.MYSQLPORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});