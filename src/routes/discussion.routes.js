const express = require('express');
const router = express.Router();
const { discussionController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');

// Public: Xem danh sách và chi tiết bài viết (Không cần đăng nhập vẫn xem được)
router.get('/', discussionController.getDiscussions);
router.get('/:id', discussionController.getDiscussionDetail);

// Protected: Đăng bài mới và Bình luận (Bắt buộc đăng nhập)
router.post('/', authMiddleware.authenticate, discussionController.createDiscussion);
router.post('/:id/comments', authMiddleware.authenticate, discussionController.addComment);

module.exports = router;