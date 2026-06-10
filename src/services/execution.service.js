// File: src/services/execution.service.js
const { prisma, submissionRepository } = require('../repositories');
const { SUBMISSION_STATUS } = require('../constants'); 
const LANGUAGE_CONFIG = require('../config/language.config'); 
const { formatTestcaseInput } = require('../config/formatter.util'); 
const dockerUtil = require('../utils/docker.util'); 

const compareOutput = (actual, expected) => {
    const a = String(actual).trim();
    const e = String(expected).trim();
    if (a === e) return true;
    
    // Thử so sánh kiểu JSON để bỏ qua khác biệt khoảng trắng trong mảng (VD: [1, 2] và [1,2])
    try {
        return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(e));
    } catch {
        return false;
    }
};

class ExecutionService {
  async runCode(data) {
    let { code, language, problemId, userId, isSubmit } = data;
    language = language.toLowerCase();
    
    // 1. Kiểm tra ngôn ngữ và đề bài
    const config = LANGUAGE_CONFIG[language];
    if (!config) return { success: false, message: `Hệ thống chưa hỗ trợ ngôn ngữ: ${language}` };

    // Dùng findFirst để cho phép tìm bằng ID hoặc Slug
    const problem = await prisma.problem.findFirst({ 
        where: { 
            OR: [
                { id: problemId },
                { slug: problemId }
            ] 
        } 
    });
    
    if (!problem) return { success: false, message: "Bài toán không tồn tại!" };
    if (!problem.metadata) return { success: false, message: "Bài toán chưa được cấu hình!" };
    
    const metadata = typeof problem.metadata === 'string' ? JSON.parse(problem.metadata) : problem.metadata;
    
    // 2. Lấy Testcases
    let testCases = await prisma.testCase.findMany({
      where: { problemId: problem.id }, // SỬA QUAN TRỌNG: Phải dùng problem.id chuẩn từ Database, không dùng biến problemId từ URL
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
        expectedOutput: String(rawExpected).trim() 
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
              userId, problem.id, language, code, SUBMISSION_STATUS.COMPILE_ERROR, 0, testCases.length, compileErrorMsg
          );
        }
      }

      // 5. Chạy test case — KHÔNG break khi sai, gom kết quả từng testcase
      let passedCases = 0;
      let finalStatus = SUBMISSION_STATUS.ACCEPTED;
      let errorMessage = "";
      const testCaseResults = [];

      for (const tc of testCases) {
        let cleanInput = String(tc.input || "").replace(/^input:\s*/i, '').trim().replace(/[a-zA-Z_0-9]+\s*=\s*/g, '').trim();
        const runResult = await dockerUtil.executeSingleTestCase(config.runArgs(runDir), cleanInput);

        const tcResult = {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: runResult.output || "",
          passed: false,
          status: SUBMISSION_STATUS.WRONG_ANSWER,
        };

        if (runResult.status === SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED || runResult.status === SUBMISSION_STATUS.RUNTIME_ERROR) {
          tcResult.status = runResult.status;
          tcResult.actualOutput = runResult.output || "";
          testCaseResults.push(tcResult);
          if (!errorMessage) errorMessage = runResult.output;
          if (finalStatus === SUBMISSION_STATUS.ACCEPTED) finalStatus = runResult.status;
          continue;
        }

        if (!compareOutput(runResult.output, tc.expectedOutput)) {
          tcResult.actualOutput = runResult.output || "";
          testCaseResults.push(tcResult);
          if (!errorMessage) errorMessage = `Input: ${tc.input}\nExpected: ${tc.expectedOutput}\nGot: ${runResult.output}`;
          finalStatus = SUBMISSION_STATUS.WRONG_ANSWER;
          continue;
        }

        tcResult.passed = true;
        tcResult.status = SUBMISSION_STATUS.ACCEPTED;
        testCaseResults.push(tcResult);
        passedCases++;
      }

      // 6. Xử lý "Chạy Test" vs "Nộp Bài"
      if (!isSubmit) {
        // NẾU CHỈ LÀ CHẠY CODE -> Trả về luôn, không lưu Database
        return { success: finalStatus === SUBMISSION_STATUS.ACCEPTED, status: finalStatus, passed: passedCases, total: testCases.length, message: errorMessage, submissionId: null, testCaseResults };
      }

      // NẾU LÀ NỘP BÀI -> Gọi Repository để lưu lịch sử và tính Streak
      const submitResult = await submissionRepository.saveSubmissionRecord(
        userId, problem.id, language, code, finalStatus, passedCases, testCases.length, errorMessage
      );
      submitResult.testCaseResults = testCaseResults;
      return submitResult;

    } finally {
      // 7. Dọn dẹp
      dockerUtil.cleanupWorkspace(runDir);
    }
  }
}

module.exports = ExecutionService;