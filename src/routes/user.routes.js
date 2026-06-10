const express = require('express');
const router = express.Router();
const { userController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../constants/permissions');
const upload = require('../middleware/upload');

// Protected routes (User + Admin)
router.get('/me', authMiddleware.authenticate, userController.me);
router.put('/me', authMiddleware.authenticate, userController.updateProfile);
router.post('/me/avatar', authMiddleware.authenticate, upload.single('avatar'), userController.uploadAvatar);
router.get('/me/saved', authMiddleware.authenticate, userController.getSavedProblems);
router.post('/me/saved/:problemId', authMiddleware.authenticate, userController.toggleSaveProblem);
router.get('/me/submissions', authMiddleware.authenticate, userController.getSubmissions);
router.get('/me/submissions/:submissionId', authMiddleware.authenticate, userController.getSubmissionDetail);
router.get('/me/discussions', authMiddleware.authenticate, userController.getUserDiscussions);

// Admin only routes
router.get('/admin/users', authMiddleware.authenticate, authMiddleware.requirePermission(PERMISSIONS.VIEW_USERS), userController.getUsers);

module.exports = router;
