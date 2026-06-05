const { announcementRepository } = require("../repositories");
const { HTTP_STATUS } = require("../constants");

class AnnouncementService {
  // Logic lấy bảng tin
  async getHomeAnnouncements() {
    const data = await announcementRepository.getLatestAnnouncements(10);
    return { success: true, data };
  }

  // Logic tạo thông báo (Kiểm tra quyền gắt gao ở đây)
  async createAnnouncement(userId, userRole, data) {
    // 1. Logic kiểm tra quyền
    if (userRole !== 'admin') {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: "Chỉ Admin mới có quyền đăng thông báo!" };
    }

    // 2. Logic kiểm tra dữ liệu đầu vào
    if (!data.title || !data.content) {
      throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Tiêu đề và nội dung không được để trống." };
    }

    // 3. Gọi Repo để lưu
    const newAnnouncement = await announcementRepository.prisma.announcement.create({ 
      data: {
        title: data.title,
        content: data.content,
        authorId: userId
      }
    });

    return { success: true, message: "Đăng thông báo thành công", data: newAnnouncement };
  }
  // Logic cập nhật thông báo (Có Sửa cả trạng thái Ghim)
  async updateAnnouncement(id, userRole, data) {
    if (userRole !== 'admin') {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: "Chỉ Admin mới có quyền sửa thông báo!" };
    }

    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Không tìm thấy thông báo này." };
    }

    const updated = await announcementRepository.updateAnnouncement(id, {
      title: data.title || existing.title,
      content: data.content || existing.content,
      isPinned: data.isPinned !== undefined ? data.isPinned : existing.isPinned
    });

    return { success: true, message: "Cập nhật thành công", data: updated };
  }

  // Logic xóa thông báo
  async deleteAnnouncement(id, userRole) {
    if (userRole !== 'admin') {
      throw { statusCode: HTTP_STATUS.FORBIDDEN, message: "Chỉ Admin mới có quyền xóa thông báo!" };
    }

    const existing = await announcementRepository.getAnnouncementById(id);
    if (!existing) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: "Không tìm thấy thông báo này." };
    }

    await announcementRepository.deleteAnnouncement(id);
    return { success: true, message: "Đã xóa thông báo." };
  }
}

module.exports = AnnouncementService;