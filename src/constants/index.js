const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const SUBMISSION_STATUS = {
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
  RUNTIME_ERROR: 'runtime_error',
  COMPILE_ERROR: 'compile_error',
  PENDING: 'pending',
};

const PROBLEM_DIFFICULTY = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};


// config cho kiểu data
const TYPE_MAP = {
"java": {
    "integer": "int",
    "integer[]": "int[]",
    "string": "String",
    "string[]": "String[]",
    "boolean": "boolean",
    "boolean[]": "boolean[]",
    "listNode": "ListNode",
    "treeNode": "TreeNode"
  },
  "cpp": {
    "integer": "int",
    "integer[]": "vector<int>",
    "string": "string",
    "string[]": "vector<string>",
    "boolean": "bool",
    "listNode": "ListNode*",
    "treeNode": "TreeNode*"
  }
};

module.exports = {
  HTTP_STATUS,
  SUBMISSION_STATUS,
  PROBLEM_DIFFICULTY,
  TYPE_MAP 
};