const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Register new user (public)
router.post('/register', authController.register);

// Login user (public)
router.post('/login', authController.login);

// Refresh access token (public - requires refresh token in body)
router.post('/refresh-token', authController.refreshToken);

// Get current user profile (requires auth)
router.get('/me', authMiddleware.authenticate, authController.me);

// Logout (requires auth)
router.post('/logout', authMiddleware.authenticate, authController.logout);

module.exports = router;
