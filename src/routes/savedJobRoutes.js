// server/src/routes/savedJobRoutes.js
const express = require('express');
const router = express.Router();
const savedJobController = require('../controllers/savedJobController');
const { protect, isCandidate } = require('../middleware/authMiddleware');

// Các route này đều cần đăng nhập và là ứng viên
router.use(protect, isCandidate);

router.route('/')
    .get(savedJobController.getSavedJobs);

router.route('/:jobId')
    .post(savedJobController.saveJob)
    .delete(savedJobController.unsaveJob);

module.exports = router;