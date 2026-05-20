const problemService = require('../services/problem.service');

class ProblemsController {
  async getStats(req, res) {
    try {
      const stats = await problemService.getStats();
      res.json(stats);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Error",
      });
    }
  }

  async getProblems(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const user = req.user;
      const filters = {
        search: req.query.search,
        category: req.query.category,
        difficulty: req.query.difficulty,
      };

      const result = await problemService.getProblems(page, limit, user, filters);
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

  async importProblem(req, res) {
    try {
      const problemData = req.body;
      const result = await problemService.importProblem(problemData);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
      });
    }
  }
}


module.exports = new ProblemsController();
