/**
 * FILE: src/routes/scraper.routes.js
 */

const express = require('express');
const router = express.Router();
const ScraperController = require('../controllers/scraper.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../constants/permissions');

const scraperController = new ScraperController();

// Tất cả routes đều yêu cầu MANAGE_PROBLEMS (Admin only)
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requirePermission(PERMISSIONS.MANAGE_PROBLEMS));

router.post('/start', scraperController.startScrape);
router.post('/stop', scraperController.stopScrape);
router.get('/status', scraperController.getStatus);

// SSE endpoint — không dùng requirePermission middleware ở đây vì SSE cần headers
// đặc biệt, nên authenticate riêng trong controller nếu cần.
// Hoặc giữ nguyên router.use ở trên, Express middleware vẫn chạy trước.
router.get('/progress', scraperController.streamProgress);

module.exports = router;
