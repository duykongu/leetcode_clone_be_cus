/**
 * FILE: src/controllers/scraper.controller.js
 *
 * Controller cho Admin Scraper Tool.
 * Cung cấp SSE endpoint để stream progress real-time.
 */

const { HTTP_STATUS } = require('../constants');
const { runBatchScrape, getJobStatus, stopJob, scraperEmitter } = require('../services/scraper.service');

const VALID_CATEGORIES = ['algorithms', 'database', 'javascript', 'pandas', 'shell'];

class ScraperController {
  /**
   * POST /api/admin/scraper/start
   * Body: { limit: number, categories: string[] }
   */
  startScrape = async (req, res) => {
    try {
      let { limit, categories } = req.body;

      // Chuẩn hóa và Validate limit (Cho phép limit = 0 để kích hoạt Siêu Cào Toàn Bộ)
      limit = parseInt(limit);
      if (isNaN(limit) || limit < 0) limit = 10; 
      if (limit > 500) limit = 500;

      // Validate danh sách categories truyền lên từ UI
      if (!Array.isArray(categories) || categories.length === 0) {
        categories = ['algorithms'];
      }
      categories = categories.filter((c) => VALID_CATEGORIES.includes(c));
      if (categories.length === 0) categories = ['algorithms'];

      // Nếu người dùng chọn cào toàn bộ (limit === 0), truyền toàn bộ mảng VALID_CATEGORIES để manager quét sạch
      const finalCategories = limit === 0 ? VALID_CATEGORIES : categories;

      const result = await runBatchScrape({ limit, categories: finalCategories });

      if (!result.success) {
        return res.status(HTTP_STATUS.CONFLICT).json({ success: false, message: result.message });
      }

      res.json({ 
        success: true, 
        jobId: result.jobId, 
        message: limit === 0 ? 'Chế độ SIÊU CÀO TOÀN BỘ KHO đã khởi động.' : 'Job cào theo lô đã khởi động.' 
      });
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
   * GET /api/admin/scraper/progress (SSE)
   */
  streamProgress = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 
    res.flushHeaders();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const currentStatus = getJobStatus();
    send('connected', { message: 'SSE kết nối thành công', status: currentStatus });

    if (currentStatus.running && currentStatus.log) {
      currentStatus.log.slice(-30).forEach((entry) => {
        send(entry.event, entry.data);
      });
    }

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

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      Object.entries(handlers).forEach(([event, handler]) => {
        scraperEmitter.off(event, handler);
      });
    });
  };
}

module.exports = ScraperController;