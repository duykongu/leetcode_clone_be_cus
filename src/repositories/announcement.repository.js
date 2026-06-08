const BaseRepository = require("./base.repository");

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super("announcement"); // Kế thừa các hàm findPaginated, count từ base
  }

  // Hàm chuyên biệt: Lấy thông báo mới nhất kèm thông tin người đăng
  async getLatestAnnouncements(limit = 10) {
    return this.prisma.announcement.findMany({
      // BỔ SUNG SẮP XẾP KÉP: Ghim lên trước, sau đó mới đến thời gian
      orderBy: [
        { isPinned: 'desc' }, 
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        author: {
          select: { username: true, avatarUrl: true, role: true }
        }
      }
    });
  }
  // Lấy chi tiết 1 thông báo
  async getAnnouncementById(id) {
    return this.prisma.announcement.findUnique({ where: { id } });
  }

  // Cập nhật thông báo
  async updateAnnouncement(id, data) {
    return this.prisma.announcement.update({
      where: { id },
      data
    });
  }

  // Xóa thông báo
  async deleteAnnouncement(id) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}

module.exports = new AnnouncementRepository();