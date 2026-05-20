const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// Cấu hình Header để tránh bị LeetCode chặn
const COMMON_HEADERS = {
    'Content-Type': 'application/json',
    'Referer': 'https://leetcode.com/problemset/all/',
    'Origin': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getFreeProblemList(limit = 50, skip = 0, category = "algorithms") {
    // Bản đồ quy đổi Category sang Slug chuẩn của LeetCode
    const categoryMap = {
        "algorithms": "",
        "database": "database-problems",
        "javascript": "javascript",
        "pandas": "pandas",
        "shell": "shell"
    };

    const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        data {
          titleSlug
          isPaidOnly
        }
      }
    }`;

    const variables = {
        categorySlug: categoryMap[category.toLowerCase()] ?? "", // Lấy từ map, nếu không thấy thì mặc định là thuật toán
        skip: skip,
        limit: limit,
        filters: {} 
    };

    try {
        const response = await axios.post(LEETCODE_GRAPHQL_URL, 
            { query, variables }, 
            { headers: COMMON_HEADERS }
        );

        if (response.data.errors) {
            console.error(`Lỗi GraphQL [${category}]:`, response.data.errors[0].message);
            return [];
        }

        return response.data.data.problemsetQuestionList.data.filter(q => !q.isPaidOnly);
    } catch (error) {
        console.error(`Lỗi khi gọi danh sách [${category}]:`, error.message);
        return [];
    }
}
// 2. Hàm lấy chi tiết bài tập (bao gồm cả Tags)
async function getProblemDetail(slug) {
    const query = `
    query questionContent($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        content
        difficulty
        topicTags {
          name
          slug
        }
        codeSnippets {
          lang
          code
        }
      }
    }`;

    const response = await axios.post(LEETCODE_GRAPHQL_URL, { query, variables: { titleSlug: slug } }, { headers: COMMON_HEADERS });
    return response.data.data.question;
}

// 3. Hàm chính xử lý cào dữ liệu
async function main() {
    const CATEGORIES = ["algorithms", "database", "javascript", "pandas"];
    const BATCH_SIZE = 50; 
    const MAX_PER_CATEGORY = 1000; 

    try {
        for (const cat of CATEGORIES) {
            console.log(`\n==========================================`);
            console.log(`🚀 BẮT ĐẦU CÀO NHÓM: ${cat.toUpperCase()}`);
            console.log(`==========================================`);

            for (let skip = 0; skip < MAX_PER_CATEGORY; skip += BATCH_SIZE) {
                const questions = await getFreeProblemList(BATCH_SIZE, skip, cat);
                if (!questions || questions.length === 0) break;

                for (const q of questions) {
                    try {
                        console.log(`[${cat}] Đang xử lý: ${q.titleSlug}...`);
                        const detail = await getProblemDetail(q.titleSlug);
                        if (!detail || !detail.content) continue;

                        // 1. Parse Test Cases
                        const $ = cheerio.load(detail.content);
                        const examples = [];
                        $('pre').each((i, el) => {
                            const text = $(el).text();
                            if (text.includes('Input:') && text.includes('Output:')) {
                                try {
                                    let input = text.split('Input:')[1].split('Output:')[0].trim();
                                    let outputPart = text.split('Output:')[1];
                                    let output = outputPart.includes('Explanation:') 
                                        ? outputPart.split('Explanation:')[0].trim() 
                                        : outputPart.trim();
                                    examples.push({ input, expectedOutput: output, orderIndex: i, isHidden: false });
                                } catch (e) {}
                            }
                        });

                        // 2. Logic xử lý Tag (Đã gộp và sửa lỗi khai báo trùng)
                       let catTagName = "";
switch(cat) {
    case "algorithms": catTagName = "Algorithms"; break;
    case "database": catTagName = "Database"; break;
    case "pandas": catTagName = "Pandas"; break;
    case "javascript": catTagName = "JavaScript"; break;
    default: catTagName = cat.charAt(0).toUpperCase() + cat.slice(1);
}

// 2. Gộp Tag lớn VÀ các Tag nhỏ từ LeetCode
// detail.topicTags là mảng các tag nhỏ như [{name: "String", slug: "string"}, ...]
const allTags = [
    { name: catTagName, slug: cat }, // Thêm tag lớn
    ...detail.topicTags              // Thêm tất cả tag nhỏ
];

                        const diffMap = { "Easy": 0, "Medium": 1, "Hard": 2 };

                        // 3. Upsert vào Database
                        await prisma.problem.upsert({
                            where: { slug: q.titleSlug },
                            update: {
                                description: detail.content,
                                difficulty: diffMap[detail.difficulty] ?? 1,
                                testCases: { deleteMany: {}, create: examples },
                                problemTags: {
                                    deleteMany: {},
                                    create: allTags.map(tag => ({
                                        tag: {
                                            connectOrCreate: {
                                                where: { slug: tag.slug },
                                                create: { name: tag.name, slug: tag.slug }
                                            }
                                        }
                                    }))
                                }
                            },
                            create: {
                                id: detail.questionId,
                                title: detail.title,
                                slug: q.titleSlug,
                                description: detail.content,
                                difficulty: diffMap[detail.difficulty] ?? 1,
                                isActive: true,
                                testCases: { create: examples },
                                problemTags: {
                                    create: allTags.map(tag => ({
                                        tag: {
                                            connectOrCreate: {
                                                where: { slug: tag.slug },
                                                create: { name: tag.name, slug: tag.slug }
                                            }
                                        }
                                    }))
                                },
                                codeTemplates: {
                                    create: detail.codeSnippets
                                        .map(snip => {
                                            let lang = '';
                                            const l = snip.lang.toLowerCase();
                                            if (l.includes('javascript')) lang = 'javascript';
                                            else if (l.includes('cpp')) lang = 'cpp';
                                            else if (l === 'java') lang = 'java';
                                            return lang ? { language: lang, starterCode: snip.code } : null;
                                        }).filter(t => t !== null)
                                }
                            }
                        });

                        console.log(`   ✔ Lưu thành công: ${detail.title} (${examples.length} test cases)`);
                        await sleep(2000); 

                    } catch (err) {
                        console.error(`   ✘ Lỗi bài ${q.titleSlug}:`, err.message);
                    }
                }
                console.log(`--- Xong đợt bài từ ${skip} đến ${skip + BATCH_SIZE} của ${cat} ---`);
                await sleep(5000); 
            }
        }
        console.log("\n🎉 CHÚC MỪNG! ĐÃ HOÀN TẤT TẤT CẢ DỮ LIỆU.");
    } catch (error) {
        console.error("LỖI TỔNG THỂ:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();