const express = require('express');
const router = express.Router();
const { userController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../constants/permissions');

// Protected routes (User + Admin)
router.get('/me', authMiddleware.authenticate, userController.me);

// Admin only routes
router.get('/admin/users', authMiddleware.authenticate, authMiddleware.requirePermission(PERMISSIONS.VIEW_USERS), userController.getUsers);

module.exports = router;
