// server/src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/me')
    .get(userController.getMe)
    .put(userController.updateMe);
    
router.put('/change-password', userController.changePassword);

module.exports = router;