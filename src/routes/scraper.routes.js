/**
 * FILE: src/routes/scraper.routes.js
 */

const express = require('express');
const router = express.Router();
const { scraperController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../constants/permissions');

// Tất cả routes đều yêu cầu MANAGE_PROBLEMS (Admin only)
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requirePermission(PERMISSIONS.MANAGE_PROBLEMS));

router.post('/start', scraperController.startScrape);
router.post('/stop', scraperController.stopScrape);
router.get('/status', scraperController.getStatus);

// SSE endpoint — nhận luồng sự kiện real-time từ tiến trình cào bài
router.get('/progress', scraperController.streamProgress);

module.exports = router;