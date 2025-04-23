const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const adminMiddleware = require('../middleware/admin.middleware');

// Áp dụng middleware xác thực admin cho tất cả các route
router.use(adminMiddleware);

// Lấy thống kê tổng quan
router.get('/', statisticsController.getStatistics);

module.exports = router; 