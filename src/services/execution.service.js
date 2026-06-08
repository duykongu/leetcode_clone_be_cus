// File: src/services/execution.service.js
const { prisma, submissionRepository } = require('../repositories');
const { SUBMISSION_STATUS } = require('../constants'); 
const LANGUAGE_CONFIG = require('../config/language.config'); 
const { formatTestcaseInput } = require('../config/formatter.util'); 
const dockerUtil = require('../utils/docker.util'); 

class ExecutionService {
  async runCode(data) {
    let { code, language, problemId, userId,isSubmit } = data;
    language = language.toLowerCase();
    // 1. Kiểm tra ngôn ngữ và đề bài
    const config = LANGUAGE_CONFIG[language];
    if (!config) return { success: false, message: `Hệ thống chưa hỗ trợ ngôn ngữ: ${language}` };

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) return { success: false, message: "Bài toán không tồn tại!" };
    if (!problem.metadata) return { success: false, message: "Bài toán chưa được cấu hình!" };
    
    const metadata = typeof problem.metadata === 'string' ? JSON.parse(problem.metadata) : problem.metadata;
    
    // 2. Lấy Testcases
    let testCases = await prisma.testCase.findMany({
      where: { problemId: problemId },
      orderBy: { orderIndex: 'asc' } 
    });

    if (!testCases || testCases.length === 0) {
      return { success: false, message: "Bài toán chưa có testcase!" };
    }
    
    // 🛡️ SAFEGURAD: Đảm bảo dữ liệu không bị undefined trước khi replace
    testCases = testCases.map(tc => {
      // Đề phòng Prisma map sai tên hoặc DB bị null
      const rawExpected = tc.expectedOutput || tc.expected_output || ""; 
      const rawInput = tc.input || "";

      return {
        ...tc,
        input: formatTestcaseInput(rawInput), 
        expectedOutput: String(rawExpected).replace(/\s/g, "") 
      };
    });

    // 3. Chuẩn bị môi trường Docker
    const runId = Date.now().toString();
    let finalCode = config.wrapper ? config.wrapper(code, metadata) : code;
    const runDir = dockerUtil.prepareWorkspace(runId, config.fileName, finalCode);
  
    try {
      // 4. Biên dịch code
        if (config.compileCmd) {
        const compileResult = await dockerUtil.compileCode(config.compileCmd, runDir);
        if (!compileResult.success) {
          // Xử lý Lỗi Biên Dịch (Compile Error)
          const compileErrorMsg = compileResult.error;

          if (!isSubmit) {
            return { success: false, status: SUBMISSION_STATUS.COMPILE_ERROR, passed: 0, total: testCases.length, message: compileErrorMsg, submissionId: null };
          }
          
          return await submissionRepository.saveSubmissionRecord(
              userId, problemId, language, code, SUBMISSION_STATUS.COMPILE_ERROR, 0, testCases.length, compileErrorMsg
          );
        }
      }

// 5. Chạy test case
      let passedCases = 0;
      let finalStatus = SUBMISSION_STATUS.ACCEPTED;
      let errorMessage = "";

      for (const tc of testCases) {
        let cleanInput = String(tc.input || "").replace(/^input:\s*/i, '').trim().replace(/[a-zA-Z_]+\s*=\s*/g, '').trim();
        const runResult = await dockerUtil.executeSingleTestCase(config.runArgs(runDir), cleanInput);

        if (runResult.status === SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED || runResult.status === SUBMISSION_STATUS.RUNTIME_ERROR) {
          finalStatus = runResult.status;
          errorMessage = runResult.output;
          break; 
        }

        if (runResult.output !== tc.expectedOutput.trim()) {
          finalStatus = SUBMISSION_STATUS.WRONG_ANSWER;
          errorMessage = `Input: ${tc.input}\nExpected: ${tc.expectedOutput}\nGot: ${runResult.output}`;
          break; 
        }
        passedCases++;
      }

      // ================= SỬA LỖI Ở ĐÂY =================
      // 6. Xử lý "Chạy Test" vs "Nộp Bài"
      if (!isSubmit) {
        // NẾU CHỈ LÀ CHẠY CODE -> Trả về luôn, không lưu Database
        return { success: finalStatus === SUBMISSION_STATUS.ACCEPTED, status: finalStatus, passed: passedCases, total: testCases.length, message: errorMessage, submissionId: null };
      }

      // NẾU LÀ NỘP BÀI -> Gọi Repository để lưu lịch sử và tính Streak
      return await submissionRepository.saveSubmissionRecord(
        userId, problemId, language, code, finalStatus, passedCases, testCases.length, errorMessage
      );
      // =================================================

    } finally {
      // 7. Dọn dẹp
      dockerUtil.cleanupWorkspace(runDir);
    }
  }
}

module.exports = ExecutionService;