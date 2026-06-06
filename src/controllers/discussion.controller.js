const { HTTP_STATUS } = require('../constants');
const { getPagination } = require('../utils/pagination');

class DiscussionController {
  constructor({ discussionService }) {
    this.discussionService = discussionService;
  }

  getDiscussions = async (req, res) => {
    try {
      const { page, limit } = getPagination(req.query, 20);
      const filters = {
        problemId: req.query.problemId,
        search: req.query.search
      };
      
      const result = await this.discussionService.getDiscussions(page, limit, filters);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  getDiscussionDetail = async (req, res) => {
    try {
      const result = await this.discussionService.getDiscussionDetail(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  createDiscussion = async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await this.discussionService.createDiscussion(userId, req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  addComment = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params; // discussionId
      const result = await this.discussionService.addComment(userId, id, req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}

module.exports = DiscussionController;