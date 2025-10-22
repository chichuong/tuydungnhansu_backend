// server/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Tất cả các route trong đây đều yêu cầu đăng nhập và là admin
router.use(protect, isAdmin);

router.get('/stats', adminController.getSystemStats);


router.get('/users', adminController.getAllUsers);

router.get('/companies', adminController.getAllCompanies);

router.get('/jobs', adminController.getAllJobs);

router.get('/applications', adminController.getAllApplications);

module.exports = router;