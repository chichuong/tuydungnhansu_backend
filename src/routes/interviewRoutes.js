// server/src/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect, isRecruiter, isCandidate } = require('../middleware/authMiddleware');

router.post('/schedule', protect, isRecruiter, interviewController.scheduleInterview);

// Route mới cho ứng viên phản hồi
router.put('/:interviewId/status', protect, isCandidate, interviewController.updateInterviewStatus);

module.exports = router;