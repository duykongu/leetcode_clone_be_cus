const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COCOLINK_BASE_URL = 'https://www.cocolink.ai/v1';
const AI_MODEL = 'deepseek-v4-flash';
const MAX_RETRIES = 2;
const TIMEOUT = 120000;

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function truncate(str, max) {
  if (!str) return str;
  return str.length > max ? str.substring(0, max) : str;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
        return null;
      }
    }
    return null;
  }
}

function extractError(err) {
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.response?.data?.error) return JSON.stringify(err.response.data.error);
  if (err.message) return err.message;
  return 'Unknown error';
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchSolutionFromAI(problem) {
  const apiKey = process.env.COCOLINK_API_KEY;
  if (!apiKey) {
    console.log('   [Solution] ⚠ Chưa set COCOLINK_API_KEY');
    return null;
  }

  const prompt = buildPrompt(problem);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`   [Solution] 🔄 Retry ${attempt}/${MAX_RETRIES}...`);
      await sleep(2000 * attempt);
    }

    try {
      const res = await axios.post(`${COCOLINK_BASE_URL}/chat/completions`, {
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 16384,
        response_format: { type: 'json_object' },
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      });

      const raw = res.data.choices[0].message.content.trim();
      const parsed = tryParseJson(raw);
      if (!parsed) {
        console.log('   [Solution] ⚠ JSON lỗi, retry...');
        continue;
      }

      return {
        explanation: parsed.explanation || `Solution for ${problem.title}`,
        timeComplexity: parsed.timeComplexity || null,
        spaceComplexity: parsed.spaceComplexity || null,
        code: parsed.code || {},
      };
    } catch (err) {
      console.log(`   [Solution] ✘ Lỗi AI: ${extractError(err)}`);
    }
  }

  return null;
}

function buildPrompt(problem) {
  const difficultyLabel = ['Easy', 'Medium', 'Hard'][problem.difficulty] || 'Unknown';
  const cleanDescription = problem.description.replace(/<[^>]*>/g, '').substring(0, 3000);

  const codeExamples = problem.codeTemplates
    .map(t => `Language: ${t.language}\n\`\`\`${t.language}\n${t.starterCode}\n\`\`\``)
    .join('\n\n');

  return `You are a LeetCode solution writer. Solve this problem and return ONLY a JSON object. Write the explanation in Vietnamese.

Title: ${problem.title}
Difficulty: ${difficultyLabel}
Description: ${cleanDescription}

Starter code:
${codeExamples}

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

async function generateSolution(slug) {
  const existing = await prisma.problemSolution.findFirst({
    where: { problem: { slug } },
  });
  if (existing) {
    console.log(`   [Solution] ⏭ ${slug}: đã có solution, bỏ qua`);
    return true;
  }

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { codeTemplates: true },
  });

  if (!problem) {
    console.log(`   [Solution] ⚠ Không tìm thấy problem: ${slug}`);
    return false;
  }

  console.log(`   [Solution] 🤖 Đang sinh solution cho ${slug} bằng AI...`);

  const result = await fetchSolutionFromAI(problem);
  if (!result) {
    console.log(`   [Solution] ⚠ ${slug}: AI không sinh được solution`);
    return false;
  }

  await saveSolution(problem, result);
  console.log(`   [Solution] ✔ Đã lưu solution cho ${slug}`);
  return true;
}

async function saveSolution(problem, parsed) {
  const explanation = stripHtml(parsed.explanation || '');
  const timeComplexity = parsed.timeComplexity ? truncate(stripHtml(parsed.timeComplexity), 50) : null;
  const spaceComplexity = parsed.spaceComplexity ? truncate(stripHtml(parsed.spaceComplexity), 50) : null;
  const code = parsed.code || {};

  const codeSnippets = {};
  const templateUpdates = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    const snippet = code[lang] || '';
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
    .filter(([, c]) => c)
    .map(([lang, c]) => `
<details class="sc-dtls"${lang === 'javascript' ? ' open' : ''}>
  <summary class="sc-smry">${langLabels[lang] || lang}</summary>
  <div class="sc-cb"><pre>${escapeHtml(c)}</pre></div>
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

module.exports = { generateSolution };
