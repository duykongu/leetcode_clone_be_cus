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
// config cho kiểu data
const TYPE_MAP = {
  "java": {
    "integer": "int", "integer[]": "int[]", "integer[][]": "int[][]",
    "long": "long", "long[]": "long[]", "long[][]": "long[][]",
    "double": "double", "double[]": "double[]", "double[][]": "double[][]",
    "float": "float", "float[]": "float[]", "float[][]": "float[][]",
    "string": "String", "string[]": "String[]", "string[][]": "String[][]",
    "character": "char", "character[]": "char[]", "character[][]": "char[][]",
    "boolean": "boolean", "boolean[]": "boolean[]", "boolean[][]": "boolean[][]",
    "listNode": "ListNode", "treeNode": "TreeNode"
  },
  "cpp": {
    "integer": "int", "integer[]": "vector<int>", "integer[][]": "vector<vector<int>>",
    "long": "long long", "long[]": "vector<long long>", "long[][]": "vector<vector<long long>>",
    "double": "double", "double[]": "vector<double>", "double[][]": "vector<vector<double>>",
    "float": "float", "float[]": "vector<float>", "float[][]": "vector<vector<float>>",
    "string": "string", "string[]": "vector<string>", "string[][]": "vector<vector<string>>",
    "character": "char", "character[]": "vector<char>", "character[][]": "vector<vector<char>>",
    "boolean": "bool", "boolean[]": "vector<bool>", "boolean[][]": "vector<vector<bool>>",
    "listNode": "ListNode*", "treeNode": "TreeNode*"
  }
};
module.exports = {
  HTTP_STATUS,
  SUBMISSION_STATUS,
  PROBLEM_DIFFICULTY,
  TYPE_MAP 
};