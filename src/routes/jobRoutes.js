// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect, isRecruiter } = require('../middleware/authMiddleware');

// Public routes
router.get('/', jobController.getAllJobs);

// Private routes for recruiters
router.get('/my', protect, isRecruiter, jobController.getMyJobs); // <-- Thêm route này
router.post('/', protect, isRecruiter, jobController.createJob);

// Public route, phải đặt sau '/my'
router.get('/:id', jobController.getJobById);

// Private routes for recruiters
router.put('/:id', protect, isRecruiter, jobController.updateJob);
router.delete('/:id', protect, isRecruiter, jobController.deleteJob);

module.exports = router;