const BaseRepository = require("./base.repository");

class DiscussionRepository extends BaseRepository {
  constructor() {
    super("discussion");
  }

// Lấy danh sách bài viết
  async getDiscussionsList(page, limit, filters = {}, userId = null) {
    const skip = (page - 1) * limit;
    
    // 1. MẶC ĐỊNH LÀ ẨN CÁC BÀI ĐÃ XÓA (isDeleted: false)
    const where = { isDeleted: false };
    
    if (filters.problemId) where.problemId = filters.problemId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
        // Prisma hỗ trợ tìm kiếm chuỗi nằm bên trong cột dữ liệu dạng JSON (Tags)
        { tags: { string_contains: filters.search } } 
      ];
    }

    // 2. NẾU ĐANG Ở TAB "ĐÃ LƯU" VÀ CÓ LOGIN
    if (filters.isSaved && userId) {
      where.interactions = {
        some: { userId: userId, isSaved: true }
      };
    }

    // 3. XỬ LÝ SẮP XẾP VÀ GHIM
    const orderBy = [];
    
    // Nếu không tắt tính năng Ưu tiên Ghim thì đẩy bài Ghim lên đầu
    if (filters.pinPriority !== 'false') {
      orderBy.push({ isPinned: 'desc' });
    }

    // Sắp xếp theo Hot hoặc Mới nhất
    if (filters.sortBy === 'hot') {
      orderBy.push({ upvotes: 'desc' });
      orderBy.push({ views: 'desc' });
    } else {
      // Mặc định là 'new'
      orderBy.push({ createdAt: 'desc' }); 
    }

    const [data, total] = await Promise.all([
      this.prisma.discussion.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include: {
          user: { select: { username: true, avatarUrl: true, role: true } },
          problem: { select: { title: true, slug: true } },
          _count: { select: { comments: true } }
        }
      }),
      this.prisma.discussion.count({ where })
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

// Lấy chi tiết 1 bài viết kèm bình luận và trạng thái tương tác
  async getDiscussionDetail(id, userId = null) {
    await this.prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(() => {});

    return this.prisma.discussion.findUnique({
      // Chỉ lấy bài chưa bị xóa mềm
      where: { id, isDeleted: false },
      include: {
        user: { select: { username: true, avatarUrl: true, role: true, id: true } },
        problem: { select: { title: true, slug: true } },
        comments: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
          include: { 
            user: { select: { username: true, avatarUrl: true, role: true } },
            // Dùng Spread Operator để nhúng an toàn, tránh lỗi chữ "false" của Prisma
            ...(userId && { interactions: { where: { userId: userId } } }) 
          }
        },
        // Tương tự cho phần interactions của bài viết gốc
        ...(userId && { interactions: { where: { userId: userId } } })
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
// Xử lý Tương tác (Like / Dislike / Lưu)
  async toggleInteraction(userId, discussionId, action) {
    const existing = await this.prisma.userDiscussionInteraction.findUnique({
      where: { userId_discussionId: { userId, discussionId } }
    });

    // Nếu là LƯU BÀI (Bookmark)
    if (action === 'save') {
      const newValue = existing ? !existing.isSaved : true;
      return this.prisma.userDiscussionInteraction.upsert({
        where: { userId_discussionId: { userId, discussionId } },
        update: { isSaved: newValue },
        create: { userId, discussionId, isSaved: true }
      });
    }

    // Nếu là LIKE (upvote) hoặc DISLIKE (downvote)
    if (action === 'upvote' || action === 'downvote') {
      const currentVote = existing ? existing.voteType : 0;
      let newVote = 0;

      if (action === 'upvote') {
        newVote = currentVote === 1 ? 0 : 1; // Nếu đang Like thì gỡ Like (về 0), nếu không thì thành Like (1)
      } else if (action === 'downvote') {
        newVote = currentVote === -1 ? 0 : -1; // Nếu đang Dislike thì gỡ (về 0), nếu không thì thành Dislike (-1)
      }

      // Công thức tính số điểm chênh lệch để cộng/trừ vào tổng
      const voteDiff = newVote - currentVote;

      return this.prisma.$transaction([
        this.prisma.userDiscussionInteraction.upsert({
          where: { userId_discussionId: { userId, discussionId } },
          update: { voteType: newVote },
          create: { userId, discussionId, voteType: newVote }
        }),
        // Cập nhật con số upvotes hiển thị ra ngoài
        this.prisma.discussion.update({
          where: { id: discussionId },
          data: { upvotes: { increment: voteDiff } }
        })
      ]);
    }
  }

  // 2. Xóa mềm (Bia mộ)
  async softDelete(id) {
    return this.prisma.discussion.update({
      where: { id },
      data: { isDeleted: true }
    });
  }

  // 3. Admin Ghim bài
  async togglePin(id, currentPinStatus) {
    return this.prisma.discussion.update({
      where: { id },
      data: { isPinned: !currentPinStatus }
    });
  }

  // Sửa bài viết
  async updateDiscussion(id, data) {
    return this.prisma.discussion.update({
      where: { id },
      data
    });
  }

  // Lấy 1 comment để kiểm tra quyền xóa
  async getCommentById(commentId) {
    return this.prisma.comment.findUnique({ where: { id: commentId } });
  }

  // Thêm bình luận mới
  async addComment(discussionId, userId, content, parentId = null) {
    return this.prisma.comment.create({
      data: { discussionId, userId, content, parentId },
      include: { user: { select: { username: true, avatarUrl: true, role: true } } }
    });
  }

   // --- HÀM XÓA BÌNH LUẬN ---
  async deleteComment(commentId) {
    // Dùng Transaction để xóa từ dưới lên trên, đảm bảo không bị lỗi Khóa Ngoại
    return this.prisma.$transaction(async (tx) => {
      // 1. Tìm tất cả comment con
      const children = await tx.comment.findMany({ 
        where: { parentId: commentId }, 
        select: { id: true } 
      });
      const allIds = [commentId, ...children.map(c => c.id)];
      
      // 2. Xóa sạch tương tác (Like/Dislike) của cả cha lẫn con
      await tx.userCommentInteraction.deleteMany({ 
        where: { commentId: { in: allIds } } 
      });
      
      // 3. Xóa comment con trước
      if (children.length > 0) {
        await tx.comment.deleteMany({ where: { parentId: commentId } });
      }
      
      // 4. Xóa comment cha
      return tx.comment.delete({ where: { id: commentId } });
    });
  }
  //sửa comment
  async updateComment(commentId, content) {
    return this.prisma.comment.update({ where: { id: commentId }, data: { content } });
  }
  //ghim
  async togglePinComment(commentId, isPinned) {
    return this.prisma.comment.update({ where: { id: commentId }, data: { isPinned: !isPinned } });
  }

  // Bật/Tắt Vote cho Comment
  async toggleCommentInteraction(userId, commentId, action) {
    const existing = await this.prisma.userCommentInteraction.findUnique({
      where: { userId_commentId: { userId, commentId } }
    });

    if (action === 'upvote' || action === 'downvote') {
      const currentVote = existing ? existing.voteType : 0;
      let newVote = 0;

      if (action === 'upvote') newVote = currentVote === 1 ? 0 : 1;
      else if (action === 'downvote') newVote = currentVote === -1 ? 0 : -1;

      const voteDiff = newVote - currentVote;

      return this.prisma.$transaction([
        this.prisma.userCommentInteraction.upsert({
          where: { userId_commentId: { userId, commentId } },
          update: { voteType: newVote },
          create: { userId, commentId, voteType: newVote }
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { upvotes: { increment: voteDiff } }
        })
      ]);
    }
  }
}

module.exports = new DiscussionRepository();