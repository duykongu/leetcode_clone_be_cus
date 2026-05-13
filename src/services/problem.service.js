const { problemsRepository, userRepository } = require("../repositories");
const { HTTP_STATUS, PROBLEM_DIFFICULTY } = require("../constants");
const { cleanDescriptionHtml, structureDescription } = require("../utils/html-cleaner");

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

    const difficultyMap = {
      Easy: PROBLEM_DIFFICULTY.EASY,
      Medium: PROBLEM_DIFFICULTY.MEDIUM,
      Hard: PROBLEM_DIFFICULTY.HARD,
    };

    if (difficulty && difficultyMap[difficulty] !== undefined) {
      where.difficulty = difficultyMap[difficulty];
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
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return {
      message: "Problem retrieved successfully",
      data: problem,
    };
  }

  async importProblem(problemData) {
    const {
      title,
      slug,
      description,
      difficulty,
      testCases,
      problemTags,
      codeTemplates,
    } = problemData;

    // 1. Làm sạch và cấu trúc lại mô tả thành JSON {des, example, condition}
    const structuredData = structureDescription(description);
    const finalDescription = JSON.stringify(structuredData);

    const baseData = {
      title,
      description: finalDescription,
      difficulty,
      isActive: true,
    };




    const problemTagsLogic = problemTags.map((pt) => ({
      tag: {
        connectOrCreate: {
          where: { slug: pt.tag.slug },
          create: { name: pt.tag.name, slug: pt.tag.slug },
        },
      },
    }));

    await problemsRepository.upsertProblem({
      where: { slug },
      update: {
        ...baseData,
        testCases: { deleteMany: {}, create: testCases },
        codeTemplates: { deleteMany: {}, create: codeTemplates },
        problemTags: { deleteMany: {}, create: problemTagsLogic },
      },
      create: {
        ...baseData,
        slug,
        testCases: { create: testCases },
        codeTemplates: { create: codeTemplates },
        problemTags: { create: problemTagsLogic },
      },
      select: { id: true },
    });

    return {
      success: true,
      message: "Problem imported/updated successfully",
    };
  }

}




module.exports = new problemsService();
