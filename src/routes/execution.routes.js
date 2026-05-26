const express = require('express');
const router = express.Router();
const { executionController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');

// Thêm authMiddleware.optionalAuth 
router.post('/run', authMiddleware.optionalAuth, executionController.runCode);

module.exports = router;