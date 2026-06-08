const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = [
  'google/gemini-2.5-flash-lite',
  'qwen/qwen3-30b-a3b',
  'mistralai/mistral-small-3.1-24b-instruct',
];
const MAX_RETRIES = 2;
const TIMEOUT = 90000;

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function truncate(str, max) {
  if (!str) return str;
  return str.length > max ? str.substring(0, max) : str;
}

async function generateSolution(slug) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log(`   [AI] ⚠ Bỏ qua ${slug}: chưa set OPENROUTER_API_KEY`);
    return false;
  }

  const skip = await prisma.problemSolution.findFirst({
    where: { problem: { slug } },
  });
  if (skip) {
    console.log(`   [AI] ⏭ ${slug}: đã có solution, bỏ qua`);
    return true;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { codeTemplates: true, testCases: { take: 3 } },
  });

  if (!problem) {
    console.log(`   [AI] ⚠ Không tìm thấy problem: ${slug}`);
    return false;
  }

  const prompt = buildPrompt(problem);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`   [AI] 🔄 Retry ${attempt}/${MAX_RETRIES} cho ${slug}...`);
      await sleep(2000 * attempt);
    }

    for (const model of MODELS) {
      try {
        console.log(`   [AI] 🤖 Đang sinh solution cho ${slug} (model: ${model})...`);

        const res = await axios.post(OPENROUTER_URL, {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://leetcode-clone.local',
          },
          timeout: TIMEOUT,
        });

        const raw = res.data.choices[0].message.content.trim();
        const parsed = tryParseJson(raw);
        if (!parsed) {
          console.log(`   [AI] ⚠ JSON lỗi, thử model khác...`);
          continue;
        }

        await saveSolution(problem, parsed);
        console.log(`   [AI] ✔ Đã lưu solution cho ${slug}`);
        return true;

      } catch (err) {
        const detail = extractError(err);
        console.log(`   [AI] ✘ ${model} thất bại: ${detail}`);
      }
    }
  }

  console.error(`   [AI] ✘ Tất cả model đều thất bại cho ${slug}`);
  return false;
}

function buildPrompt(problem) {
  const difficultyLabel = ['Easy', 'Medium', 'Hard'][problem.difficulty] || 'Unknown';
  const cleanDescription = problem.description.replace(/<[^>]*>/g, '').substring(0, 3000);

  const codeExamples = problem.codeTemplates
    .map(t => `Language: ${t.language}\n\`\`\`${t.language}\n${t.starterCode}\n\`\`\``)
    .join('\n\n');

  const testExamples = problem.testCases
    .map((tc, i) => `Example ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.expectedOutput}`)
    .join('\n\n');

  return `You are a LeetCode solution writer. Solve this problem and return ONLY a JSON object. Write the explanation in Vietnamese.

Title: ${problem.title}
Difficulty: ${difficultyLabel}
Description: ${cleanDescription}

${testExamples ? `Examples:\n${testExamples}` : ''}

Starter code:\n${codeExamples}

Return this exact JSON:
{
  "explanation": "giải thích chi tiết bằng tiếng Việt, chia đoạn rõ ràng, mỗi đoạn cách nhau 2 dòng newline \\n\\n",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "code": {
    "javascript": "function ...",
    "python": "def ...",
    "java": "public class ...",
    "cpp": "int ..."
  }
}`;
}

function tryParseJson(raw) {
  let cleaned = raw.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 10) {
      try {
        return JSON.parse(cleaned.substring(0, lastBrace + 1));
      } catch {
        return extractPartialResult(cleaned);
      }
    }
    return null;
  }
}

function extractPartialResult(text) {
  const result = { explanation: '', timeComplexity: '', spaceComplexity: '', code: {} };

  const expMatch = text.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (expMatch) result.explanation = expMatch[1];

  const timeMatch = text.match(/"timeComplexity"\s*:\s*"([^"]+)"/);
  if (timeMatch) result.timeComplexity = timeMatch[1];

  const spaceMatch = text.match(/"spaceComplexity"\s*:\s*"([^"]+)"/);
  if (spaceMatch) result.spaceComplexity = spaceMatch[1];

  for (const lang of ['javascript', 'python', 'java', 'cpp']) {
    const codeMatch = text.match(new RegExp(`"${lang}"\\s*:\\s*"((?:[^"\\x5c]|\\x5c.)*)"`));
    if (codeMatch) result.code[lang] = codeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  if (result.explanation) return result;
  return null;
}

async function saveSolution(problem, parsed) {
  const explanation = stripHtml(parsed.explanation || '');
  const timeComplexity = truncate(stripHtml(parsed.timeComplexity || ''), 50);
  const spaceComplexity = truncate(stripHtml(parsed.spaceComplexity || ''), 50);
  const code = parsed.code || {};

  const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
  const codeSnippets = {};
  const templateUpdates = [];

  for (const lang of supportedLanguages) {
    const snippet = (code && code[lang]) || '';
    if (snippet) {
      codeSnippets[lang] = snippet;
      const template = problem.codeTemplates.find(t => t.language === lang);
      if (template) {
        templateUpdates.push(
          prisma.codeTemplate.update({
            where: { id: template.id },
            data: { solutionCode: snippet },
          })
        );
      }
    }
  }

  const contentHtml = buildSolutionHtml({
    title: problem.title,
    difficulty: ['Easy', 'Medium', 'Hard'][problem.difficulty] || 'Unknown',
    explanation,
    timeComplexity,
    spaceComplexity,
    codeSnippets,
  });

  await prisma.$transaction([
    prisma.problemSolution.create({
      data: {
        problemId: problem.id,
        explanation: explanation || '',
        timeComplexity: timeComplexity || null,
        spaceComplexity: spaceComplexity || null,
        contentHtml,
        codeSnippets,
      },
    }),
    ...templateUpdates,
  ]);
}

function buildSolutionHtml({ title, difficulty, explanation, timeComplexity, spaceComplexity, codeSnippets }) {
  const diffStyles = {
    Easy: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    Medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    Hard: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };
  const ds = diffStyles[difficulty] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

  const langLabels = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++' };

  const paragraphs = (explanation || '')
    .split(/\n{2,}/)
    .map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  const codeCards = Object.entries(codeSnippets)
    .filter(([, code]) => code)
    .map(([lang, code]) => `
<details class="sc-dtls"${lang === 'javascript' ? ' open' : ''}>
  <summary class="sc-smry">${langLabels[lang] || lang}</summary>
  <div class="sc-cb"><pre>${escapeHtml(code)}</pre></div>
</details>`)
    .join('\n');

  return `<div class="sc">

  <div class="sc-top">
    <h2 class="sc-name">${escapeHtml(title)}</h2>
    <span class="sc-lvl" style="color:${ds.color};background:${ds.bg};border:1px solid ${ds.border}">${difficulty}</span>
  </div>

  ${paragraphs ? `
  <div class="sc-sec">
    <div class="sc-sec-h">
      <span class="sc-bar"></span>
      <span>Approach</span>
    </div>
    <div class="sc-txt">${paragraphs}</div>
  </div>` : ''}

  ${timeComplexity || spaceComplexity ? `
  <div class="sc-sec">
    <div class="sc-sec-h">
      <span class="sc-bar"></span>
      <span>Complexity</span>
    </div>
    <div class="sc-cplx">
      ${timeComplexity ? `<div class="sc-cplx-item"><span class="sc-cplx-lbl">Time</span><span class="sc-cplx-val">${escapeHtml(timeComplexity)}</span></div>` : ''}
      ${spaceComplexity ? `<div class="sc-cplx-item"><span class="sc-cplx-lbl">Space</span><span class="sc-cplx-val">${escapeHtml(spaceComplexity)}</span></div>` : ''}
    </div>
  </div>` : ''}

  ${codeCards ? `
  <div class="sc-sec">
    <div class="sc-sec-h">
      <span class="sc-bar"></span>
      <span>Code</span>
    </div>
    <div class="sc-codes">${codeCards}</div>
  </div>` : ''}

</div>`;
}

function extractError(err) {
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.response?.data?.error) return JSON.stringify(err.response.data.error);
  if (err.message) return err.message;
  if (err.code) return `HTTP ${err.code}`;
  return 'Unknown error';
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { generateSolution };
