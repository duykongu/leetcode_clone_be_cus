const BaseRepository = require("./base.repository");

class problemsRepository extends BaseRepository {
  constructor() {
    super("problem");
  }
  
  async getRandomProblemId(userId) {
    let solvedIds = [];
    
    // Nếu user đã đăng nhập, lấy danh sách bài đã giải
    if (userId) {
      const solvedProblems = await this.prisma.userProblemStatus.findMany({
        where: { userId: userId, isSolved: true },
        select: { problemId: true }
      });
      solvedIds = solvedProblems.map(s => s.problemId);
    }

    // ƯU TIÊN 1: Tìm bài Easy (difficulty = 0) chưa giải
    let problems = await this.prisma.problem.findMany({
      where: { isActive: true, difficulty: 0, id: { notIn: solvedIds } },
      select: { id: true, slug: true } // Lấy cả slug để URL đẹp
    });

    // ƯU TIÊN 2: Hết bài Easy -> Tìm bài Medium (difficulty = 1) chưa giải
    if (problems.length === 0) {
      problems = await this.prisma.problem.findMany({
        where: { isActive: true, difficulty: 1, id: { notIn: solvedIds } },
        select: { id: true, slug: true }
      });
    }

    // ƯU TIÊN 3: Hết bài Medium -> Tìm bài Hard (difficulty = 2) chưa giải
    if (problems.length === 0) {
      problems = await this.prisma.problem.findMany({
        where: { isActive: true, difficulty: 2, id: { notIn: solvedIds } },
        select: { id: true, slug: true }
      });
    }

    // Nếu đã làm hết mọi bài trên hệ thống (hoặc DB rỗng)
    if (problems.length === 0) return null; 

    // Lấy ngẫu nhiên 1 bài trong danh sách vừa lọc
    const randomIndex = Math.floor(Math.random() * problems.length);
    
    // Trả về slug nếu có, không có thì trả về id
    return problems[randomIndex].slug || problems[randomIndex].id;
  }

  async getProblems(params = {}) {
    return this.findPaginated(params);
  }

  async getProblemDetail(params = {}) {
    const { where, select, include } = params;
    
    // Tạo câu query linh hoạt: Tìm theo ID HOẶC tìm theo Slug
    const searchQuery = where.id ? {
      OR: [
        { id: where.id },
        { slug: where.id }
      ]
    } : where;

    // Phải đổi thành findFirst vì findUnique không hỗ trợ mệnh đề OR
    return await this.prisma.problem.findFirst({
      where: searchQuery,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  async upsertProblem(params = {}) {
    const { where, update, create, select, include } = params;
    return await this.prisma.problem.upsert({
      where,
      update,
      create,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  async updateProblem(params = {}) {
    const { where, data } = params;
    return await this.prisma.problem.update({ where, data });
  }

  async deleteProblem(params = {}) {
    const { where } = params;
    return await this.prisma.problem.delete({ where });
  }
}

module.exports = new problemsRepository();
