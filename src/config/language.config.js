// ==========================================
// BẢN ĐỒ CẤU HÌNH NGÔN NGỮ (LANGUAGE CONFIG)
// ==========================================
const { TYPE_MAP } = require('../constants');
const path = require('path');

// Hàm chuẩn hóa kiểu dữ liệu (Sửa lỗi viết hoa/thường từ LeetCode)
const getMappedType = (lang, rawType) => {
    if (!rawType) return TYPE_MAP[lang]["string"] || "string";
    const nType = rawType.charAt(0).toLowerCase() + rawType.slice(1);
    return TYPE_MAP[lang][nType] || TYPE_MAP[lang]["string"] || "string";
};

// Kiểm tra xem kiểu dữ liệu có phải là Danh sách liên kết không
const isListNode = (rawType) => {
    if (!rawType) return false;
    return rawType.toLowerCase() === "listnode";
};

// ==========================================
// CẤU TRÚC DỮ LIỆU DÙNG CHUNG CỦA LEETCODE
// ==========================================
const COMMON_STRUCTURES = {
  python: `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _array_to_list_node(arr):
    if not arr: return None
    dummy = ListNode()
    curr = dummy
    for val in arr:
        curr.next = ListNode(val)
        curr = curr.next
    return dummy.next

def _list_node_to_array(node):
    res = []
    while node:
        res.append(node.val)
        node = node.next
    return res
`,
  javascript: `
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

function _arrayToListNode(arr) {
    if (!arr || !arr.length) return null;
    let dummy = new ListNode();
    let curr = dummy;
    for (let val of arr) {
        curr.next = new ListNode(val);
        curr = curr.next;
    }
    return dummy.next;
}

function _listNodeToArray(node) {
    let res = [];
    while (node) {
        res.push(node.val);
        node = node.next;
    }
    return res;
}
`,
  typescript: `
class ListNode {
    val: number
    next: ListNode | null
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val===undefined ? 0 : val);
        this.next = (next===undefined ? null : next);
    }
}

function _arrayToListNode(arr: any[]): ListNode | null {
    if (!arr || !arr.length) return null;
    let dummy = new ListNode();
    let curr = dummy;
    for (let val of arr) {
        curr.next = new ListNode(val);
        curr = curr.next;
    }
    return dummy.next;
}

function _listNodeToArray(node: ListNode | null): any[] {
    let res: any[] = [];
    while (node) {
        res.push(node.val);
        node = node.next;
    }
    return res;
}
`,
  cpp: `
namespace nlohmann {
    template <>
    struct adl_serializer<char> {
        static void from_json(const json& j, char& c) {
            std::string s = j.get<std::string>();
            c = s.empty() ? '\\0' : s[0];
        }
        static void to_json(json& j, char c) {
            j = std::string(1, c);
        }
    };
}

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

ListNode* _arrayToListNode(const json& arr) {
    if (!arr.is_array() || arr.empty()) return nullptr;
    ListNode* dummy = new ListNode();
    ListNode* curr = dummy;
    for (const auto& val : arr) {
        curr->next = new ListNode(val.get<int>());
        curr = curr->next;
    }
    ListNode* head = dummy->next;
    delete dummy;
    return head;
}

json _listNodeToArray(ListNode* node) {
    json res = json::array();
    while (node) {
        res.push_back(node->val);
        node = node->next;
    }
    return res;
}
`,
  java: `
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Helper {
    public static ListNode arrayToListNode(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode dummy = new ListNode();
        ListNode curr = dummy;
        for (int val : arr) {
            curr.next = new ListNode(val);
            curr = curr.next;
        }
        return dummy.next;
    }
    
    public static int[] listNodeToArray(ListNode node) {
        java.util.List<Integer> list = new java.util.ArrayList<>();
        while (node != null) {
            list.add(node.val);
            node = node.next;
        }
        int[] res = new int[list.size()];
        for (int i = 0; i < list.size(); i++) {
            res[i] = list.get(i);
        }
        return res;
    }
}
`
};

const LANGUAGE_CONFIG = {
  "python": {
    image: "python:3.9-slim",
    fileName: "solution.py",
    compileCmd: null, 
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'python:3.9-slim', 'python', 'solution.py'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      const rawReturn = metadata.return?.type || "void";
      const isReturnLn = isListNode(rawReturn);
      const params = metadata.params || [];
      
      const deserializeCode = params.map((p, i) => {
          if (isListNode(p.type)) return `args[${i}] = _array_to_list_node(args[${i}])`;
          return '';
      }).filter(Boolean).join('\n        ');

      const serializeCode = isReturnLn ? 'res = _list_node_to_array(res)' : '';

      return `import sys
import json
import re
from typing import *
import collections
${COMMON_STRUCTURES.python}
${userCode}

def _run_wrapper():
    lines = sys.stdin.read().splitlines()
    lines = [l for l in lines if l.strip()]
    if not lines: return

    try:
        sol = Solution()
        # Chống lỗi khoảng trắng và tên biến l1=, l2=
        cleaned_lines = [re.sub(r'^\\s*[a-zA-Z_0-9]+\\s*=\\s*', '', l) for l in lines]
        args = [json.loads(line) for line in cleaned_lines]
        
        ${deserializeCode}
        
        res = getattr(sol, '${methodName}')(*args)
        
        if '${rawReturn}' == 'void':
            res = args[0]
            
        ${serializeCode}
        
        if isinstance(res, list):
            print(json.dumps(res))
        elif isinstance(res, bool):
            print(str(res).lower())
        else:
            print(json.dumps(res))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)

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
      const rawReturn = metadata.return?.type || "void";
      const isReturnLn = isListNode(rawReturn);
      const params = metadata.params || [];
      
      const deserializeCode = params.map((p, i) => {
          if (isListNode(p.type)) return `args[${i}] = _arrayToListNode(args[${i}]);`;
          return '';
      }).filter(Boolean).join('\n        ');

      const serializeCode = isReturnLn ? 'res = _listNodeToArray(res);' : '';

      return `
const fs = require('fs');
${COMMON_STRUCTURES.javascript}
${userCode}

function _run_wrapper() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    const lines = input.split('\\n').filter(Boolean);
    try {
        const args = lines.map(line => JSON.parse(line.replace(/^\\s*[a-zA-Z_0-9]+\\s*=\\s*/, '')));

        ${deserializeCode}

        let res = ${methodName}(...args);
        
        if ('${rawReturn}' === 'void') {
            res = args[0];
        }
        
        ${serializeCode}

        if (Array.isArray(res)) {
            console.log(JSON.stringify(res));
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
    runArgs: (dir) => ['run', '--rm', '-i', '-v', `${dir}:/app`, '-w', '/app', '--memory=256m', '--network=none', 'node:18-alpine', 'node', 'solution.js'],
    wrapper: (userCode, metadata) => {
      const methodName = metadata.name || "main";
      const rawReturn = metadata.return?.type || "void";
      const isReturnLn = isListNode(rawReturn);
      const params = metadata.params || [];
      
      const deserializeCode = params.map((p, i) => {
          if (isListNode(p.type)) return `args[${i}] = _arrayToListNode(args[${i}]);`;
          return '';
      }).filter(Boolean).join('\n        ');

      const serializeCode = isReturnLn ? 'res = _listNodeToArray(res);' : '';
      const inPlaceLogic = rawReturn === 'void' ? 'res = args[0];' : '';

      return `
declare var require: any;
const fs = require('fs');
${COMMON_STRUCTURES.typescript}
${userCode}

function _run_wrapper() {
   const rawInput: string = fs.readFileSync(0, 'utf-8').trim();

    if (!rawInput) return;
    const lines: string[] = rawInput
        .split('\\n')
        .filter((line: string) => line.trim().length > 0);
    try {
        let args: any[] = lines.map((line: string) => JSON.parse(line.replace(/^\\s*[a-zA-Z_0-9]+\\s*=\\s*/, '')));

        ${deserializeCode}

        const fn: any = ${methodName};
        let res: any = fn(...args);
        
        ${inPlaceLogic}
        ${serializeCode}

        if (Array.isArray(res)) {
            console.log(JSON.stringify(res));
        } else if (typeof res === 'boolean') {
            console.log(String(res));
        } else {
            console.log(JSON.stringify(res));
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
      const rawReturn = metadata.return?.type || "void";
      const isReturnLn = isListNode(rawReturn);
      const cppReturnType = rawReturn === "void" ? "void" : getMappedType("cpp", rawReturn);
      
      let readParamsCode = '';
      let methodArgs = [];
      params.forEach((param, index) => {
        const cppType = getMappedType("cpp", param.type);
        
        if (isListNode(param.type)) {
            readParamsCode += `
        string line${index};
        if (!getline(cin, line${index})) break;
        line${index} = std::regex_replace(line${index}, std::regex("^\\\\s*[a-zA-Z_0-9]+\\\\s*=\\\\s*"), "");
        json j_arg${index} = json::parse(line${index});
        ListNode* arg${index} = _arrayToListNode(j_arg${index});
            `;
        } else {
            readParamsCode += `
        string line${index};
        if (!getline(cin, line${index})) break;
        line${index} = std::regex_replace(line${index}, std::regex("^\\\\s*[a-zA-Z_0-9]+\\\\s*=\\\\s*"), "");
        json j_arg${index} = json::parse(line${index});
        ${cppType} arg${index} = j_arg${index}.get<${cppType}>();
            `;
        }
        methodArgs.push(`arg${index}`);
      });
      const argsString = methodArgs.join(', ');

      let execCode = '';
      if (rawReturn === "void") {
          execCode = `
        sol.${methodName}(${argsString});
        json j_res = arg0;
        cout << j_res.dump() << endl;
          `;
      } else if (isReturnLn) { // Giữ nguyên ListNode* ở đây để hàm _listNodeToArray hoạt động đúng
          execCode = `
        ListNode* res = sol.${methodName}(${argsString});
        json j_res = _listNodeToArray(res);
        cout << j_res.dump() << endl;
          `;
      } else {
          // 👉 ÁP DỤNG 'auto' Ở ĐÂY CHO CÁC TRƯỜNG HỢP CÒN LẠI (List, Array, Integer...)
          execCode = `
        auto res = sol.${methodName}(${argsString}); 
        json j_res = res;
        cout << j_res.dump() << endl;
          `;
      }

      return `
#include <iostream>
#include <string>
#include <vector>
#include <regex>
#include <json.hpp>
using namespace std;
using json = nlohmann::json;
${COMMON_STRUCTURES.cpp}
${userCode}

int main() {
    Solution sol;
    while (true) {
${readParamsCode}
${execCode}
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
      const rawReturn = metadata.return?.type || "void";
      const isReturnLn = isListNode(rawReturn);
      const javaReturnType = rawReturn === "void" ? "void" : getMappedType("java", rawReturn);
      
      const importRegex = /import\s+(?:static\s+)?[\w\.\*]+;/g;
      const userImports = (userCode.match(importRegex) || []).join('\n');
      const cleanUserCode = userCode.replace(importRegex, '');

      let readParamsCode = '';
      let methodArgs = [];
      params.forEach((param, index) => {
        if (isListNode(param.type)) {
            readParamsCode += `
            String line${index} = reader.readLine();
            if (line${index} == null || line${index}.trim().isEmpty()) break outerLoop; 
            line${index} = line${index}.replaceFirst("^\\\\s*[a-zA-Z_0-9]+\\\\s*=\\\\s*", "");
            int[] arr${index} = gson.fromJson(line${index}, int[].class);
            ListNode arg${index} = Helper.arrayToListNode(arr${index});
            `;
        } else {
            const javaType = getMappedType("java", param.type);
            readParamsCode += `
            String line${index} = reader.readLine();
            if (line${index} == null || line${index}.trim().isEmpty()) break outerLoop; 
            line${index} = line${index}.replaceFirst("^\\\\s*[a-zA-Z_0-9]+\\\\s*=\\\\s*", "");
            ${javaType} arg${index} = gson.fromJson(line${index}, ${javaType}.class);
            `;
        }
        methodArgs.push(`arg${index}`);
      });
      const argsString = methodArgs.join(', ');

      let execCode = '';
      if (rawReturn === "void") {
          execCode = `
                sol.${methodName}(${argsString});
                System.out.println(gson.toJson(arg0));
          `;
      } else if (isReturnLn) { // Giữ nguyên ListNode ở đây để Helper.listNodeToArray hoạt động đúng
          execCode = `
                ListNode res = sol.${methodName}(${argsString});
                int[] resArr = Helper.listNodeToArray(res);
                System.out.println(gson.toJson(resArr));
          `;
      } else {
          // 👉 ÁP DỤNG 'var' Ở ĐÂY CHO CÁC TRƯỜNG HỢP CÒN LẠI (List<List<Integer>>, String, int...)
          execCode = `
                var res = sol.${methodName}(${argsString});
                System.out.println(gson.toJson(res));
          `;
      }

      return `
import java.util.*;
import java.io.*;
import com.google.gson.*;
${userImports}

${COMMON_STRUCTURES.java}

${cleanUserCode}

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        Gson gson = new Gson();
        Solution sol = new Solution();
        outerLoop: while (true) {
            try {
${readParamsCode}
${execCode}
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