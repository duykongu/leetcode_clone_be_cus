const BaseRepository = require("./base.repository");

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super("announcement"); // Kế thừa các hàm findPaginated, count từ base
  }

  // Hàm chuyên biệt: Lấy thông báo mới nhất kèm thông tin người đăng
  async getLatestAnnouncements(limit = 10) {
    return this.prisma.announcement.findMany({
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

  async getAnnouncementsPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const orderBy = [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ];
    const include = {
      author: { select: { username: true, avatarUrl: true, role: true } }
    };
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({ skip, take: limit, orderBy, include }),
      this.prisma.announcement.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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