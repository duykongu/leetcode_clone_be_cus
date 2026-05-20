const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Public Admin login (uses the same login logic)
router.post('/admin/login', authController.login);

// Protected auth routes
router.post('/logout', authMiddleware.authenticate, authController.logout);

module.exports = router;
