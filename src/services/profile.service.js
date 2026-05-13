const { profileRepository: profileRepo, userRepository: userRepo } = require("../repositories");
const { HTTP_STATUS, PROBLEM_DIFFICULTY, SUBMISSION_STATUS } = require("../constants");

class ProfileService {
  async getProfile(userId) {
    const user = await userRepo.findById(userId, {
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
        solvedCount: true,
        streakDays: true,
        lastActive: true,
      },
    });

    if (!user) {
      throw { statusCode: HTTP_STATUS.NOT_FOUND, message: 'User not found' };
    }

    // Fetch difficulty breakdown
    const solvedByDifficulty = await profileRepo.getSolvedProblemsByDifficulty(userId);

    const [totalEasy, totalMed, totalHard] = await Promise.all([
      profileRepo.getTotalProblemsCountByDifficulty(PROBLEM_DIFFICULTY.EASY),
      profileRepo.getTotalProblemsCountByDifficulty(PROBLEM_DIFFICULTY.MEDIUM),
      profileRepo.getTotalProblemsCountByDifficulty(PROBLEM_DIFFICULTY.HARD),
    ]);

    const difficultyStats = {
      Easy: { solved: 0, total: totalEasy },
      Medium: { solved: 0, total: totalMed },
      Hard: { solved: 0, total: totalHard },
    };

    solvedByDifficulty.forEach(s => {
      if (s.problem.difficulty === PROBLEM_DIFFICULTY.EASY) difficultyStats.Easy.solved++;
      else if (s.problem.difficulty === PROBLEM_DIFFICULTY.MEDIUM) difficultyStats.Medium.solved++;
      else if (s.problem.difficulty === PROBLEM_DIFFICULTY.HARD) difficultyStats.Hard.solved++;
    });

    // Fetch submission history (for heatmap - last year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const submissions = await profileRepo.getSubmissionHistory(userId, oneYearAgo);

    // Recent AC submissions
    const recentAC = await profileRepo.getRecentAcceptedSubmissions(userId, 15);

    return {
      ...user,
      difficultyStats,
      submissions,
      recentAC
    };
  }
}

module.exports = new ProfileService();
