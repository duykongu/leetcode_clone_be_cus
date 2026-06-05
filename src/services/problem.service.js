const { problemsRepository, userRepository } = require("../repositories");
const { HTTP_STATUS, PROBLEM_DIFFICULTY } = require("../constants");
const { structureDescription } = require("../utils/html-cleaner");
const { can } = require("../utils/access-control");
const { PERMISSIONS } = require("../constants/permissions");

class problemsService {
  async getStats() {
    const [userCount, problemCount] = await Promise.all([
      userRepository.count(),
      problemsRepository.count(),
    ]);
    return {
      success: true,
      data: {
        totalUsers: userCount,
        totalProblems: problemCount,
        totalSubmissions: 0,
      },
    };
  }

  async getProblems(page = 1, limit = 50, user = null, filters = {}) {
    const { difficulty } = filters;
    const canViewHidden = can(user, PERMISSIONS.VIEW_HIDDEN_PROBLEMS);
    const userId = user?.id;

    const where = {
      ...(!canViewHidden && { isActive: true }),
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
        slug: true,
        acceptanceRate: true,
        difficulty: true,
        createdAt: true,
        ...(canViewHidden && { isActive: true }),
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

    let userStats = { solvedCount: 0, streakDays: 0 };
    if (userId) {
      const user = await userRepository.findById(userId, {
        select: { solvedCount: true, streakDays: true },
      });
      if (user) userStats = user;
    }

    return {
      success: true,
      message: "Problems retrieved successfully",
      data,
      pagination: result.pagination,
      userStats,
    };
  }

  async getProblemDetail(id, userId = null) {
    const problem = await problemsRepository.getProblemDetail({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        codeTemplates: {
          select: {
            language: true,
            starterCode: true,
            solutionCode: true,
          }
        },
        testCases: {
          where: { isHidden: false },
          orderBy: { orderIndex: "asc" },
          select: {
            input: true,
            expectedOutput: true,
          }
        },
        problemTags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        },
        examples: {
          orderBy: { orderIndex: "asc" },
          select: {
            input: true,
            output: true,
            explanation: true,
          }
        },
        constraints: {
          orderBy: { orderIndex: "asc" },
          select: {
            content: true,
          }
        },
        ...(userId && {
          submissions: {
            where: { userId },
            orderBy: { submittedAt: "desc" },
            take: 20,
            select: {
              id: true,
              language: true,
              code: true,
              status: true,
              runtimeMs: true,
              memoryKb: true,
              submittedAt: true,
              passedCases: true, 
              totalCases: true, 
              errorMessage: true 
            }
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

    const structuredData = structureDescription(description);
    const finalDescription = structuredData.des;

    const examplesLogic = structuredData.example.map((ex, i) => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || null,
      orderIndex: i,
    }));

    const constraintsLogic = structuredData.condition.map((cond, i) => ({
      content: cond,
      orderIndex: i,
    }));

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

  

    // Áp dụng quét vào mảng Templates
    const codeTemplatesLogic = codeTemplates.map(ct => ({
        language: ct.language,
        starterCode: ct.starterCode,
        solutionCode: ct.solutionCode,
    }));

    await problemsRepository.upsertProblem({
      where: { slug },
      update: {
        ...baseData,
        metadata: problemData.metadata,
        testCases: { deleteMany: {}, create: testCases },
        codeTemplates: { deleteMany: {}, create: codeTemplatesLogic }, // Đã map logic mới
        problemTags: { deleteMany: {}, create: problemTagsLogic },
        examples: { deleteMany: {}, create: examplesLogic },
        constraints: { deleteMany: {}, create: constraintsLogic },
      },
      create: {
        ...baseData,
        slug,
        metadata: problemData.metadata,
        testCases: { create: testCases },
        codeTemplates: { create: codeTemplatesLogic }, // Đã map logic mới
        problemTags: { create: problemTagsLogic },
        examples: { create: examplesLogic },
        constraints: { create: constraintsLogic },
      },
      select: { id: true },
    });

    return {
      success: true,
      message: "Problem imported/updated successfully",
    };
  }

  async updateProblem(id, data) {
    const problem = await problemsRepository.getProblemDetail({
      where: { id },
      select: { id: true },
    });

    if (!problem) {
      const error = new Error("Problem not found");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const {
      codeTemplates,
      testCases,
      examples,
      constraints,
      problemTags,
      ...fields
    } = data;

    const updateData = { ...fields };

    if (codeTemplates) {
      updateData.codeTemplates = {
        deleteMany: {},
        create: codeTemplates.map(ct => ({
          language: ct.language,
          starterCode: ct.starterCode,
          solutionCode: ct.solutionCode,
        })),
      };
    }

    if (testCases) {
      updateData.testCases = {
        deleteMany: {},
        create: testCases.map((tc, i) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
          orderIndex: i,
        })),
      };
    }

    if (examples) {
      updateData.examples = {
        deleteMany: {},
        create: examples.map((ex, i) => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation || null,
          orderIndex: i,
        })),
      };
    }

    if (constraints) {
      updateData.constraints = {
        deleteMany: {},
        create: constraints.map((c, i) => ({
          content: c.content,
          orderIndex: i,
        })),
      };
    }

    if (problemTags) {
      updateData.problemTags = {
        deleteMany: {},
        create: problemTags.map(pt => ({
          tag: {
            connectOrCreate: {
              where: { slug: pt.tag.slug },
              create: { name: pt.tag.name, slug: pt.tag.slug },
            },
          },
        })),
      };
    }

    const updated = await problemsRepository.updateProblem({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        difficulty: true,
        acceptanceRate: true,
        updatedAt: true,
        codeTemplates: {
          select: { language: true, starterCode: true, solutionCode: true },
        },
        testCases: {
          orderBy: { orderIndex: "asc" },
          select: { input: true, expectedOutput: true, isHidden: true },
        },
        examples: {
          orderBy: { orderIndex: "asc" },
          select: { input: true, output: true, explanation: true },
        },
        constraints: {
          orderBy: { orderIndex: "asc" },
          select: { content: true },
        },
        problemTags: {
          select: {
            tag: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return {
      message: "Problem updated successfully",
      data: updated,
    };
  }

  async deleteProblem(id) {
    const problem = await problemsRepository.getProblemDetail({
      where: { id },
      select: { id: true },
    });

    if (!problem) {
      const error = new Error("Problem not found");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await problemsRepository.deleteProblem({ id });

    return {
      message: "Problem deleted successfully",
    };
  }
}

module.exports = problemsService;