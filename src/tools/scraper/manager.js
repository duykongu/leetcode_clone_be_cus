const { getFreeProblemList, fetchAndSaveRawData } = require('./extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('./transformer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * PIPELINE CHÍNH: Nhận số lượng N bài cần cào từ CLI / Manager Terminal
 */
async function runBatchPipeline(limit = 50, category = "algorithms") {
    const selectedCategories = Array.isArray(category) ? category : [category];
    
    console.log(`\n==========================================`);
    console.log(`🚀 BẮT ĐẦU CÀO THEO LÔ: CHỌN ${limit} BÀI MỚI CHO MỖI DANH MỤC`);
    console.log(`📁 Danh mục sẽ chạy: ${selectedCategories.map(c => c.toUpperCase()).join(', ')}`);
    console.log(`==========================================`);

    let totalSuccess = 0, totalSkipped = 0, totalFailed = 0;

    for (const cat of selectedCategories) {
        console.log(`\n👉 Đang quét phân trang thu thập toàn bộ kho bài: [${cat.toUpperCase()}]`);
        
        let targetSlugs = [];
        let skip = 0;
        const BATCH = 100;
        let hasMore = true;

        // Vòng lặp thu thập phân trang sâu cho CLI
        while (hasMore) {
            const slugs = await getFreeProblemList(BATCH, skip, cat);
            if (!slugs || slugs.length === 0) {
                hasMore = false;
                break;
            }
            targetSlugs = targetSlugs.concat(slugs);
            if (slugs.length < BATCH) {
                hasMore = false;
                break;
            }
            skip += BATCH;
            await sleep(300);
        }

        console.log(`   → Tổng kho đề mục tìm thấy cho nhóm [${cat.toUpperCase()}]: ${targetSlugs.length} bài`);

        if (targetSlugs.length === 0) {
            console.log(`   ⚠ Không tìm thấy bài tập nào trong danh mục ${cat}`);
            continue;
        }

        let currentCatSuccess = 0;

        for (const slug of targetSlugs) {
            if (currentCatSuccess >= limit) {
                console.log(`   ✔ Đã gom đủ ${limit} bài mới cho nhóm [${cat.toUpperCase()}].`);
                break;
            }

            if (await isProblemExists(slug)) {
                totalSkipped++;
                continue;
            }
            
            if (await fetchAndSaveRawData(slug)) {
                if (await processJsonFile(slug)) {
                    currentCatSuccess++;
                    totalSuccess++;
                } else {
                    totalFailed++;
                }
            } else {
                totalFailed++;
            }

            await sleep(1500); 
        }
        
        await sleep(2000);
    }

    return { 
        success: true, 
        message: `Đã xử lý xong các danh mục được chọn!`,
        summary: { inserted: totalSuccess, skipped: totalSkipped, failed: totalFailed } 
    };
}

module.exports = { runBatchPipeline };const { getFreeProblemList, fetchAndSaveRawData } = require('./extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('./transformer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * PIPELINE CHÍNH: Nhận số lượng N bài cần cào từ CLI / Manager Terminal
 */
async function runBatchPipeline(limit = 50, category = "algorithms") {
    const selectedCategories = Array.isArray(category) ? category : [category];
    
    console.log(`\n==========================================`);
    console.log(`🚀 BẮT ĐẦU CÀO THEO LÔ: CHỌN ${limit} BÀI MỚI CHO MỖI DANH MỤC`);
    console.log(`📁 Danh mục sẽ chạy: ${selectedCategories.map(c => c.toUpperCase()).join(', ')}`);
    console.log(`==========================================`);

    let totalSuccess = 0, totalSkipped = 0, totalFailed = 0;

    for (const cat of selectedCategories) {
        console.log(`\n👉 Đang quét phân trang thu thập toàn bộ kho bài: [${cat.toUpperCase()}]`);
        
        let targetSlugs = [];
        let skip = 0;
        const BATCH = 100;
        let hasMore = true;

        // Vòng lặp thu thập phân trang sâu cho CLI
        while (hasMore) {
            const slugs = await getFreeProblemList(BATCH, skip, cat);
            if (!slugs || slugs.length === 0) {
                hasMore = false;
                break;
            }
            targetSlugs = targetSlugs.concat(slugs);
            if (slugs.length < BATCH) {
                hasMore = false;
                break;
            }
            skip += BATCH;
            await sleep(300);
        }

        console.log(`   → Tổng kho đề mục tìm thấy cho nhóm [${cat.toUpperCase()}]: ${targetSlugs.length} bài`);

        if (targetSlugs.length === 0) {
            console.log(`   ⚠ Không tìm thấy bài tập nào trong danh mục ${cat}`);
            continue;
        }

        let currentCatSuccess = 0;

        for (const slug of targetSlugs) {
            if (currentCatSuccess >= limit) {
                console.log(`   ✔ Đã gom đủ ${limit} bài mới cho nhóm [${cat.toUpperCase()}].`);
                break;
            }

            if (await isProblemExists(slug)) {
                totalSkipped++;
                continue;
            }
            
            if (await fetchAndSaveRawData(slug)) {
                if (await processJsonFile(slug)) {
                    currentCatSuccess++;
                    totalSuccess++;
                } else {
                    totalFailed++;
                }
            } else {
                totalFailed++;
            }

            await sleep(1500); 
        }
        
        await sleep(2000);
    }

    return { 
        success: true, 
        message: `Đã xử lý xong các danh mục được chọn!`,
        summary: { inserted: totalSuccess, skipped: totalSkipped, failed: totalFailed } 
    };
}

module.exports = { runBatchPipeline };