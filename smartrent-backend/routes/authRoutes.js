const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

module.exports = router;