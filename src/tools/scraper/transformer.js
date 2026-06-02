/**
 * FILE: src/tools/scraper/transformer.js
 */
 
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
 
// Dùng để lấy bù metadata + codeSnippets từ LeetCode nếu extractor không fetch được
const { getQuestionDetail } = require('./extractor');
 
const prisma = new PrismaClient();
const tempDir = path.resolve(__dirname, '../../temp/scraper_data');
const TARGET_LANGUAGES = ['cpp', 'python', 'java', 'javascript', 'typescript'];
 
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
 
function normalizeSpace(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
 
function parseExampleText(text) {
  const normalized = normalizeSpace(text);
  const inputMatch = normalized.match(/Input:\s*([\s\S]*?)(?=\n?\s*Output:|$)/i);
  const outputMatch = normalized.match(/Output:\s*([\s\S]*?)(?=\n?\s*Explanation:|$)/i);
  const explanationMatch = normalized.match(/Explanation:\s*([\s\S]*)$/i);
 
  if (!inputMatch || !outputMatch) return null;
 
  return {
    input: normalizeSpace(inputMatch[1]),
    output: normalizeSpace(outputMatch[1]),
    explanation: explanationMatch ? normalizeSpace(explanationMatch[1]) : null,
  };
}
 
function parseDescriptionContent(content) {
  const $ = cheerio.load(content || '', null, false);
  const examples = [];
  const constraints = [];
 
  $('pre').each((i, el) => {
    const parsed = parseExampleText($(el).text());
    if (!parsed) return;
 
    examples.push({
      input: parsed.input,
      output: parsed.output,
      explanation: parsed.explanation,
      orderIndex: examples.length,
    });
 
    const prev = $(el).prev();
    if (/^Example\s*\d*\s*:?$/i.test(normalizeSpace(prev.text()))) {
      prev.remove();
    }
 
    $(el).remove();
  });
 
  $('p, strong, b, h1, h2, h3, h4').each((i, el) => {
    if (/^Example\s*\d*\s*:?$/i.test(normalizeSpace($(el).text()))) {
      $(el).remove();
    }
  });
 
  $('p, strong, b, h1, h2, h3, h4').each((i, el) => {
    if (!/^Constraints\s*:?$/i.test(normalizeSpace($(el).text()))) return;
 
    let next = $(el).next();
    $(el).remove();
 
    while (next.length) {
      const current = next;
      next = current.next();
 
      if (/^h[1-6]$/i.test(current[0]?.tagName || '')) {
        break;
      }
 
      if (current.is('ul, ol')) {
        current.find('li').each((_, li) => {
          const value = normalizeSpace($(li).text());
          if (value) constraints.push({ content: value, orderIndex: constraints.length });
        });
        current.remove();
        break;
      }
 
      if (normalizeSpace(current.text())) {
        break;
      }
 
      current.remove();
    }
  });
 
  $('p').each((i, el) => {
    if (!normalizeSpace($(el).text()) && $(el).children().length === 0) {
      $(el).remove();
    }
  });
 
  return {
    description: normalizeSpace($.html()),
    examples,
    constraints,
    testCases: examples.map((example) => ({
      input: example.input,
      expectedOutput: example.output,
      orderIndex: example.orderIndex,
      isHidden: false,
    })),
  };
}
 
function normalizeTag(tag) {
  const name = String(tag?.name || tag || '').trim();
  const slug = String(tag?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
 
  if (!name || !slug) return null;
  return { name, slug };
}
 
function uniqueTags(tags) {
  const seen = new Set();
  const result = [];
 
  for (const tag of tags) {
    if (seen.has(tag.slug)) continue;
    seen.add(tag.slug);
    result.push(tag);
  }
 
  return result;
}
 
function parseMetadata(metaData) {
  if (!metaData) return null;
  if (typeof metaData === 'object') return metaData;
 
  try {
    return JSON.parse(metaData);
  } catch {
    return null;
  }
}
 
async function deleteProblemGraph(tx, problemId) {
  await tx.testCase.deleteMany({ where: { problemId } });
  await tx.problemExample.deleteMany({ where: { problemId } });
  await tx.problemConstraint.deleteMany({ where: { problemId } });
  await tx.codeTemplate.deleteMany({ where: { problemId } });
  await tx.problemTag.deleteMany({ where: { problemId } });
  await tx.problem.delete({ where: { id: problemId } });
}
 
/**
 * 🛠 HÀM CHỈNH SỬA ID TỪ NGUỒN CÀO VỀ (CUSTOM PROBLEM ID)
 * Chuyển đổi định dạng ID từ nguồn cào (ví dụ "0001") thành chuỗi số thô nguyên bản ("1")
 */
function modifyProblemId(originalId) {
  const numericId = parseInt(originalId, 10);
  if (isNaN(numericId)) {
    return String(originalId).trim(); // Fallback nếu ID gốc không phải dạng số
  }
  
  // Trả về số thô nguyên bản dưới dạng chuỗi (Ví dụ: "0001" hoặc "01" -> "1")
  return String(numericId);
}
 
async function processJsonFile(slug) {
  const jsonPath = path.join(tempDir, `${slug}.json`);
  const errorLogPath = path.join(tempDir, `${slug}.error.log`);
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  if (!fs.existsSync(jsonPath)) {
    console.log(`   [Transformer] Skip: missing ${slug}.json`);
    return false;
  }
 
  try {
    const rawContent = fs.readFileSync(jsonPath, 'utf-8');
    const detail = JSON.parse(rawContent);
 
    // ─── LẤP ĐẦY METADATA + CODESNIPPETS NẾU EXTRACTOR BỎ TRỐNG ────────────
    // Xảy ra khi extractor chỉ dùng GitHub markdown (questionDetail = null),
    // không gọi LeetCode GraphQL → metaData và codeSnippets thực tế bị thiếu.
    const needsLeetCodeData = !detail.metaData || !detail.codeSnippets?.some(s => s.code && !s.code.includes('Write your solution'));
 
    if (needsLeetCodeData) {
      try {
        console.log(`   [Transformer] metaData trống — đang fetch bù từ LeetCode API: ${slug}`);
        const liveDetail = await getQuestionDetail(slug);
 
        if (liveDetail) {
          // Ghi đè metaData nếu đang null
          if (!detail.metaData && liveDetail.metaData) {
            detail.metaData = liveDetail.metaData;
          }
 
          // Ghi đè codeSnippets nếu đang là fallback
          if (liveDetail.codeSnippets?.length) {
            detail.codeSnippets = liveDetail.codeSnippets;
          }
 
          // Cập nhật topicTags nếu GitHub không parse được
          if ((!detail.topicTags?.length) && liveDetail.topicTags?.length) {
            detail.topicTags = liveDetail.topicTags;
          }
 
          // Ghi lại file JSON để lần sau không cần fetch lại
          fs.writeFileSync(jsonPath, JSON.stringify({ ...detail }, null, 2), 'utf-8');
          console.log(`   [Transformer] ✔ Đã lấp đầy metadata cho: ${slug}`);
        } else {
          console.warn(`   [Transformer] ⚠ LeetCode API không trả về dữ liệu cho: ${slug}`);
        }
      } catch (fetchErr) {
        // Không crash pipeline — tiếp tục với dữ liệu hiện có
        console.warn(`   [Transformer] ⚠ Fetch bù thất bại cho ${slug}:`, fetchErr.message);
      }
    }
    // ────────────────────────────────────────────────────────────────────────
 
    // Bóc tách Description, Examples, Constraints từ Content Markdown
    const structuredContent = parseDescriptionContent(detail.content || '');
 
    const allTags = [
      { name: 'Algorithms', slug: 'algorithms' },
      ...(detail.topicTags || []),
    ].map(normalizeTag).filter(Boolean);
    const uniqueProblemTags = uniqueTags(allTags);
 
    const diffMap = { Easy: 0, Medium: 1, Hard: 2 };
    const savedSolutions = detail._solutions || {}; // Nhận tập hợp solutions từ phase 2 truyền sang
    const templateMap = new Map();
    
    const rawQuestionId = String(detail.questionId || '').trim();
    if (!rawQuestionId) {
      throw new Error(`Missing LeetCode questionId for ${slug}`);
    }
 
    // 🔥 Biến đổi ID từ "0001" thành "1" dưới dạng chuỗi (Khớp CHAR(36) trong DB)
    const problemId = modifyProblemId(rawQuestionId);
 
    // Chuẩn bị dữ liệu Code Template kèm cả SOLUTION CODE bóc được từ MD
    for (const snip of detail.codeSnippets || []) {
      const language = normalizeLanguage(snip.langSlug || snip.lang);
 
      if (!language || !TARGET_LANGUAGES.includes(language) || templateMap.has(language)) {
        continue;
      }
 
      templateMap.set(language, {
        language,
        starterCode: snip.code || buildFallbackStarterCode(language),
        solutionCode: savedSolutions[language] || null, // Lưu trực tiếp giải pháp
      });
    }
 
    // Đảm bảo tạo đủ bản ghi cho cả 5 ngôn ngữ đích trong DB
    for (const language of TARGET_LANGUAGES) {
      if (!templateMap.has(language)) {
        templateMap.set(language, {
          language,
          starterCode: buildFallbackStarterCode(language),
          solutionCode: savedSolutions[language] || null,
        });
      }
    }
 
    const templatesToCreate = Array.from(templateMap.values());
 
    await prisma.$transaction(async (tx) => {
      // Kiểm tra trùng lặp dựa trên slug và ID mới đã được chuẩn hóa ("1")
      const existingBySlug = await tx.problem.findUnique({
        where: { slug },
        select: { id: true },
      });
 
      const existingById = await tx.problem.findUnique({
        where: { id: problemId },
        select: { id: true },
      });
 
      const idsToDelete = Array.from(new Set([
        existingBySlug?.id,
        existingById?.id,
      ].filter(Boolean)));
 
      for (const id of idsToDelete) {
        await deleteProblemGraph(tx, id);
      }
 
      // Lưu trữ đồng bộ đề bài, ràng buộc, tags và lời giải vào DB
      await tx.problem.create({
        data: {
          id: problemId, // Ghi nhận giá trị chuỗi số thô (Ví dụ: "1") vào trường CHAR(36)
          title: detail.title,
          slug,
          description: structuredContent.description,
          difficulty: diffMap[detail.difficulty] ?? 1,
          isActive: true,
          metadata: parseMetadata(detail.metaData),
          testCases: { create: structuredContent.testCases },
          examples: { create: structuredContent.examples },
          constraints: { create: structuredContent.constraints },
          problemTags: {
            create: uniqueProblemTags.map((tag) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: tag.slug },
                  create: { name: tag.name, slug: tag.slug },
                },
              },
            })),
          },
          codeTemplates: { create: templatesToCreate },
        },
      });
    });
 
    // Xóa file tạm JSON nếu nạp DB thành công hoàn toàn
    fs.unlinkSync(jsonPath);
    if (fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
    console.log(`   [Transformer] Saved DB data for ${slug} with raw string ID: "${problemId}"`);
    return true;
  } catch (error) {
    // Nếu ghi DB lỗi -> để lại file JSON nháp tại temp kèm log lỗi chi tiết
    const errorMsg = `[${new Date().toISOString()}] DB PERSIST ERROR: ${error.message}\nSTACK:\n${error.stack}\n\n`;
    fs.writeFileSync(errorLogPath, errorMsg, 'utf-8');
    console.error(`   [Transformer] Failed to process ${slug}; see ${slug}.error.log`);
    return false;
  }
}
 
async function isProblemExists(slug) {
  const found = await prisma.problem.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}
 
const disconnectDB = async () => await prisma.$disconnect();
 
module.exports = { processJsonFile, disconnectDB, isProblemExists };