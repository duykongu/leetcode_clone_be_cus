const BaseRepository = require("./base.repository");

class DiscussionRepository extends BaseRepository {
  constructor() {
    super("discussion");
  }

  // Lấy danh sách bài viết (Ưu tiên bài Ghim -> Sắp xếp theo Upvote/Mới nhất)
  async getDiscussionsList(page, limit, filters = {}) {
    const skip = (page - 1) * limit;
    
    // Nếu có problemId thì lọc, không thì thôi (Thảo luận chung)
    const where = {};
    if (filters.problemId) where.problemId = filters.problemId;
    if (filters.search) {
      where.title = { contains: filters.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.discussion.findMany({
        skip,
        take: limit,
        where,
        orderBy: [
          { isPinned: 'desc' }, // Bài ghim luôn lên đầu
          { createdAt: 'desc' } // Sau đó mới đến bài mới nhất
        ],
        include: {
          user: { select: { username: true, avatarUrl: true, role: true } },
          problem: { select: { title: true, slug: true } },
          _count: { select: { comments: true } } // Đếm số lượng bình luận
        }
      }),
      this.prisma.discussion.count({ where })
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Lấy chi tiết 1 bài viết kèm toàn bộ bình luận
  async getDiscussionDetail(id) {
    // Tăng view mỗi khi có người bấm vào xem
    await this.prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(() => {}); // Bỏ qua lỗi nếu bài không tồn tại

    return this.prisma.discussion.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, avatarUrl: true, role: true } },
        problem: { select: { title: true, slug: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { username: true, avatarUrl: true, role: true } }
          }
        }
      }
    });
  }

  // Tạo bình luận mới
  async createComment(data) {
    return this.prisma.comment.create({
      data,
      include: {
        user: { select: { username: true, avatarUrl: true, role: true } }
      }
    });
  }
}

module.exports = new DiscussionRepository();