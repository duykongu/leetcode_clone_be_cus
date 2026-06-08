const BaseRepository = require("./base.repository");

class problemsRepository extends BaseRepository {
  constructor() {
    super("problem");
  }
  
  async getRandomProblemId(userId) {
    let whereCondition = { isActive: true };
    // Nếu user đã đăng nhập, lọc bỏ những bài họ đã giải xong (isSolved: true)
    if (userId) {
      const solvedProblems = await this.prisma.userProblemStatus.findMany({
        where: { userId: userId, isSolved: true },
        select: { problemId: true }
      });
      
      const solvedIds = solvedProblems.map(s => s.problemId);
      if (solvedIds.length > 0) {
        whereCondition.id = { notIn: solvedIds };
      }
    }
    // Lấy danh sách ID các bài thỏa mãn điều kiện
    const problems = await this.prisma.problem.findMany({
      where: whereCondition,
      select: { id: true }
    });
    if (problems.length === 0) return null; 
    // Random 1 index bất kỳ trong mảng
    const randomIndex = Math.floor(Math.random() * problems.length);
    return problems[randomIndex].id;
  }

  async getProblems(params = {}) {
    return this.findPaginated(params);
  }

  async getProblemDetail(params = {}) {
    const { where, select, include } = params;
    return await this.prisma.problem.findUnique({
      where,
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
