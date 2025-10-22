// server/src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, isRecruiter } = require('../middleware/authMiddleware');

router.get('/statistics', protect, isRecruiter, reportController.getStatistics);

module.exports = router;