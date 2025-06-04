const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(adminMiddleware);

router.get('/', statisticsController.getStatistics);
router.get('/monthly-revenue', statisticsController.getMonthlyRevenue);
router.get('/revenue-by-date-range', statisticsController.getRevenueByDateRange);

module.exports = router; 