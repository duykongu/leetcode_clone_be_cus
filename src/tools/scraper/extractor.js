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
 * Lấy danh sách N bài tập miễn phí theo danh mục (Hỗ trợ cào cuốn chiếu từng đợt 50 bài)
 */
/**
 * Lấy danh sách N bài tập miễn phí theo danh mục (Sửa đổi payload filter chuẩn hóa Core LeetCode)
 */
async function getFreeProblemList(limit = 50, skip = 0, category = "algorithms") {
    // Bản đồ map chuẩn core LeetCode: danh mục tổng quát Algorithms dùng slug rỗng ""
    const categoryMap = { 
        "algorithms": "", 
        "javascript": "javascript",
        "": ""
    };
    
    const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        data { titleSlug isPaidOnly }
      }
    }`;

    try {
        const cleanCategory = String(category || "").toLowerCase().trim();
        const targetCategory = categoryMap[cleanCategory] !== undefined ? categoryMap[cleanCategory] : "";
        
        // CẤU HÌNH BIẾN CHUẨN: Giữ nguyên object filters trống '{}' cho cả 2 danh mục để kích hoạt kho bài ẩn danh
        const variables = { 
            categorySlug: targetCategory, 
            skip: parseInt(skip) || 0, 
            limit: parseInt(limit) || 50, 
            filters: {} 
        };

        // Tạo chuỗi mã token ngẫu nhiên thay đổi liên tục trên mỗi đợt skip để bẻ gãy hoàn toàn cache mạng
        const headersWithNoCache = {
            ...COMMON_HEADERS,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Bypass-Nonce': Math.random().toString(36).substring(7),
            'X-Pagination-Skip': String(skip)
        };

        const { data } = await axios.post(
            LEETCODE_GRAPHQL_URL, 
            { query, variables }, 
            { headers: headersWithNoCache }
        );

        if (data.errors) {
            console.error(`   [Extractor] ✘ API LeetCode báo lỗi tại vị trí skip ${skip}:`, data.errors[0].message);
            return [];
        }
        
        const res = data.data;
        return res?.problemsetQuestionList?.data?.filter(q => !q.isPaidOnly).map(q => q.titleSlug) || [];
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi kết nối lấy danh sách [${category}] ở vị trí skip ${skip}:`, error.message);
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
      }
    }`;

    try {
        const res = await fetchLeetCode(query, { titleSlug: slug });
        if (!res?.question) throw new Error("Bài tập Premium hoặc link lỗi");

        fs.writeFileSync(path.join(tempDir, `${slug}.json`), JSON.stringify(res.question, null, 2), 'utf-8');
        console.log(`   [Extractor] ✔ Đã cào và lưu thô: ${slug}.json`);
        return true;
    } catch (error) {
        console.error(`   [Extractor] ✘ Lỗi cào mạng bài ${slug}:`, error.message);
        return false;
    }
}

module.exports = { getFreeProblemList, fetchAndSaveRawData };