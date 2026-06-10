const prisma = require('../config/database');
const { SUBMISSION_STATUS } = require('../constants');

class SubmissionRepository {
 async saveSubmissionRecord(userId, problemId, language, code, status, passed, total, errorMsg) {
    let submissionId = null;
    const isAccepted = status === SUBMISSION_STATUS.ACCEPTED;

    // Nếu không đăng nhập, chấm xong trả kết quả chứ không lưu
    if (!userId || !problemId) {
      return { success: isAccepted, status, passed, total, message: errorMsg, submissionId: null };
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. LƯU BÀI NỘP MỚI
        const submission = await tx.submission.create({
          data: { userId, problemId, language, code, status, passedCases: passed, totalCases: total, errorMessage: errorMsg }
        });
        submissionId = submission.id;

        // 2. LOGIC TÍNH STREAK (Ép kiểu ngày tháng String YYYY-MM-DD để chống lỗi Múi giờ)
        const userObj = await tx.user.findUnique({ where: { id: userId }, select: { streakDays: true, lastActive: true } });
        
        // Hàm chuyển Date sang chuỗi YYYY-MM-DD chuẩn múi giờ Việt Nam
        const getVnDateString = (dateObj) => {
            if (!dateObj) return null;
            const vnTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
            return vnTime.toISOString().split('T')[0];
        };

        const now = new Date();
        const todayStr = getVnDateString(now);
        const lastActiveStr = getVnDateString(userObj.lastActive);

        // NẾU HÔM NAY CHƯA NỘP BÀI (Chặn việc cộng dồn nhiều lần trong 1 ngày)
        if (lastActiveStr !== todayStr) {
            
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getVnDateString(yesterday);

            // MẶC ĐỊNH: Bị đứt chuỗi hoặc lần đầu nộp -> Tính là ngày 1 của chuỗi mới
            let newStreak = 1; 
            
            // Nếu ngày nộp cuối cùng TRÙNG KHỚP với ngày hôm qua -> Nối chuỗi thêm 1
            if (lastActiveStr === yesterdayStr) {
                newStreak = (userObj.streakDays || 0) + 1;
            }

            // 🔥 TRICK CHỐNG TRÔI NGÀY DB: Ép giờ lưu là 12:00:00 trưa (UTC). 
            // Giúp MySQL (@db.Date) luôn lưu chuẩn xác ngày Việt Nam dù user nộp bài lúc rạng sáng!
            const safeDateForDB = new Date(`${todayStr}T12:00:00.000Z`);

            await tx.user.update({
                where: { id: userId },
                data: { streakDays: newStreak, lastActive: safeDateForDB }
            });
        }

        // 3. SMART CLEANUP: ƯU TIÊN XÓA BÀI LỖI NẾU QUÁ 20 BÀI
        const allSubs = await tx.submission.findMany({
            where: { userId, problemId },
            select: { id: true, status: true, submittedAt: true },
            orderBy: { submittedAt: 'asc' } // Cũ nhất xếp trước
        });

        if (allSubs.length > 20) {
            const deleteCount = allSubs.length - 20;
            const failedSubs = allSubs.filter(s => s.status !== SUBMISSION_STATUS.ACCEPTED);
            const acceptedSubs = allSubs.filter(s => s.status === SUBMISSION_STATUS.ACCEPTED);

            let idsToDelete = [];
            
            // Lấy các bài lỗi cũ nhất cho vào danh sách tử hình
            const failedToDelete = failedSubs.slice(0, deleteCount);
            idsToDelete.push(...failedToDelete.map(s => s.id));

            // Nếu vẫn chưa đủ (tức là nộp bài đúng quá nhiều), mới xóa bài đúng cũ nhất
            if (idsToDelete.length < deleteCount) {
                const remainCount = deleteCount - idsToDelete.length;
                const acceptedToDelete = acceptedSubs.slice(0, remainCount);
                idsToDelete.push(...acceptedToDelete.map(s => s.id));
            }

            if (idsToDelete.length > 0) {
                await tx.submission.deleteMany({
                    where: { id: { in: idsToDelete } }
                });
            }
        }

        // 4. CẬP NHẬT TRẠNG THÁI ĐÃ GIẢI BÀI (UserProblemStatus)
        if (isAccepted) {
          const existingStatus = await tx.userProblemStatus.findFirst({
            where: { userId: userId, problemId: problemId }
          });

          if (!existingStatus || !existingStatus.isSolved) {
            if (existingStatus) {
              await tx.userProblemStatus.updateMany({
                where: { userId, problemId },
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
      console.error("Lỗi lưu DB:", error);
      return { success: isAccepted, status, passed, total, message: "Code chạy nhưng lỗi lưu Data", submissionId: null };
    }
  }
}

module.exports = new SubmissionRepository();