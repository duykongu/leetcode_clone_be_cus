const { getPagination } = require('../utils/pagination');

class ProblemsController {
  constructor({ problemService }) {
    this.problemService = problemService;
  }

  getStats = async (req, res) => {
    try {
      const stats = await this.problemService.getStats();
      res.json(stats);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Error",
      });
    }
  }

  getProblems = async (req, res) => {
    try {
      const { page, limit } = getPagination(req.query, 50);
      const user = req.user;
      const filters = {
        search: req.query.search,
        category: req.query.category,
        difficulty: req.query.difficulty,
      };

      const result = await this.problemService.getProblems(page, limit, user, filters);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  getProblemDetail = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Get userId if authenticated
      const result = await this.problemService.getProblemDetail(id, userId);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
        ...(err.code && { code: err.code }),
      });
    }
  }

  importProblem = async (req, res) => {
    try {
      const problemData = req.body;
      const result = await this.problemService.importProblem(problemData);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
      });
    }
  }

  getRandomProblem = async (req, res) => {
    try {
      const userId = req.user?.id; // Lấy userId nếu có đăng nhập
      const result = await this.problemService.getRandomProblem(userId);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error',
      });
    }
  }
}

module.exports = ProblemsController;
