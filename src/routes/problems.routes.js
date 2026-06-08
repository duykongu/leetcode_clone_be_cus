const express = require('express');
const router = express.Router();
const { problemsController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../constants/permissions');

// Public routes
router.get('/', authMiddleware.optionalAuth, problemsController.getProblems);
router.get('/random', authMiddleware.optionalAuth, problemsController.getRandomProblem);
router.get('/:id', authMiddleware.optionalAuth, problemsController.getProblemDetail);

// Admin only routes
router.get('/admin/stats', authMiddleware.authenticate, authMiddleware.requirePermission(PERMISSIONS.VIEW_ADMIN_STATS), problemsController.getStats);
router.post('/import', authMiddleware.authenticate, authMiddleware.requirePermission(PERMISSIONS.MANAGE_PROBLEMS), problemsController.importProblem);

module.exports = router;
