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
}

module.exports = new ProfileRepository();
