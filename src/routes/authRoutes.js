// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Định nghĩa các route
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;