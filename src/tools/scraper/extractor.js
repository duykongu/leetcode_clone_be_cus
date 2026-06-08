const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const COMMON_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

const tempDir = path.resolve(__dirname, '../../temp/scraper_data');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Hàm tiện ích để gọi GraphQL rút gọn code lặp lại
async function fetchLeetCode(query, variables) {
    const { data } = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, { headers: COMMON_HEADERS });
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data;
}

/**
 * Lấy danh sách N bài tập miễn phí theo danh mục
 */
async function getFreeProblemList(limit = 50, skip = 0, category = "algorithms") {
    const categoryMap = { database: "database-problems", javascript: "javascript", pandas: "pandas", shell: "shell" };
    const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: {}) {
        data { titleSlug isPaidOnly }
      }
    }`;

    try {
        const res = await fetchLeetCode(query, { categorySlug: categoryMap[category.toLowerCase()] || "", skip, limit });
        return res?.problemsetQuestionList?.data?.filter(q => !q.isPaidOnly).map(q => q.titleSlug) || [];
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi lấy danh sách bài tập [${category}]:`, error.message);
        return [];
    }
}

/**
 * Cào chi tiết một bài tập và lưu file JSON thô
 */
async function fetchAndSaveRawData(slug) {
    const query = `
    query questionContent($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId title content difficulty metaData
        topicTags { name slug }
        codeSnippets { lang code }
        solution {
          content
          canSeeDetail
        }
      }
    }`;

    try {
        const res = await fetchLeetCode(query, { titleSlug: slug });
        if (!res?.question) throw new Error("Bài tập Premium hoặc link lỗi");

        const question = res.question;

        // Lưu solution content (editorial HTML) vào metadata riêng
        if (question.solution?.content) {
            question.solutionHtml = question.solution.content;
        }
        delete question.solution;

        fs.writeFileSync(path.join(tempDir, `${slug}.json`), JSON.stringify(question, null, 2), 'utf-8');
        console.log(`   [Extractor] ✔ Đã cào và lưu thô: ${slug}.json`);
        return true;
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi cào mạng bài ${slug}:`, error.message);
        return false;
    }
}

/**
 * Parse HTML editorial content to extract code blocks per language
 */
function parseSolutionCodeBlocks(html) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const solutions = {};

    $('pre').each((i, el) => {
        const code = $(el).text().trim();
        if (!code) return;

        // Xác định ngôn ngữ từ class của <pre> hoặc <code>
        let lang = '';
        const classAttr = $(el).attr('class') || '';
        const codeEl = $(el).find('code');
        const codeClass = codeEl.attr('class') || '';

        const allClasses = (classAttr + ' ' + codeClass).toLowerCase();
        if (allClasses.includes('javascript') || allClasses.includes('js')) lang = 'javascript';
        else if (allClasses.includes('typescript') || allClasses.includes('ts')) lang = 'typescript';
        else if (allClasses.includes('cpp') || allClasses.includes('c++')) lang = 'cpp';
        else if (allClasses.includes('java')) lang = 'java';
        else if (allClasses.includes('python')) lang = 'python';
        else if (allClasses.includes('go')) lang = 'go';
        else if (allClasses.includes('rust')) lang = 'rust';
        else if (i === 0) lang = 'cpp'; // fallback: block đầu tiên là C++

        if (lang && !solutions[lang]) {
            solutions[lang] = code;
        }
    });

    return solutions;
}

module.exports = { getFreeProblemList, fetchAndSaveRawData };