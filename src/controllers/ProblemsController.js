const problemService = require('../services/problemService');

class ProblemsController {
  async getProblems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await problemService.getProblems(page, limit);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }
}

module.exports = new ProblemsController();
