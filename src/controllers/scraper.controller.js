/**
 * FILE: src/controllers/scraper.controller.js
 */
 
const { runBatchScrape, getJobStatus, stopJob, scraperEmitter } = require('../services/scraper.service');
 
// Các chế độ quét hợp lệ mà FE gửi lên
const VALID_MODES = ['all', 'solutions_only'];
 
class ScraperController {
 
  /**
   * API: POST /admin/scraper/start
   * Kích hoạt tiến trình cào dữ liệu ngầm
   */
  startScrape = async (req, res) => {
    try {
      let { limit, mode } = req.body;
 
      // Chuẩn hóa tham số limit đầu vào
      limit = parseInt(limit, 10);
      if (isNaN(limit) || limit < 1) limit = 100;
      if (limit > 3000) limit = 3000; // Khớp giới hạn MAX_LIMIT của service
 
      // Chuẩn hóa chế độ quét mode đầu vào
      if (!mode || !VALID_MODES.includes(mode)) mode = 'all';
 
      // Gọi xuống tầng Service truyền chính xác limit và mode
      const result = await runBatchScrape({ 
        limit, 
        mode, 
        categories: ['algorithms'] 
      });
 
      if (!result.success) {
        return res.status(409).json({ success: false, message: result.message });
      }
 
      return res.json({ success: true, jobId: result.jobId, message: 'Khởi chạy tác vụ thành công.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
 
  /**
   * API: POST /admin/scraper/stop
   * Gửi yêu cầu dừng tiến trình
   */
  stopScrape = (req, res) => {
    stopJob();
    return res.json({ success: true, message: 'Đã gửi yêu cầu dừng.' });
  };
 
  /**
   * API: GET /admin/scraper/status
   * Lấy trạng thái hiện tại của Job
   */
  getStatus = (req, res) => {
    return res.json({ success: true, data: getJobStatus() });
  };
 
  /**
   * API: GET /admin/scraper/progress (SSE Endpoint)
   * Duy trì luồng sự kiện thời gian thực
   */
  streamProgress = (req, res) => {
    // ⚡ THIẾT LẬP CÁC HEADER ĐẶC THÙ ĐỂ FIX LỖI "SSE connection error"
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform'); // Chống các Proxy/Nginx tự gom nén cache dữ liệu
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Ép Nginx đẩy dữ liệu real-time lập tức không buffer
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Hỗ trợ CORS nếu FE/BE chạy khác Port
 
    if (res.socket) {
      res.socket.setKeepAlive(true);
      res.socket.setTimeout(0);
    }
    res.flushHeaders();
 
    // Hàm tiện ích format đúng chuẩn giao thức SSE: event + data
    const sendEvent = (event, data) => {
      try {
        const payload = (data !== undefined && data !== null) ? JSON.stringify(data) : '{}';
        res.write(`event: ${event}\ndata: ${payload}\n\n`);
      } catch (err) {
        // Tránh crash ứng dụng nếu có lỗi phát sinh trong lúc write dữ liệu
      }
    };
 
    // Lấy trạng thái công việc hiện tại để trả về sự kiện connected ban đầu
    const currentStatus = getJobStatus();
    sendEvent('connected', { message: 'SSE Connection Established', status: currentStatus });
 
    // Gửi bù lại tối đa 40 dòng log cũ nằm trong bộ nhớ đệm nếu FE bị ngắt quãng kết nối giữa chừng
    if (currentStatus.running && currentStatus.log) {
      currentStatus.log.slice(-40).forEach((entry) => {
        // Nếu là sự kiện lỗi cũ, ánh xạ nó thành sự kiện 'log' để FE in ra màn hình text màu đỏ mượt mà
        if (entry.event === 'error') {
          sendEvent('log', { message: `❌ Lỗi: ${entry.data?.message || 'Không xác định'}` });
        } else {
          sendEvent(entry.event, entry.data);
        }
      });
    }
 
    // ─── ĐĂNG KÝ CÁC TRÌNH LẮNG NGHE SỰ KIỆN TỪ SERVICE ──────────────────
    const handleStart    = (data) => sendEvent('start', data);
    const handleLog      = (data) => sendEvent('log', data);
    const handleProgress = (data) => sendEvent('progress', data);
    const handleDone     = (data) => sendEvent('done', data);
    
    /**
     * 🔥 GIẢI PHÁP SỬA LỖI ĐỨT KẾT NỐI SSE:
     * Biến đổi sự kiện 'error' của hệ thống BE thành sự kiện dạng 'log' gửi cho FE.
     * Điều này giúp hiển thị dòng chữ lỗi màu đỏ trên console của FE mà không làm sập kết nối EventSource mạng.
     */
    const handleError = (data) => {
      sendEvent('log', { message: `❌ Hệ thống: ${data?.message || 'Gặp sự cố xử lý ngầm'}` });
    };
 
    // Đăng ký toàn bộ listener vào bộ phát sự kiện của Service
    scraperEmitter.on('start',    handleStart);
    scraperEmitter.on('log',      handleLog);
    scraperEmitter.on('progress', handleProgress);
    scraperEmitter.on('done',     handleDone);
    scraperEmitter.on('error',    handleError);
 
    // Phát tín hiệu định kỳ rỗng (Heartbeat) sau mỗi 15 giây để giữ đường dẫn mạng tránh bị timeout tự động
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch (_) {}
    }, 15000);
 
    // Giải phóng bộ nhớ toàn cục khi Admin đóng tab trình duyệt hoặc luồng kết nối bị Client chủ động hủy
    req.on('close', () => {
      clearInterval(heartbeat);
      scraperEmitter.off('start',    handleStart);
      scraperEmitter.off('log',      handleLog);
      scraperEmitter.off('progress', handleProgress);
      scraperEmitter.off('done',     handleDone);
      scraperEmitter.off('error',    handleError);
    });
  };
}
 
module.exports = ScraperController;