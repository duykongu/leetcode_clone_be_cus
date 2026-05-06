const problemsRepository = require("../repositories/problemsRepository");
const userRepository = require("../repositories/userRepository");

class problemsService {
  async getProblems(page = 1, limit = 50, userId = null, filters = {}) {
    const { search, category, difficulty } = filters;
    
    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { slug: { contains: search } },
        ],
      }),
    };

    if (difficulty) {
      switch (difficulty) {
        case "Easy":
          where.difficulty = 0;
          break;
        case "Medium":
          where.difficulty = 1;
          break;
        case "Hard":
          where.difficulty = 2;
          break;
      }
    }

    const result = await problemsRepository.getProblems({
      where,
      select: {
        id: true,
        title: true,
        acceptanceRate: true,
        difficulty: true,
        createdAt: true,
        ...(userId && {
          userProblems: {
            where: { userId },
            select: { isSolved: true },
          },
        }),
      },
      page,
      limit,
    });

    const data = result.data.map((p) => {
      const isSolved =
        p.userProblems && p.userProblems.length > 0
          ? p.userProblems[0].isSolved
          : false;
      const { userProblems, ...problemData } = p;
      return { ...problemData, isSolved };
    });

    // Get user stats if authenticated
    let userStats = { solvedCount: 0, streakDays: 0 };
    if (userId) {
      const user = await userRepository.findById(userId, {
        select: { solvedCount: true, streakDays: true },
      });
      if (user) userStats = user;
    }

    return {
      message: "Problems retrieved successfully",
      data,
      pagination: result.pagination,
      userStats,
    };
  }

  async getProblemDetail(id, userId = null) {
    const problem = await problemsRepository.getProblemDetail({
      where: { id },
      include: {
        codeTemplates: true,
        testCases: {
          where: { isHidden: false },
          orderBy: { orderIndex: "asc" },
        },
        problemTags: {
          include: {
            tag: true,
          },
        },
        // Only fetch submissions if user is authenticated
        ...(userId && {
          submissions: {
            where: { userId },
            orderBy: { submittedAt: "desc" },
            take: 20,
          },
        }),
      },
    });

    if (!problem) {
      const error = new Error("Problem not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      message: "Problem retrieved successfully",
      data: problem,
    };
  }
}

module.exports = new problemsService();
