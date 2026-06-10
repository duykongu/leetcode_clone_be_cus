const BaseRepository = require("./base.repository");
const { SUBMISSION_STATUS } = require("../constants");

class ProfileRepository extends BaseRepository {
  // Get solved problems by difficulty
  async getSolvedProblemsByDifficulty(userId) {
    return this.prisma.userProblemStatus.findMany({
      where: { userId, isSolved: true },
      include: {
        problem: {
          select: { difficulty: true }
        }
      }
    });
  }

  // Get total count of problems by difficulty
  async getTotalProblemsCountByDifficulty(difficulty) {
    return this.prisma.problem.count({
      where: { difficulty, isActive: true }
    });
  }

  // Get submission history
  async getSubmissionHistory(userId, fromDate) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        submittedAt: { gte: fromDate }
      },
      select: { submittedAt: true, status: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // Get recent accepted submissions
  async getRecentAcceptedSubmissions(userId, limit = 15) {
    return this.prisma.submission.findMany({
      where: { userId, status: SUBMISSION_STATUS.ACCEPTED },
      include: {
        problem: { select: { title: true, slug: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit
    });
  }

  // Get saved problems (paginated)
  async getSavedProblems(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };
    const [data, total] = await Promise.all([
      this.prisma.userSavedProblem.findMany({
        skip,
        take: limit,
        where,
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
              acceptanceRate: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userSavedProblem.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Toggle save problem (returns true = saved, false = unsaved)
  async toggleSaveProblem(userId, problemId) {
    const existing = await this.prisma.userSavedProblem.findUnique({
      where: { userId_problemId: { userId, problemId } }
    });
    if (existing) {
      await this.prisma.userSavedProblem.delete({
        where: { userId_problemId: { userId, problemId } }
      });
      return false;
    }
    await this.prisma.userSavedProblem.create({
      data: { userId, problemId }
    });
    return true;
  }

  // Get user's submissions (paginated)
  async getSubmissionsList(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId };
    const [data, total] = await Promise.all([
      this.prisma.submission.findMany({
        skip,
        take: limit,
        where,
        include: {
          problem: { select: { title: true, slug: true } }
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.submission.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Get single submission detail
  async getSubmissionById(userId, submissionId) {
    return this.prisma.submission.findFirst({
      where: { id: submissionId, userId },
      include: {
        problem: { select: { title: true, slug: true } }
      }
    });
  }

  // Get user's discussions (paginated)
  async getUserDiscussions(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };
    const [data, total] = await Promise.all([
      this.prisma.discussion.findMany({
        skip,
        take: limit,
        where,
        include: {
          problem: { select: { title: true, slug: true } },
          _count: { select: { comments: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.discussion.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new ProfileRepository();
