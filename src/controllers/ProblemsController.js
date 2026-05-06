const problemService = require('../services/problemService');

class ProblemsController {
  async getProblems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const userId = req.user?.id;
      
      const filters = {
        search: req.query.search,
        category: req.query.category,
        difficulty: req.query.difficulty,
      };

      const result = await problemService.getProblems(page, limit, userId, filters);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  async getProblemDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Get userId if authenticated
      const result = await problemService.getProblemDetail(id, userId);
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
