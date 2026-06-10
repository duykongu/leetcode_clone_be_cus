const { getPagination } = require('../utils/pagination');
const { HTTP_STATUS } = require('../constants');

class AnnouncementController {
  constructor({ announcementService }) {
    this.announcementService = announcementService;
  }

  getHomeAnnouncements = async (req, res) => {
    try {
      const { page, limit } = getPagination(req.query, 10);
      const result = await this.announcementService.getHomeAnnouncements(page, limit);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server khi lấy bảng tin'
      });
    }
  }

  // Khách (Admin) gọi hàm tạo thông báo mới
  createAnnouncement = async (req, res) => {
    try {
      const data = req.body; // Dữ liệu khách gửi từ form
      const userId = req.user.id; // Lấy ID của người đang đăng nhập
      const userRole = req.user.role; // Lấy chức vụ (admin/user)

      // Chọc vô: announcementService (Quản lý) để nhờ kiểm duyệt và lưu
      const result = await this.announcementService.createAnnouncement(userId, userRole, data);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server khi tạo bảng tin'
      });
    }
  }
  //(Admin) gọi hàm sửa thông báo
  updateAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const userRole = req.user.role;

      const result = await this.announcementService.updateAnnouncement(id, userRole, data);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server khi cập nhật'
      });
    }
  }

  //(Admin) gọi hàm xóa thông báo
  deleteAnnouncement = async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      const result = await this.announcementService.deleteAnnouncement(id, userRole);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server khi xóa'
      });
    }
  }
}

module.exports = AnnouncementController;