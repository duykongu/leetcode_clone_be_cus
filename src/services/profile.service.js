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
        birthday: true,
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

  async updateProfile(userId, data) {
    const updateData = {};

    if (data.username !== undefined) {
      if (data.username.length < 3) {
        throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Username phải >= 3 ký tự" };
      }
      const existingUser = await userRepo.isUsernameTaken(data.username);
      if (existingUser) {
        const currentUser = await userRepo.findById(userId, { select: { username: true } });
        if (currentUser && currentUser.username !== data.username) {
          throw { statusCode: HTTP_STATUS.CONFLICT, message: "Username đã tồn tại" };
        }
      }
      updateData.username = data.username;
    }

    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Email không hợp lệ" };
      }
      const existingEmail = await userRepo.isEmailTaken(data.email);
      if (existingEmail) {
        const currentUser = await userRepo.findById(userId, { select: { email: true } });
        if (currentUser && currentUser.email !== data.email) {
          throw { statusCode: HTTP_STATUS.CONFLICT, message: "Email đã tồn tại" };
        }
      }
      updateData.email = data.email;
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl || null;
    }

    if (data.birthday !== undefined) {
      if (data.birthday) {
        const birthdayDate = new Date(data.birthday);
        if (isNaN(birthdayDate.getTime())) {
          throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Ngày sinh không hợp lệ" };
        }
        if (birthdayDate > new Date()) {
          throw { statusCode: HTTP_STATUS.BAD_REQUEST, message: "Ngày sinh không thể ở tương lai" };
        }
        updateData.birthday = birthdayDate;
      } else {
        updateData.birthday = null;
      }
    }

    const updatedUser = await userRepo.update(userId, updateData);
    return updatedUser;
  }

  async uploadAvatar(userId, file, baseUrl = '') {
    const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;
    const updatedUser = await userRepo.update(userId, { avatarUrl });
    return {
      ...updatedUser,
      avatarUrl,
    };
  }
}

module.exports = ProfileService;
