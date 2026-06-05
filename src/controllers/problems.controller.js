const { getPagination } = require('../utils/pagination');
const { HTTP_STATUS } = require('../constants');

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

  updateProblem = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (data.difficulty !== undefined && ![0, 1, 2].includes(data.difficulty)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Validation error: difficulty must be 0, 1, or 2',
        });
      }

      const result = await this.problemService.updateProblem(id, data);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message || 'Error',
      });
    }
  }

  deleteProblem = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.problemService.deleteProblem(id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message || 'Error',
      });
    }
  }
}

module.exports = ProblemsController;
