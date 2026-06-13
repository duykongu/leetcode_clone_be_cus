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

  async createProblemSolution(data) {
    return await this.prisma.problemSolution.create({
      data: {
        problemId: data.problemId,
        explanation: data.explanation || '',
        timeComplexity: data.timeComplexity || null,
        spaceComplexity: data.spaceComplexity || null,
        contentHtml: data.contentHtml || null,
        codeSnippets: data.codeSnippets || {},
      },
    });
  }

  async getProblemSolution(problemId) {
    return await this.prisma.problemSolution.findUnique({
      where: { problemId },
    });
  }

  async updateProblemSolution(problemId, data) {
    return await this.prisma.problemSolution.update({
      where: { problemId },
      data: {
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.timeComplexity !== undefined && { timeComplexity: data.timeComplexity }),
        ...(data.spaceComplexity !== undefined && { spaceComplexity: data.spaceComplexity }),
        ...(data.contentHtml !== undefined && { contentHtml: data.contentHtml }),
        ...(data.codeSnippets !== undefined && { codeSnippets: data.codeSnippets }),
      },
    });
  }

  async getDifficultyUserStats() {
    try {
      const [totalEasy, totalMed, totalHard] = await Promise.all([
        this.prisma.problem.count({ where: { difficulty: 0, isActive: true } }),
        this.prisma.problem.count({ where: { difficulty: 1, isActive: true } }),
        this.prisma.problem.count({ where: { difficulty: 2, isActive: true } }),
      ]);

      const raw = await this.prisma.$queryRaw`
        SELECT p.difficulty,
               COUNT(DISTINCT s.user_id) as user_count,
               COALESCE(AVG(u.streak_days), 0) as avg_streak
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'accepted'
        GROUP BY p.difficulty
      `;

      const map = { 0: 'Easy', 1: 'Medium', 2: 'Hard' };
      const result = {
        Easy: { total: totalEasy, usersSolved: 0, avgStreak: 0 },
        Medium: { total: totalMed, usersSolved: 0, avgStreak: 0 },
        Hard: { total: totalHard, usersSolved: 0, avgStreak: 0 },
      };

      for (const row of raw) {
        const key = map[Number(row.difficulty)];
        if (key) {
          result[key].usersSolved = Number(row.user_count);
          result[key].avgStreak = Math.round(Number(row.avg_streak) || 0);
        }
      }

      return result;
    } catch (error) {
      console.error("Lỗi query difficulty stats:", error);
      return {
        Easy: { total: 0, usersSolved: 0, avgStreak: 0 },
        Medium: { total: 0, usersSolved: 0, avgStreak: 0 },
        Hard: { total: 0, usersSolved: 0, avgStreak: 0 },
      };
    }
  }

  async getSubmissionTrend(days = 7) {
    try {
      const raw = await this.prisma.$queryRaw`
        SELECT DATE(submitted_at) as date,
               COUNT(*) as total,
               SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
        FROM submissions
        WHERE submitted_at >= DATE_SUB(CURDATE(), INTERVAL ${days - 1} DAY)
        GROUP BY DATE(submitted_at)
        ORDER BY date ASC
      `;
      return raw.map((row) => ({
        date: row.date,
        total: Number(row.total),
        accepted: Number(row.accepted),
      }));
    } catch (error) {
      console.error("Lỗi query submission trend:", error);
      return [];
    }
  }

  async getTotalSubmissionsCount() {
    try {
      return await this.prisma.submission.count();
    } catch {
      return 0;
    }
  }

  async getSubmissionResultDistribution() {
    try {
      const raw = await this.prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM submissions
        GROUP BY status
        ORDER BY count DESC
      `;
      return raw.map((row) => ({
        status: row.status,
        count: Number(row.count),
      }));
    } catch (error) {
      console.error("Lỗi query result distribution:", error);
      return [];
    }
  }

  async getTopSolvedProblems(limit = 10) {
    try {
      const raw = await this.prisma.$queryRaw`
        SELECT p.id, p.title, p.slug, p.difficulty,
               COUNT(s.id) as submission_count,
               SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
        FROM problems p
        JOIN submissions s ON s.problem_id = p.id
        GROUP BY p.id, p.title, p.slug, p.difficulty
        ORDER BY submission_count DESC
        LIMIT ${limit}
      `;
      return raw.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        difficulty: Number(row.difficulty),
        submissionCount: Number(row.submission_count),
        acceptedCount: Number(row.accepted_count),
        acceptanceRate: Number(row.submission_count) > 0
          ? Math.round((Number(row.accepted_count) / Number(row.submission_count)) * 100)
          : 0,
      }));
    } catch (error) {
      console.error("Lỗi query top solved problems:", error);
      return [];
    }
  }
}

module.exports = new problemsRepository();
