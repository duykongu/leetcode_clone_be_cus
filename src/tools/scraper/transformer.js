const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const tempDir = path.resolve(__dirname, '../../temp/scraper_data');

async function processJsonFile(slug) {
    const jsonPath = path.join(tempDir, `${slug}.json`);
    const errorLogPath = path.join(tempDir, `${slug}.error.log`);

    if (!fs.existsSync(jsonPath)) {
        console.log(`   [Transformer] ⚠ Bỏ qua: Không tìm thấy ${slug}.json`);
        return false;
    }

    try {
        // Đọc dữ liệu từ file JSON
        const rawContent = fs.readFileSync(jsonPath, 'utf-8');
        const detail = JSON.parse(rawContent);

        // 1. Phân tích HTML
        const $ = cheerio.load(detail.content);
        const examples = [];
        $('pre').each((i, el) => {
            const text = $(el).text();
            if (text.includes('Input:') && text.includes('Output:')) {
                let input = text.split('Input:')[1].split('Output:')[0].trim();
                let outputPart = text.split('Output:')[1];
                let output = outputPart.includes('Explanation:') ? outputPart.split('Explanation:')[0].trim() : outputPart.trim();
                examples.push({ input, expectedOutput: output, orderIndex: i, isHidden: false });
            }
        });

        // 2. Chuẩn bị dữ liệu phụ
        const allTags = [{ name: "Algorithms", slug: "algorithms" }, ...(detail.topicTags || [])];
        const diffMap = { "Easy": 0, "Medium": 1, "Hard": 2 };
        
        const seenLanguages = new Set();
        const templatesToCreate = (detail.codeSnippets || [])
            .map(snip => {
                let lang = '';
                const l = snip.lang.toLowerCase();
                if (l === 'javascript') lang = 'javascript';
                else if (l === 'typescript') lang = 'typescript';
                else if (l === 'cpp' || l === 'c++') lang = 'cpp';
                else if (l === 'java') lang = 'java';
                else if (l === 'python' || l === 'python3') lang = 'python';
                
                if (!lang || seenLanguages.has(lang)) return null;
                seenLanguages.add(lang);
                return { language: lang, starterCode: snip.code };
            }).filter(t => t !== null);

        // 3. Database Transaction
        const existingProblem = await prisma.problem.findUnique({ where: { slug: slug } });
        if (existingProblem) {
            await prisma.testCase.deleteMany({ where: { problemId: existingProblem.id } });
            await prisma.codeTemplate.deleteMany({ where: { problemId: existingProblem.id } });
            await prisma.problemTag.deleteMany({ where: { problemId: existingProblem.id } });
            await prisma.problem.delete({ where: { id: existingProblem.id } });
        }

        await prisma.problem.create({
            data: {
                id: detail.questionId,
                title: detail.title,
                slug: slug,
                description: detail.content,
                difficulty: diffMap[detail.difficulty] ?? 1,
                isActive: true,
                metadata: detail.metaData ? JSON.parse(detail.metaData) : null,
                testCases: { create: examples },
                problemTags: {
                    create: allTags.map(tag => ({
                        tag: {
                            connectOrCreate: { where: { slug: tag.slug }, create: { name: tag.name, slug: tag.slug } }
                        }
                    }))
                },
                codeTemplates: { create: templatesToCreate }
            }
        });

        // ✅ THÀNH CÔNG: XÓA TIÊU HỦY FILE JSON VÀ FILE LỖI (NẾU CÓ)
        fs.unlinkSync(jsonPath);
        if (fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
        console.log(`   [Transformer] ✔ Lưu DB và Xóa file thành công: ${slug}`);
        return true;

    } catch (error) {
        // ❌ THẤT BẠI: GIỮ LẠI FILE JSON, GHI LOG LỖI XUỐNG FILE
        const errorMsg = `[${new Date().toISOString()}] LỖI: ${error.message}\nSTACK TRACE:\n${error.stack}\n\n`;
        fs.appendFileSync(errorLogPath, errorMsg, 'utf-8');
        console.error(`   [Transformer] ✘ Lỗi xử lý ${slug}. Đã ghi vào file error.log!`);
        return false;
    }
}
    async function isProblemExists(slug) {
    const existingProblem = await prisma.problem.findUnique({ 
        where: { slug: slug },
        select: { id: true } // Chỉ lấy ID cho nhẹ, không tải toàn bộ bài
    });
    return existingProblem !== null;

}

// Hàm dọn dẹp Prisma khi tắt
const disconnectDB = async () => await prisma.$disconnect();

module.exports = { processJsonFile, disconnectDB, isProblemExists };