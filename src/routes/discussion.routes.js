const express = require('express');
const router = express.Router();
const { discussionController } = require('../container');
const authMiddleware = require('../middleware/auth.middleware');

// Public: Xem danh sách và chi tiết bài viết (Không cần đăng nhập vẫn xem được)
router.get('/', authMiddleware.optionalAuth, discussionController.getDiscussions);
router.get('/:id', authMiddleware.optionalAuth, discussionController.getDiscussionDetail);

// Protected: Đăng bài mới và Bình luận (Bắt buộc đăng nhập)
router.post('/', authMiddleware.authenticate, discussionController.createDiscussion);
router.post('/:id/comments', authMiddleware.authenticate, discussionController.addComment);
router.put('/:id', authMiddleware.authenticate, discussionController.updateDiscussion);

// Các thao tác Tương tác & Kiểm duyệt
router.post('/:id/interact', authMiddleware.authenticate, discussionController.interact);
router.delete('/:id', authMiddleware.authenticate, discussionController.deleteDiscussion);
router.put('/:id/pin', authMiddleware.authenticate, discussionController.togglePin);

router.put('/:id/comments/:commentId', authMiddleware.authenticate, discussionController.updateComment);
router.put('/:id/comments/:commentId/pin', authMiddleware.authenticate, discussionController.togglePinComment);
router.post('/:id/comments/:commentId/interact', authMiddleware.authenticate, discussionController.interactComment);
module.exports = router;