const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const adminMiddleware = require('../middleware/admin.middleware');

router.use(adminMiddleware);

router.get('/', statisticsController.getStatistics);

module.exports = router; 