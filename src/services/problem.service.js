const { problemsRepository, userRepository } = require("../repositories");
const { HTTP_STATUS, PROBLEM_DIFFICULTY } = require("../constants");
const { structureDescription } = require("../utils/html-cleaner");
const { can } = require("../utils/access-control");
const { PERMISSIONS } = require("../constants/permissions");

class problemsService {
  async getStats() {
    const [userCount, problemCount, totalSubmissions, difficultyStats, submissionTrend, resultDistribution, topProblems] = await Promise.all([
      userRepository.count(),
      problemsRepository.count(),
      problemsRepository.getTotalSubmissionsCount(),
      problemsRepository.getDifficultyUserStats(),
      problemsRepository.getSubmissionTrend(7),
      problemsRepository.getSubmissionResultDistribution(),
      problemsRepository.getTopSolvedProblems(10),
    ]);

    const acceptedCount = resultDistribution.find(r => r.status === 'accepted')?.count || 0;
    const acRate = totalSubmissions > 0 ? Math.round((acceptedCount / totalSubmissions) * 100) : 0;

    return {
      success: true,
      data: {
        totalUsers: userCount,
        totalProblems: problemCount,
        totalSubmissions,
        acRate,
        difficultyStats,
        submissionTrend,
        resultDistribution,
        topProblems,
      },
    };
  }

  async getProblems(page = 1, limit = 10, user = null, filters = {}) {
    const { search, category, difficulty, sortBy, sortOrder } = filters;
    const canViewHidden = can(user, PERMISSIONS.VIEW_HIDDEN_PROBLEMS);
    const userId = user?.id;

    const where = {
      ...(!canViewHidden && { isActive: true }),
      ...(search && {
        OR: [{ title: { contains: search } }, { slug: { contains: search } }],
      }),
    }; 
    if (category && category !== "all-code-essentials") {
      where.problemTags = {
        some: {
          tag: { slug: category.toLowerCase() }
        }
      };
    }
    
    const difficultyMap = {
      Easy: PROBLEM_DIFFICULTY.EASY,
      Medium: PROBLEM_DIFFICULTY.MEDIUM,
      Hard: PROBLEM_DIFFICULTY.HARD,
    };

    if (difficulty && difficultyMap[difficulty] !== undefined) {
      where.difficulty = difficultyMap[difficulty];
    }

    const orderBy = sortBy
      ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" }
      : { createdAt: "desc" };

    const result = await problemsRepository.getProblems({
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true, //ĐƯA SLUG RA NGOÀI ĐỂ FIX LỖI 500 FRONTEND
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
      // 2. THÊM ĐOẠN NÀY: Yêu cầu Prisma trả thêm thông tin các Thẻ (Tags)
        problemTags: {
          select: {
            tag: { select: { name: true } }
          },
          take: 3 // Chỉ lấy tối đa 3 tag hiển thị cho đẹp
        }
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
        metadata: true,
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
        solution: {
          select: {
            explanation: true,
            timeComplexity: true,
            spaceComplexity: true,
            contentHtml: true,
            codeSnippets: true,
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

  async createProblem(problemData) {
    const {
      title,
      description,
      difficulty,
      testCases,
      problemTags,
      codeTemplates,
      metadata,
    } = problemData;

    if (!title || !title.trim()) {
      const error = new Error("Title is required");
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const structuredData = structureDescription(description || '');
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
      title: title.trim(),
      slug,
      description: finalDescription,
      difficulty,
      isActive: true,
    };

    const problemTagsLogic = (problemTags || []).map((pt) => ({
      tag: {
        connectOrCreate: {
          where: { slug: pt.tag.slug },
          create: { name: pt.tag.name, slug: pt.tag.slug },
        },
      },
    }));

    const codeTemplatesLogic = (codeTemplates || []).map(ct => ({
      language: ct.language,
      starterCode: ct.starterCode,
      solutionCode: ct.solutionCode,
    }));

    const problem = await problemsRepository.upsertProblem({
      where: { slug },
      update: {
        ...baseData,
        metadata: metadata,
        testCases: { deleteMany: {}, create: testCases || [] },
        codeTemplates: { deleteMany: {}, create: codeTemplatesLogic },
        problemTags: { deleteMany: {}, create: problemTagsLogic },
        examples: { deleteMany: {}, create: examplesLogic },
        constraints: { deleteMany: {}, create: constraintsLogic },
      },
      create: {
        ...baseData,
        metadata: metadata,
        testCases: { create: testCases || [] },
        codeTemplates: { create: codeTemplatesLogic },
        problemTags: { create: problemTagsLogic },
        examples: { create: examplesLogic },
        constraints: { create: constraintsLogic },
      },
      select: { id: true },
    });

    const solutionCodeSnippets = {};
    let hasSolution = false;
    for (const ct of (codeTemplates || [])) {
      if (ct.solutionCode) {
        solutionCodeSnippets[ct.language] = ct.solutionCode;
        hasSolution = true;
      }
    }

    if (hasSolution) {
      await problemsRepository.createProblemSolution({
        problemId: problem.id,
        explanation: 'Official solution provided by the admin.',
        codeSnippets: solutionCodeSnippets,
      });
    }

    return {
      success: true,
      message: "Problem created successfully",
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
  async getRandomProblem(userId) {
    const problemId = await problemsRepository.getRandomProblemId(userId);
    if (!problemId) {
      const error = new Error("Tuyệt vời! Bạn đã giải hết toàn bộ bài tập trên hệ thống.");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return { success: true, data: { id: problemId } };
  }

  async updateProblem(id, data) {
    const { title, description, difficulty, metadata, testCases, codeTemplates, problemTags, examples, constraints } = data;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (metadata !== undefined) updateData.metadata = metadata;

    const problem = await problemsRepository.getProblemDetail({
      where: { id },
      select: { id: true },
    });

    if (!problem) {
      const error = new Error("Problem not found");
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (testCases !== undefined) {
      updateData.testCases = {
        deleteMany: {},
        create: testCases.map((tc, i) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden ?? false,
          orderIndex: i,
        })),
      };
    }

    if (codeTemplates !== undefined) {
      updateData.codeTemplates = {
        deleteMany: {},
        create: codeTemplates.map(ct => ({
          language: ct.language,
          starterCode: ct.starterCode,
          solutionCode: ct.solutionCode,
        })),
      };
    }

    if (examples !== undefined) {
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

    if (constraints !== undefined) {
      updateData.constraints = {
        deleteMany: {},
        create: constraints.map((c, i) => ({
          content: c.content,
          orderIndex: i,
        })),
      };
    }

    if (problemTags !== undefined) {
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
    });

    if (codeTemplates !== undefined) {
      const solutionCodeSnippets = {};
      let hasSolution = false;
      for (const ct of codeTemplates) {
        if (ct.solutionCode) {
          solutionCodeSnippets[ct.language] = ct.solutionCode;
          hasSolution = true;
        }
      }

      if (hasSolution) {
        const existingSolution = await problemsRepository.getProblemSolution(problem.id);
        if (existingSolution) {
          await problemsRepository.updateProblemSolution(problem.id, {
            codeSnippets: solutionCodeSnippets,
          });
        } else {
          await problemsRepository.createProblemSolution({
            problemId: problem.id,
            explanation: 'Official solution provided by the admin.',
            codeSnippets: solutionCodeSnippets,
          });
        }
      }
    }

    return {
      success: true,
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

    await problemsRepository.deleteProblem({ where: { id } });

    return {
      success: true,
      message: "Problem deleted successfully",
    };
  }
}

module.exports = problemsService;