/**
 * FILE: src/controllers/scraper.controller.js
 *
 * Controller cho Admin Scraper Tool.
 * Cung cấp SSE endpoint để stream progress real-time.
 */

const { HTTP_STATUS } = require('../constants');
const { runBatchScrape, getJobStatus, stopJob, scraperEmitter } = require('../services/scraper.service');

// SỬA TẠI ĐÂY: Chỉ giữ lại 2 danh mục hợp lệ đồng bộ với FE
const VALID_CATEGORIES = ['algorithms', 'javascript'];

class ScraperController {
  /**
   * POST /api/admin/scraper/start
   * Body: { limit: number, categories: string[] }
   */
  startScrape = async (req, res) => {
    try {
      let { limit, categories } = req.body;

      // Validate limit
      limit = parseInt(limit);
      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 500) limit = 500;

      // Validate categories
      if (!Array.isArray(categories) || categories.length === 0) {
        categories = ['algorithms', 'javascript']; // Mặc định chọn cả hai danh mục mới
      }
      categories = categories.filter((c) => VALID_CATEGORIES.includes(c));
      if (categories.length === 0) categories = ['algorithms', 'javascript'];

      const result = await runBatchScrape({ limit, categories });

      if (!result.success) {
        return res.status(HTTP_STATUS.CONFLICT).json({ success: false, message: result.message });
      }

      res.json({ success: true, jobId: result.jobId, message: 'Job cào đã được khởi động.' });
    } catch (err) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  /**
   * POST /api/admin/scraper/stop
   */
  stopScrape = (req, res) => {
    stopJob();
    res.json({ success: true, message: 'Đã gửi lệnh dừng. Job sẽ dừng sau bài hiện tại.' });
  };

  /**
   * GET /api/admin/scraper/status
   */
  getStatus = (req, res) => {
    res.json({ success: true, data: getJobStatus() });
  };

  /**
   * GET /api/admin/scraper/progress  (SSE)
   */
  streamProgress = (req, res) => {
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Tắt buffering cho Nginx
    res.flushHeaders();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Gửi trạng thái hiện tại ngay khi connect
    const currentStatus = getJobStatus();
    send('connected', { message: 'SSE kết nối thành công', status: currentStatus });

    // Nếu có job đang chạy, gửi lại lịch sử log gần nhất
    if (currentStatus.running && currentStatus.log) {
      currentStatus.log.slice(-30).forEach((entry) => {
        send(entry.event, entry.data);
      });
    }

    // Subscribe vào emitter
    const handlers = {
      start: (data) => send('start', data),
      log: (data) => send('log', data),
      progress: (data) => send('progress', data),
      error: (data) => send('error', data),
      done: (data) => send('done', data),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      scraperEmitter.on(event, handler);
    });

    // Heartbeat mỗi 25 giây để giữ connection
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    // Cleanup khi client ngắt kết nối
    req.on('close', () => {
      clearInterval(heartbeat);
      Object.entries(handlers).forEach(([event, handler]) => {
        scraperEmitter.off(event, handler);
      });
    });
  };
}

module.exports = ScraperController;