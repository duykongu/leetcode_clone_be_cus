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
        search: req.query.search,
        sortBy: req.query.sortBy, // 'hot' hoặc 'new'
        isSaved: req.query.isSaved === 'true', // Tab đã lưu
        pinPriority: req.query.pinPriority // Ưu tiên ghim
      };
      
      const userId = req.user?.id; // Lấy ID người dùng nếu có đăng nhập
      const result = await this.discussionService.getDiscussions(page, limit, filters, userId);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  getDiscussionDetail = async (req, res) => {
    try {
      const userId = req.user?.id; // Lấy ID nếu có đăng nhập
      const result = await this.discussionService.getDiscussionDetail(req.params.id, userId);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  interact = async (req, res) => {
    try {
      const result = await this.discussionService.interact(req.user.id, req.params.id, req.body.action);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  deleteDiscussion = async (req, res) => {
    try {
      const result = await this.discussionService.deleteDiscussion(req.user, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  togglePin = async (req, res) => {
    try {
      const result = await this.discussionService.togglePin(req.user, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
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
      //Truyền đúng req.user (object), ID bài viết, Nội dung, và ID bình luận cha
      const result = await this.discussionService.addComment(
        req.user, 
        req.params.id, 
        req.body.content, 
        req.body.parentId
      );
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  updateDiscussion = async (req, res) => {
    try {
      const result = await this.discussionService.updateDiscussion(req.user, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
  deleteComment = async (req, res) => {
    try { 
      // Kiểm tra xem 2 cái này có undefined không?
      console.log("Discussion ID:", req.params.id); 
      console.log("Comment ID:", req.params.commentId);
      
      const result = await this.discussionService.deleteComment(req.user, req.params.id, req.params.commentId);
      res.json(result);
    } catch (err) { 
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  updateComment = async (req, res) => {
    try {
      const result = await this.discussionService.updateComment(req.user, req.params.commentId, req.body.content);
      res.json(result);
    } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
  }

  togglePinComment = async (req, res) => {
    try {
      const result = await this.discussionService.togglePinComment(req.user, req.params.id, req.params.commentId);
      res.json(result);
    } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
  }
  interactComment = async (req, res) => {
    try {
      const result = await this.discussionService.interactComment(req.user.id, req.params.commentId, req.body.action);
      res.json(result);
    } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
  }
}

module.exports = DiscussionController;