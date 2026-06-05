const { HTTP_STATUS } = require('../constants');

class ExecutionController {
  constructor({ executionService }) {
    this.executionService = executionService;
  }

  runCode = async (req, res) => {
    try {
      // 1. Nhận problemId từ request
      const { code, language, problemId, isSubmit } = req.body;
      
      // Lấy userId nếu request đã đi qua Auth Middleware (user đã login)
      const userId = req.user ? req.user.id : null;
      
      if (!code || !language || !problemId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Thiếu code, language hoặc problemId!"
        });
      }

      // 2. Truyền toàn bộ xuống Service
      const result = await this.executionService.runCode({ code, language, problemId, userId, isSubmit });
      
      res.json(result);
      
    } catch (err) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server khi chạy code'
      });
    }
  }
}

module.exports = ExecutionController;