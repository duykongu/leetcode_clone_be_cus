// File: src/utils/docker.util.js
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { SUBMISSION_STATUS } = require('../constants');

/**
 * Tạo thư mục tạm và file code
 */
const prepareWorkspace = (runId, fileName, code) => {
  const tempDir = path.resolve(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  
  const runDir = path.join(tempDir, runId);
  fs.mkdirSync(runDir);
  
  const filePath = path.join(runDir, fileName);
  fs.writeFileSync(filePath, code);
  
  return runDir;
};

/**
 * Xóa thư mục tạm
 */
const cleanupWorkspace = (runDir) => {
  if (fs.existsSync(runDir)) {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
};

/**
 * Biên dịch code (Dành cho C++, TypeScript, Java)
 */
const compileCode = (compileCmd, runDir) => {
  return new Promise((resolve) => {
    exec(compileCmd(runDir), (err, stdout, stderr) => {
      if (err) resolve({ success: false, error: stdout || stderr || err.message });
      else resolve({ success: true });
    });
  });
};

/**
 * Chạy 1 testcase duy nhất qua Docker
 */
const executeSingleTestCase = (dockerArgs, input) => {
  return new Promise((resolve) => {
    const runProcess = spawn('docker', dockerArgs);
    
    let output = '';
    let error = '';
    let isTimeout = false;

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      runProcess.kill(); 
    }, 10000);

    runProcess.stdout.on('data', (data) => output += data.toString());
    runProcess.stderr.on('data', (data) => error += data.toString());

    runProcess.on('close', (code) => {
      clearTimeout(timeoutId); 
      if (isTimeout) {
        resolve({ status: SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED, output: "Time Limit Exceeded (Quá 10 giây)" });
      } else if (error || code !== 0) {
        resolve({ status: SUBMISSION_STATUS.RUNTIME_ERROR, output: error || `Crash mã lỗi ${code}` });
      } else {
        resolve({ status: "SUCCESS", output: output.trim() });
      }
    });

    if (input) runProcess.stdin.write(input + '\n');
    runProcess.stdin.end();
  });
};

module.exports = {
  prepareWorkspace,
  cleanupWorkspace,
  compileCode,
  executeSingleTestCase
};