/**
 * FILE: src/tools/scraper/extractor.js
 * Scrapes public LeetCode metadata and doocs/leetcode markdown through GitHub API.
 */
 
const axios = require('axios');
const fs = require('fs');
const path = require('path');
 
const tempDir = path.resolve(__dirname, '../../temp/scraper_data');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
 
const TARGET_LANGUAGES = ['cpp', 'python', 'java', 'javascript', 'typescript'];
const githubFolderCache = new Map();
let githubProblemListCache = null;
const slugFolderMap = new Map();
const slugIdMap = new Map();
const problemMap = new Map();
const currentMarkdownCache = new Map();
 
function getGitHubFolderRange(problemId) {
  const id = parseInt(problemId, 10);
  if (isNaN(id)) return null;
 
  const start = Math.floor(id / 100) * 100;
  const end = start + 99;
 
  return `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}/${String(id).padStart(4, '0')}`;
}
 
function getGitHubRangeFolder(problemId) {
  const id = parseInt(problemId, 10);
  if (isNaN(id)) return null;
 
  const start = Math.floor(id / 100) * 100;
  const end = start + 99;
 
  return `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
}
 
function getPaddedProblemId(problemId) {
  const id = parseInt(problemId, 10);
  if (isNaN(id)) return null;
 
  return String(id).padStart(4, '0');
}
 
function encodeGitHubPath(filePath) {
  return String(filePath || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}
 
function slugifyTitle(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
 
function parseGitHubProblemFolder(rangeFolder, folderName) {
  const match = String(folderName || '').match(/^(\d+)\.(.+)$/);
  if (!match) return null;
 
  const questionId = String(parseInt(match[1], 10));
  const title = match[2].trim();
  const slug = slugifyTitle(title);
 
  if (!questionId || !slug) return null;
 
  return {
    questionId,
    title,
    slug,
    folderPath: `${rangeFolder}/${folderName}`,
  };
}
 
function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.raw+json',
    'User-Agent': 'leetcode-ba-scraper',
  };
 
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
 
  return headers;
}
 
function githubJsonHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'leetcode-ba-scraper',
  };
 
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
 
  return headers;
}
 
function cleanChineseText(text) {
  if (!text) return '';

  return text
    .split('\n')
    .filter((line) => !/[\u4e00-\u9fa5]/.test(line))
    .join('\n');
}

function cleanSolutionComments(text) {
  if (!text) return '';
  return text.replace(/\/\*\*[\s\S]*?\*\//g, '').trim();
}
 
function parseReadmeFrontMatter(markdownText) {
  const frontMatterMatch = String(markdownText || '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontMatterMatch) return {};
 
  const frontMatter = frontMatterMatch[1];
  const result = {};
  const tagMatch = frontMatter.match(/tags:\s*\r?\n([\s\S]*?)(?:\r?\n\S|$)/);
  const difficultyMatch = frontMatter.match(/^difficulty:\s*(.+)$/m);
 
  if (difficultyMatch) {
    result.difficulty = difficultyMatch[1].trim();
  }
 
  if (tagMatch) {
    result.topicTags = tagMatch[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*-\s*(.+?)\s*$/)?.[1])
      .filter(Boolean)
      .map((name) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
  }
 
  return result;
}
 
/**
 * Bóc tách nội dung mô tả đề bài nằm giữa cặp thẻ comment của Doocs Leetcode
 */
function extractMarkdownSection(markdownText, sectionName) {
  const pattern = new RegExp(
    `<!--\\s*${sectionName}:start\\s*-->([\\s\\S]*?)<!--\\s*${sectionName}:end\\s*-->`,
    'i',
  );
  const match = String(markdownText || '').match(pattern);

  return match?.[1]?.trim() || '';
}
 
function normalizeLanguage(lang) {
  const value = String(lang || '').toLowerCase();
 
  if (value === 'c++' || value === 'cpp') return 'cpp';
  if (value === 'python' || value === 'python3') return 'python';
  if (value === 'javascript' || value === 'js') return 'javascript';
  if (value === 'typescript' || value === 'ts') return 'typescript';
  if (value === 'java') return 'java';
 
  return '';
}
 
function buildFallbackStarterCode(language) {
  const fallback = {
    cpp: 'class Solution {\npublic:\n    // Write your solution here\n};',
    python: 'class Solution:\n    # Write your solution here\n    pass',
    java: 'class Solution {\n    // Write your solution here\n}',
    javascript: '/**\n * Write your solution here\n */',
    typescript: '/**\n * Write your solution here\n */',
  };
 
  return fallback[language] || '// Starter code unavailable';
}
 
async function getQuestionDetail(slug) {
  try {
    const res = await axios.post('https://leetcode.com/graphql', {
      query: `
        query Q($s: String!) {
          question(titleSlug: $s) {
            questionId
            title
            content
            difficulty
            topicTags { name slug }
            codeSnippets { lang langSlug code }
            metaData
          }
        }`,
      variables: { s: slug },
    });
 
    return res.data?.data?.question || null;
  } catch (error) {
    console.error(`   [Extractor] Failed to get LeetCode metadata for ${slug}:`, error.message);
    return null;
  }
}
 
async function getFreeProblemList(limit = 100, skip = 0, rangeFolder = '0000-0099') {
  try {
    console.log(`   [Extractor] Đang lấy danh sách bài từ cụm thư mục: solution/${rangeFolder}`);
 
    const encodedPath = encodeGitHubPath(`solution/${rangeFolder}`);
    const url = `https://api.github.com/repos/doocs/leetcode/contents/${encodedPath}?ref=main`;
 
    const response = await axios.get(url, { headers: githubJsonHeaders() });
    const entries = Array.isArray(response.data) ? response.data : [];
 
    const problems = [];

    for (const entry of entries) {
      if (entry.type !== 'dir') continue;

      const parsed = parseGitHubProblemFolder(rangeFolder, entry.name);
      if (parsed) {
        problems.push(parsed);
        githubFolderCache.set(`${rangeFolder}/${getPaddedProblemId(parsed.questionId)}`, parsed.folderPath);
        slugFolderMap.set(parsed.slug, parsed.folderPath);
        slugIdMap.set(parsed.slug, parsed.questionId);
        problemMap.set(parsed.slug, parsed);
      }
    }
 
    problems.sort((a, b) => Number(a.questionId) - Number(b.questionId));
 
    const selected = problems.slice(parseInt(skip, 10), parseInt(skip, 10) + parseInt(limit, 10));
    return selected.map((q) => q.slug);
  } catch (error) {
    console.error(`   [Extractor] Thất bại khi lấy danh sách từ cụm ${rangeFolder}:`, error.message);
    return [];
  }
}
 
async function getGitHubProblemList() {
  if (githubProblemListCache) return githubProblemListCache;
 
  const rootUrl = 'https://api.github.com/repos/doocs/leetcode/contents/solution?ref=main';
  const rootResponse = await axios.get(rootUrl, { headers: githubJsonHeaders() });
  const rangeFolders = (Array.isArray(rootResponse.data) ? rootResponse.data : [])
    .filter((entry) => entry.type === 'dir' && /^\d{4}-\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
 
  const problems = [];
 
  for (const rangeFolder of rangeFolders) {
    const encodedPath = encodeGitHubPath(`solution/${rangeFolder}`);
    const url = `https://api.github.com/repos/doocs/leetcode/contents/${encodedPath}?ref=main`;
    const response = await axios.get(url, { headers: githubJsonHeaders() });
    const entries = Array.isArray(response.data) ? response.data : [];
 
    for (const entry of entries) {
      if (entry.type !== 'dir') continue;
 
      const parsed = parseGitHubProblemFolder(rangeFolder, entry.name);
      if (parsed) {
        problems.push(parsed);
        githubFolderCache.set(`${rangeFolder}/${getPaddedProblemId(parsed.questionId)}`, parsed.folderPath);
      }
    }
  }
 
  problems.sort((a, b) => Number(a.questionId) - Number(b.questionId));
  githubProblemListCache = problems;

  for (const problem of problems) {
    slugIdMap.set(problem.slug, problem.questionId);
    problemMap.set(problem.slug, problem);
  }

  return githubProblemListCache;
}
 
async function fetchMarkdownFromGitHub(folderPath) {
  const candidates = ['README_EN.md', 'README.md'];
 
  for (const fileName of candidates) {
    const encodedPath = encodeGitHubPath(`solution/${folderPath}/${fileName}`);
    const url = `https://api.github.com/repos/doocs/leetcode/contents/${encodedPath}?ref=main`;
 
    try {
      const response = await axios.get(url, { headers: githubHeaders() });
      const content = response.data;
 
      if (content && content.trim()) return content;
    } catch {
      // Tiếp tục tìm kiếm candidate tiếp theo
    }
  }
 
  return '';
}
 
async function resolveGitHubFolderPath(problemId) {
  const rangeFolder = getGitHubRangeFolder(problemId);
  const paddedId = getPaddedProblemId(problemId);
 
  if (!rangeFolder || !paddedId) return null;
 
  const cacheKey = `${rangeFolder}/${paddedId}`;
  if (githubFolderCache.has(cacheKey)) {
    return githubFolderCache.get(cacheKey);
  }
 
  try {
    const encodedPath = encodeGitHubPath(`solution/${rangeFolder}`);
    const url = `https://api.github.com/repos/doocs/leetcode/contents/${encodedPath}?ref=main`;
    const response = await axios.get(url, { headers: githubJsonHeaders() });
    const entries = Array.isArray(response.data) ? response.data : [];
    const found = entries.find((entry) => entry.type === 'dir' && String(entry.name).startsWith(`${paddedId}.`));
    const folderPath = found ? `${rangeFolder}/${found.name}` : `${rangeFolder}/${paddedId}`;
 
    githubFolderCache.set(cacheKey, folderPath);
    return folderPath;
  } catch {
    return `${rangeFolder}/${paddedId}`;
  }
}
 
async function resolveProblemId(slug) {
  const cachedId = slugIdMap.get(slug);
  if (cachedId) return cachedId;

  const githubProblem = await resolveGitHubProblem(slug);
  if (githubProblem?.questionId) return githubProblem.questionId;

  const detail = await getQuestionDetail(slug);
  if (!detail?.questionId) return null;

  slugIdMap.set(slug, detail.questionId);

  return detail.questionId;
}
 
async function resolveGitHubProblem(slug) {
  const cached = problemMap.get(slug);
  if (cached) return cached;

  const problems = await getGitHubProblemList();
  return problems.find((problem) => problem.slug === slug) || null;
}
 
async function fetchProblemMarkdown(slug) {
  const githubProblem = await resolveGitHubProblem(slug);
  const targetId = githubProblem?.questionId || await resolveProblemId(slug);
  const folderPath = githubProblem?.folderPath || await resolveGitHubFolderPath(targetId);
  if (!folderPath) return '';
 
  const markdownContent = await fetchMarkdownFromGitHub(folderPath);
 
  if (markdownContent) {
    currentMarkdownCache.set(slug, markdownContent);
  }
 
  return markdownContent;
}
 
async function fetchAndSaveRawData(slug) {
  try {
    const githubProblem = await resolveGitHubProblem(slug);
    const questionDetail = await getQuestionDetail(slug).catch(() => null);
    const targetId = githubProblem?.questionId || slugIdMap.get(slug);
    const folderPath = githubProblem?.folderPath || await resolveGitHubFolderPath(targetId);
 
    if (!folderPath) return false;

    slugIdMap.set(slug, targetId);

    const markdownContent = await fetchMarkdownFromGitHub(folderPath);
    if (!markdownContent || markdownContent.trim() === '') {
      throw new Error('GitHub markdown is empty or unavailable');
    }

    currentMarkdownCache.set(slug, markdownContent);
 
    const snippetMap = new Map();
    for (const snip of questionDetail?.codeSnippets || []) {
      const language = normalizeLanguage(snip.langSlug || snip.lang);
 
      if (language && TARGET_LANGUAGES.includes(language) && !snippetMap.has(language)) {
        snippetMap.set(language, snip.code);
      }
    }
 
    const readmeMeta = parseReadmeFrontMatter(markdownContent);
 
    const rawQuestionData = {
      questionId: targetId,
      title: githubProblem?.title || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      content: extractMarkdownSection(markdownContent, 'description') || markdownContent,
      rawMarkdown: markdownContent,
      difficulty: readmeMeta.difficulty || questionDetail?.difficulty || 'Medium',
      topicTags: readmeMeta.topicTags?.length ? readmeMeta.topicTags : questionDetail?.topicTags || [],
      metaData: questionDetail?.metaData || null,
      codeSnippets: TARGET_LANGUAGES.map((language) => ({
        lang: language,
        langSlug: language,
        code: snippetMap.get(language) || buildFallbackStarterCode(language),
      })),
    };
 
    fs.writeFileSync(path.join(tempDir, `${slug}.json`), JSON.stringify(rawQuestionData, null, 2), 'utf-8');
 
    console.log(`   [Extractor] Synced GitHub markdown: ${slug}.json`);
    return true;
  } catch (error) {
    console.error(`   [Extractor] Failed to fetch data for ${slug}:`, error.message);
    return false;
  }
}
 
async function fetchTargetSolutionCode(slug, targetLang) {
  const lang = normalizeLanguage(targetLang);
  if (!lang) return null;
 
  let markdownText = currentMarkdownCache.get(slug);
 
  if (!markdownText) {
    markdownText = await fetchProblemMarkdown(slug);
  }
 
  if (!markdownText) return null;
 
  const langTagsMap = {
    javascript: ['javascript', 'js'],
    typescript: ['typescript', 'ts'],
    python: ['python', 'py', 'python3'],
    java: ['java'],
    cpp: ['cpp', 'c++'],
  };
 
  for (const tag of langTagsMap[lang]) {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\`\`\`${escapedTag}(?:[^\\r\\n]*)[\\r\\n]+([\\s\\S]*?)\\s*\`\`\``, 'i');
    const match = markdownText.match(regex);

    if (match?.[1]) {
      return cleanSolutionComments(cleanChineseText(match[1].trim()));
    }
  }

return null;
}
 
module.exports = {
  getFreeProblemList,
  fetchAndSaveRawData,
  fetchTargetSolutionCode,
  getQuestionDetail,
  fetchProblemMarkdown,
  normalizeLanguage,
  buildFallbackStarterCode,
  TARGET_LANGUAGES,
};