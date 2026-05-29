const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const COMMON_HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const tempDir = path.resolve(__dirname, '../../temp/scraper_data');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// TÍNH NĂNG MỚI: Lấy danh sách N bài tập miễn phí theo danh mục
async function getFreeProblemList(limit = 50, skip = 0, category = "algorithms") {
    const categoryMap = {
        "algorithms": ""
    };

    const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        data { titleSlug isPaidOnly }
      }
    }`;

    const variables = {
        categorySlug: categoryMap[category.toLowerCase()] ?? "", 
        skip: skip,
        limit: limit,
        filters: {} 
    };

    try {
        const response = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables }, { headers: COMMON_HEADERS });
        const list = response.data.data.problemsetQuestionList.data;
        
        // Lọc bỏ những bài bắt trả phí (Premium)
        return list.filter(q => !q.isPaidOnly).map(q => q.titleSlug);
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi lấy danh sách bài tập:`, error.message);
        return [];
    }
}

// Giữ nguyên hàm kéo chi tiết bài tập
async function fetchAndSaveRawData(slug) {
    const query = `
    query questionContent($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId title content difficulty metaData
        topicTags { name slug }
        codeSnippets { lang code }
      }
    }`;

    try {
        const response = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables: { titleSlug: slug } }, { headers: COMMON_HEADERS });
        const data = response.data.data.question;

        if (!data) throw new Error("Không lấy được dữ liệu từ API");

        const filePath = path.join(tempDir, `${slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        
        console.log(`   [Extractor] ✔ Đã cào và lưu thô: ${slug}.json`);
        return true;
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi cào mạng bài ${slug}:`, error.message);
        return false;
    }
}

module.exports = { getFreeProblemList, fetchAndSaveRawData };