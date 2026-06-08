const { discussionRepository } = require("../repositories");
const { HTTP_STATUS } = require("../constants");

class DiscussionService {
  async getDiscussions(page = 1, limit = 20, filters = {}, userId = null) {
    const result = await discussionRepository.getDiscussionsList(page, limit, filters, userId);
    return { success: true, ...result };
  }

  async getDiscussionDetail(id, userId = null) {
    const discussion = await discussionRepository.getDiscussionDetail(id, userId);
    if (!discussion) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Bài viết không tồn tại hoặc đã bị xóa!" };
    }
    return { success: true, data: discussion };
  }

  async createDiscussion(userId, data) {
    if (!data.title || !data.content) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Tiêu đề và nội dung không được để trống." };
    }

    const newDiscuss = await discussionRepository.prisma.discussion.create({ 
      data: {
        title: data.title,
        content: data.content,
        userId: userId,
        problemId: data.problemId === "general" ? null : data.problemId,
        tags: data.tags ? JSON.stringify(data.tags) : null
      }
    });

    return { success: true, message: "Đăng bài thành công!", data: newDiscuss };
  }
// --- HÀM GỬI BÌNH LUẬN
  async addComment(user, discussionId, content, parentId = null) {
    if (!content || !content.trim()) throw { statusCode: 400, message: "Nội dung bình luận không được rỗng" };
    
    // Chỉ kiểm tra nhẹ xem bài viết có tồn tại không, KHÔNG gọi hàm getDetail nặng nề
    const discuss = await discussionRepository.prisma.discussion.findUnique({
      where: { id: discussionId }, select: { id: true }
    });
    if (!discuss) throw { statusCode: 404, message: "Bài viết không tồn tại" };

    const comment = await discussionRepository.addComment(discussionId, user.id, content, parentId);
    return { success: true, message: "Đã gửi bình luận", data: comment };
  }

async interact(userId, discussionId, action) {
    if (!['upvote', 'downvote', 'save'].includes(action)) throw { statusCode: 400, message: "Hành động không hợp lệ" };
    
    await discussionRepository.toggleInteraction(userId, discussionId, action);
    return { success: true, message: "Thao tác thành công" };
  }

  async deleteDiscussion(user, discussionId) {
    const discuss = await discussionRepository.getDiscussionDetail(discussionId);
    if (!discuss) throw { statusCode: 404, message: "Không tìm thấy bài viết" };
    
    // BẢO MẬT: Chỉ tác giả hoặc Admin mới được xóa
    if (discuss.userId !== user.id && user.role !== 'admin') {
      throw { statusCode: 403, message: "Bạn không có quyền xóa bài viết này!" };
    }
    
    await discussionRepository.softDelete(discussionId);
    return { success: true, message: "Đã xóa bài viết" };
  }

  async togglePin(user, discussionId) {
    // BẢO MẬT: Chỉ Admin mới được ghim
    if (user.role !== 'admin') throw { statusCode: 403, message: "Chỉ Quản trị viên mới được ghim bài!" };
    
    const discuss = await discussionRepository.getDiscussionDetail(discussionId);
    if (!discuss) throw { statusCode: 404, message: "Không tìm thấy bài viết" };
    
    await discussionRepository.togglePin(discussionId, discuss.isPinned);
    return { success: true, message: discuss.isPinned ? "Đã gỡ ghim" : "Đã ghim bài viết lên đầu" };
  }

  async updateDiscussion(user, discussionId, data) {
    const discuss = await discussionRepository.getDiscussionDetail(discussionId);
    if (!discuss) throw { statusCode: 404, message: "Không tìm thấy bài viết" };
    
    // BẢO MẬT: Chỉ tác giả mới được sửa bài của mình
    if (discuss.userId !== user.id) {
      throw { statusCode: 403, message: "Bạn không có quyền sửa bài viết này!" };
    }
    if (!data.title || !data.content) {
      throw { statusCode: 400, message: "Tiêu đề và nội dung không được rỗng." };
    }

    const updateData = {
      title: data.title,
      content: data.content,
      tags: data.tags ? JSON.stringify(data.tags) : discuss.tags
    };

    const updated = await discussionRepository.updateDiscussion(discussionId, updateData);
    return { success: true, message: "Cập nhật thành công", data: updated };
  }
 // --- HÀM XÓA BÌNH LUẬN ---
async deleteComment(user, discussionId, commentId) {
    const comment = await discussionRepository.getCommentById(commentId);
    if (!comment) throw { statusCode: 404, message: "Bình luận không tồn tại" };

    const discuss = await discussionRepository.prisma.discussion.findUnique({
      where: { id: discussionId }, select: { userId: true }
    });
    if (!discuss) throw { statusCode: 404, message: "Bài viết không tồn tại" };

    // BẢO MẬT: Chỉ chủ bình luận, chủ bài viết, hoặc admin mới được xóa
    if (comment.userId !== user.id && discuss.userId !== user.id && user.role !== 'admin') {
      throw { statusCode: 403, message: "Bạn không có quyền xóa bình luận này!" };
    }

    // Gọi xuống Repo để dọn dẹp
    await discussionRepository.deleteComment(commentId);
    return { success: true, message: "Đã xóa bình luận" };
  }

  //HÀM SỬA BÌNH LUẬN
  async updateComment(user, commentId, content) {
    if (!content || !content.trim()) throw { statusCode: 400, message: "Nội dung không được rỗng" };
    const comment = await discussionRepository.getCommentById(commentId);
    if (!comment) throw { statusCode: 404, message: "Bình luận không tồn tại" };

    // Chỉ chủ nhân bình luận mới được sửa lời của mình
    if (comment.userId !== user.id) throw { statusCode: 403, message: "Chỉ người viết mới được sửa bình luận" };

    await discussionRepository.updateComment(commentId, content);
    return { success: true, message: "Đã sửa bình luận" };
  }

  //HÀM GHIM BÌNH LUẬN
  async togglePinComment(user, discussionId, commentId) {
    const discuss = await discussionRepository.getDiscussionDetail(discussionId);
    const comment = await discussionRepository.getCommentById(commentId);
    if (!comment || !discuss) throw { statusCode: 404, message: "Dữ liệu không tồn tại" };

    // Chỉ Chủ bài viết mới được ghim bình luận trong nhà của mình
    if (discuss.userId !== user.id) throw { statusCode: 403, message: "Chỉ tác giả bài viết mới được ghim bình luận!" };

    await discussionRepository.togglePinComment(commentId, comment.isPinned);
    return { success: true, message: comment.isPinned ? "Đã gỡ ghim" : "Đã ghim bình luận" };
  }
  async interactComment(userId, commentId, action) {
    if (!['upvote', 'downvote'].includes(action)) throw { statusCode: 400, message: "Hành động không hợp lệ" };
    await discussionRepository.toggleCommentInteraction(userId, commentId, action);
    return { success: true, message: "Thao tác thành công" };
  }
}

module.exports = DiscussionService;