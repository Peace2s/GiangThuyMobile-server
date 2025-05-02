require('dotenv').config();
const express = require("express");
const cors = require("cors");
const db = require("./models");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// CORS configuration
app.use(cors());

// Parse requests of content-type - application/json
app.use(express.json());

// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinOrderRoom', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Client joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const productVariantRoutes = require('./routes/productVariant.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/variants', productVariantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

// Sync database
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.log("Failed to sync database: " + err.message);
  });

// Set port and listen for requests
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});