const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const prisma = require('../config/database'); 
const { SUBMISSION_STATUS } = require('../constants'); 

const cleanTestCaseData = (rawData) => {
  if (!rawData) return "";
  
  // Biểu thức Regex bao trọn 3 trường hợp của bạn:
  // 1. \[[^\]]*\] : Bắt mọi thứ từ [ đến ] (Ví dụ: [2,7,11,15])
  // 2. "[^"]*"    : Bắt mọi thứ từ " đến " (Ví dụ: "abcabcbb")
  // 3. -?\d+(?:\.\d+)? : Bắt các chữ số (Ví dụ: 9, 6, -1, 2.5)
  const regex = /(\[[^\]]*\]|"[^"]*"|-?\d+(?:\.\d+)?)/g;
  
  // Quét chuỗi và lấy ra mảng các giá trị hợp lệ
  const matches = rawData.match(regex);
  
  if (matches) {
    // Nối các giá trị lại bằng dấu xuống dòng (\n) để bơm vào Docker
    return matches.join('\n');
  }
  
  return rawData; // Nếu không có gì để lọc thì trả về nguyên gốc
};
// ==========================================
// BẢN ĐỒ CẤU HÌNH NGÔN NGỮ (LANGUAGE CONFIG)
// ==========================================
const LANGUAGE_CONFIG = {
  "cpp": {
    image: "gcc:latest",
    fileName: "solution.cpp",
    compileCmd: (dir) => `docker run --rm -v "${dir}:/app" -w /app gcc:latest g++ solution.cpp -o solution`,
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'gcc:latest', './solution']
  },
  "java": {
    image: "eclipse-temurin:17-jdk-alpine",
    fileName: "Solution.java",
    compileCmd: (dir) => `docker run --rm -v "${dir}:/app" -w /app eclipse-temurin:17-jdk-alpine javac Solution.java`,
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'eclipse-temurin:17-jdk-alpine', 'java', 'Solution']
  },
  "python": {
    image: "python:3.9-slim",
    fileName: "solution.py",
    compileCmd: null, // Python thông dịch, không cần compile
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'python:3.9-slim', 'python', 'solution.py']
  },
  "javascript": {
    image: "node:18-alpine",
    fileName: "solution.js",
    compileCmd: null, // JS thông dịch, không cần compile
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'node:18-alpine', 'node', 'solution.js']
  }
};

class ExecutionService {
async runCode(data) {
    const { code, language, problemId, userId } = data;

    const config = LANGUAGE_CONFIG[language];
    if (!config) {
      return { success: false, message: `Hệ thống chưa hỗ trợ ngôn ngữ: ${language}` };
    }

    let testCases = await prisma.testCase.findMany({
      where: { problemId: problemId },
      orderBy: { orderIndex: 'asc' } 
    });

    if (!testCases || testCases.length === 0) {
      return { success: false, message: "Bài toán này chưa có testcase nào trong hệ thống!" };
    }
    testCases = testCases.map(tc => ({
      ...tc,
      input: cleanTestCaseData(tc.input), 
      expectedOutput: cleanTestCaseData(tc.expectedOutput) 
    }));
    // ==
    // TẠO THƯ MỤC TẠM  -> vùng đệm chứa file code, cổng thông hành giữa host với docker
    const tempDir = path.resolve(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const runId = Date.now().toString();
    const runDir = path.join(tempDir, runId);
    fs.mkdirSync(runDir);
   
    // BẮT ĐẦU KHỐI BẢO HIỂM
    try {
      const filePath = path.join(runDir, config.fileName);
      fs.writeFileSync(filePath, code);

      // BIÊN DỊCH
      if (config.compileCmd) {
        const compileResult = await new Promise((resolve) => {
          exec(config.compileCmd(runDir), (err, stdout, stderr) => {
            if (err) resolve({ success: false, error: stderr });
            else resolve({ success: true });
          });
        });

        if (!compileResult.success) {
          return await this.saveSubmission(userId, problemId, language, code, SUBMISSION_STATUS.COMPILE_ERROR, 0, testCases.length, compileResult.error);
        }
      }

      // CHẤM ĐIỂM
      let passedCases = 0;
      let finalStatus = SUBMISSION_STATUS.ACCEPTED;
      let errorMessage = "";

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const runResult = await this.executeSingleTestCase(config.runArgs(runDir), tc.input);

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

      return await this.saveSubmission(userId, problemId, language, code, finalStatus, passedCases, testCases.length, errorMessage);

    } finally {
      // KHỐI NÀY LUÔN CHẠY: Dọn rác không trượt phát nào! ->xóa các file có trong temp ngay sau khi có input hoặc (sau 2s)
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true, force: true });
      }
    }
  }

  // ==========================================
  // HÀM PHỤ 1: CHẠY DOCKER & THÊM TIMEOUT
  // ==========================================
  executeSingleTestCase(dockerArgs, input) {
    return new Promise((resolve) => {
      const runProcess = spawn('docker', dockerArgs);
      
      let output = '';
      let error = '';
      let isTimeout = false;

      const timeoutId = setTimeout(() => {
        isTimeout = true;
        runProcess.kill(); 
      }, 2000);

      runProcess.stdout.on('data', (data) => output += data.toString());
      runProcess.stderr.on('data', (data) => error += data.toString());

      runProcess.on('close', (code) => {
        clearTimeout(timeoutId); 
        if (isTimeout) {
          resolve({ status: SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED, output: "Time Limit Exceeded (Quá 2 giây)" });
        } else if (error || code !== 0) {
          resolve({ status: SUBMISSION_STATUS.RUNTIME_ERROR, output: error || `Crash mã lỗi ${code}` });
        } else {
          resolve({ status: "SUCCESS", output: output.trim() });
        }
      });

      if (input) runProcess.stdin.write(input + '\n');
      runProcess.stdin.end();
    });
  }

async saveSubmission(userId, problemId, language, code, status, passed, total, errorMsg) {
    let submissionId = null;
    const isAccepted = status === SUBMISSION_STATUS.ACCEPTED;

    if (userId && problemId) {
      // 1. Lưu biên bản nộp bài vào bảng submissions
      const submission = await prisma.submission.create({
        data: { userId, problemId, language, code, status, passedCases: passed, totalCases: total, errorMessage: errorMsg }
      });
      submissionId = submission.id;

      // 2. Logic Cộng điểm (Chỉ kích hoạt nếu nộp ĐÚNG)
      if (isAccepted) {
        // Kiểm tra xem user đã từng nộp bài này trước đây chưa
        const existingStatus = await prisma.userProblemStatus.findFirst({
          where: { userId: userId, problemId: problemId }
        });

        // Nếu là lần đầu tiên giải hoặc trước đó toàn giải sai, giờ mới đúng
        if (!existingStatus || !existingStatus.isSolved) {
          
          // Bước 2.1: Đánh dấu bài toán này là "Đã giải quyết" (isSolved: true)
          if (existingStatus) {
            await prisma.userProblemStatus.updateMany({
              where: { userId: userId, problemId: problemId },
              data: { isSolved: true, lastSubmitted: new Date() }
            });
          } else {
            await prisma.userProblemStatus.create({
              data: { userId, problemId, isSolved: true, firstSolved: new Date(), lastSubmitted: new Date() }
            });
          }

          // Bước 2.2: Cộng 1 điểm thành tích vào Profile của User
          await prisma.user.update({
            where: { id: userId },
            data: { solvedCount: { increment: 1 } }
          });
        }
      }
    }

    return { 
      success: isAccepted, 
      status, 
      passed, 
      total, 
      message: errorMsg, 
      submissionId 
    };
  }
}

module.exports = ExecutionService;