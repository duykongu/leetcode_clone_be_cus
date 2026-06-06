const { discussionRepository } = require("../repositories");
const { HTTP_STATUS } = require("../constants");

class DiscussionService {
  async getDiscussions(page = 1, limit = 20, filters = {}) {
    const result = await discussionRepository.getDiscussionsList(page, limit, filters);
    return { success: true, ...result };
  }

  async getDiscussionDetail(id) {
    const discussion = await discussionRepository.getDiscussionDetail(id);
    if (!discussion) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Bài viết không tồn tại!" };
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

  async addComment(userId, discussionId, data) {
    if (!data.content) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Nội dung bình luận không được rỗng." };
    }

    // Kiểm tra xem bài viết có tồn tại không
    const discuss = await discussionRepository.getDiscussionDetail(discussionId);
    if (!discuss) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Bài viết không tồn tại!" };
    }

    const newComment = await discussionRepository.createComment({
      content: data.content,
      userId: userId,
      discussionId: discussionId,
      parentId: data.parentId || null
    });

    return { success: true, message: "Bình luận thành công!", data: newComment };
  }
}

module.exports = DiscussionService;