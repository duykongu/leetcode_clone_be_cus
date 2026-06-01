const prisma = require('../config/database');
const { SUBMISSION_STATUS } = require('../constants');

class SubmissionRepository {
  async saveSubmissionRecord(userId, problemId, language, code, status, passed, total, errorMsg) {
    let submissionId = null;
    const isAccepted = status === SUBMISSION_STATUS.ACCEPTED;

    // SỬA Ở ĐÂY: Nếu không có User, KHÔNG lưu DB nhưng VẪN TRẢ VỀ kết quả chấm code
    if (!userId || !problemId) {
      return { 
        success: isAccepted, 
        status: status, // Giữ lại status để Frontend không bị sập
        passed: passed, 
        total: total, 
        message: errorMsg || "Executed successfully (Not saved: User not logged in)", 
        submissionId: null 
      };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.create({
          data: { userId, problemId, language, code, status, passedCases: passed, totalCases: total, errorMessage: errorMsg }
        });
        submissionId = submission.id;

        if (isAccepted) {
          const existingStatus = await tx.userProblemStatus.findFirst({
            where: { userId: userId, problemId: problemId }
          });

          if (!existingStatus || !existingStatus.isSolved) {
            if (existingStatus) {
              await tx.userProblemStatus.updateMany({
                where: { userId: userId, problemId: problemId },
                data: { isSolved: true, lastSubmitted: new Date() }
              });
            } else {
              await tx.userProblemStatus.create({
                data: { userId, problemId, isSolved: true, firstSolved: new Date(), lastSubmitted: new Date() }
              });
            }
            await tx.user.update({
              where: { id: userId },
              data: { solvedCount: { increment: 1 } }
            });
          }
        }
        return submission;
      });

      return { success: isAccepted, status, passed, total, message: errorMsg, submissionId };
    } catch (error) {
      console.error("Lỗi lưu submission:", error);
      // Nếu DB lỗi, vẫn phải trả về kết quả cho user xem
      return { 
        success: isAccepted, 
        status: status, 
        passed: passed, 
        total: total, 
        message: "Code executed but failed to save to database", 
        submissionId: null 
      };
    }
  }
}

module.exports = new SubmissionRepository();