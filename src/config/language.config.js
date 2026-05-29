// ==========================================
// BẢN ĐỒ CẤU HÌNH NGÔN NGỮ (LANGUAGE CONFIG)
// ==========================================
const { TYPE_MAP } = require('../constants');
const path = require('path');
const LANGUAGE_CONFIG = {
  "python": {
    image: "python:3.9-slim",
    fileName: "solution.py",
    compileCmd: null, 
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'python:3.9-slim', 'python', 'solution.py'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      return `import sys
import json

${userCode}

def _run_wrapper():
    lines = sys.stdin.read().splitlines()
    lines = [l for l in lines if l.strip()]
    if not lines: return

    try:
        sol = Solution()
        args = [json.loads(line) for line in lines]
        
        res = getattr(sol, '${methodName}')(*args)
        
        if isinstance(res, list):
            print(json.dumps(res).replace(' ', ''))
        elif isinstance(res, bool):
            print(str(res).lower())
        else:
            print(json.dumps(res))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    _run_wrapper()`;
    }
  },

  "javascript": {
    image: "node:18-alpine",
    fileName: "solution.js",
    compileCmd: null,
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'node:18-alpine', 'node', 'solution.js'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      return `
const fs = require('fs');

${userCode}

function _run_wrapper() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const lines = input.split('\\n').filter(Boolean);
    
    try {
        const args = lines.map(line => JSON.parse(line));
        
        const res = ${methodName}(...args);
        
        if (Array.isArray(res)) {
            console.log(JSON.stringify(res).replace(/\\s/g, ''));
        } else if (typeof res === 'boolean') {
            console.log(res.toString());
        } else {
            console.log(JSON.stringify(res));
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
_run_wrapper();`;
    }
  },

  "typescript": {
    image: "node:18-alpine",
    fileName: "solution.ts",
    compileCmd: (dir) => `docker run --rm -v "${dir}:/app" -w /app ts-leetcode tsc solution.ts --target es2020 --module commonjs`,
    runArgs: (dir) => [
    'run',
    '--rm',
    '-i',
    '-v',
    `${dir}:/app`,
    '-w',
    '/app',
    '--memory=256m',
    '--network=none',
    'node:18-alpine',
    'node',
    'solution.js'
  ],
   wrapper: (userCode, metadata) => {
    const methodName = metadata.name || "main";
      return `
declare var require: any;
const fs = require('fs');

${userCode}

function _run_wrapper() {
   const rawInput: string = fs.readFileSync(0, 'utf-8').trim();

    if (!rawInput) return;

    const lines: string[] = rawInput
        .split('\\n')
        .filter((line: string) => line.trim().length > 0);

    try {
        const parsedArgs: any[] = lines.map(
            (line: string) => JSON.parse(line)
        );

        const fn: any = ${methodName};
        const result: any = fn(...parsedArgs);

        if (Array.isArray(result)) {
            console.log(JSON.stringify(result).replace(/\\s/g, ''));
        } else if (typeof result === 'boolean') {
            console.log(String(result));
        } else {
            console.log(JSON.stringify(result));
        }
    } catch (err: any) {
        console.error("Error:", err?.message || err);
    }
}
_run_wrapper();`;
    }
  },

  "cpp": {
    image: "gcc-leetcode",
    fileName: "solution.cpp",
    compileCmd: (dir) => `docker run --rm -v "${dir}:/app" -w /app gcc-leetcode g++ solution.cpp -o main_exec`,
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'gcc-leetcode', './main_exec'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      const params = metadata.params || [];
      const returnType = metadata.return?.type || "string";
      const cppReturnType = TYPE_MAP["cpp"][returnType] || "string";

      let readParamsCode = '';
      let methodArgs = [];

      params.forEach((param, index) => {
        const cppType = TYPE_MAP["cpp"][param.type] || "string";
        readParamsCode += `
        string line${index};
        if (!getline(cin, line${index})) break;
        ${cppType} arg${index} = json::parse(line${index});
`;
        methodArgs.push(`arg${index}`);
      });

      const argsString = methodArgs.join(', ');

      return `
#include <iostream>
#include <string>
#include <vector>
#include <json.hpp>
using namespace std;
using json = nlohmann::json;

${userCode}

int main() {
    Solution sol;
    while (true) {
${readParamsCode}
        ${cppReturnType} res = sol.${methodName}(${argsString});
        
        json j_res = res;
        cout << j_res.dump() << endl;
    }
    return 0;
}`;
    }
  },

  "java": {
    image: "java-leetcode",
    fileName: "Main.java", 
    compileCmd: (dir) => `docker run --rm -v "${dir}:/app" -w /app java-leetcode javac -cp .:/opt/gson.jar Main.java`,
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'java-leetcode', 'java', '-cp', '.:/opt/gson.jar', 'Main'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      const params = metadata.params || [];
      const returnType = metadata.return?.type || "string";
      const javaReturnType = TYPE_MAP["java"][returnType] || "String";

      let readParamsCode = '';
      let methodArgs = [];

      params.forEach((param, index) => {
        const javaType = TYPE_MAP["java"][param.type] || "String";
        readParamsCode += `
            String line${index} = reader.readLine();
            if (line${index} == null || line${index}.trim().isEmpty()) break outerLoop; 
            ${javaType} arg${index} = gson.fromJson(line${index}, ${javaType}.class);
        `;
        methodArgs.push(`arg${index}`);
      });

      const argsString = methodArgs.join(', ');

      return `
import java.util.*;
import java.io.*;
import com.google.gson.*;

${userCode}

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        Gson gson = new Gson();
        Solution sol = new Solution();
        
        outerLoop: while (true) {
            try {
${readParamsCode}
                ${javaReturnType} res = sol.${methodName}(${argsString});
                System.out.println(gson.toJson(res).replaceAll("\\\\s+", ""));
            } catch (Exception e) {
                break;
            }
        }
    }
}`;
    }
  }
};
module.exports = LANGUAGE_CONFIG;