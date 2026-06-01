const { getFreeProblemList, fetchAndSaveRawData } = require('./extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('./transformer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * PIPELINE CHÍNH: Hỗ trợ cào theo số lượng HOẶC cào toàn bộ kho dữ liệu
 * @param {number} limit - Số lượng bài cần cào mỗi loại (Nếu truyền 0 => Tự động CÀO TOÀN BỘ)
 * @param {string|string[]} category - Danh mục lựa chọn (Có thể truyền chuỗi "algorithms" hoặc mảng ["algorithms", "database"])
 */
async function runBatchPipeline(limit = 50, category = "algorithms") {
    const ALL_CATEGORIES = ["algorithms", "database", "javascript", "pandas", "shell"];

    // TRƯỜNG HỢP 1: Người dùng cấu hình "CÀO TOÀN BỘ" (limit = 0)
    if (limit === 0) {
        console.log(`\n==================================================`);
        console.log(`🚨 KÍCH HOẠT CHẾ ĐỘ SIÊU CÀO TỪ UI: VÉT TOÀN BỘ KHO LEETCODE`);
        console.log(`==================================================`);
        
        let successCount = 0, skippedCount = 0, failedCount = 0;

        try {
            for (const cat of ALL_CATEGORIES) {
                console.log(`\n📁 >>> DI CHUYỂN VÀO KHO: ${cat.toUpperCase()} <<<`);
                let skip = 0, hasMore = true, BATCH_SIZE = 100;

                while (hasMore) {
                    const targetSlugs = await getFreeProblemList(BATCH_SIZE, skip, cat);
                    if (!targetSlugs || targetSlugs.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const slug of targetSlugs) {
                        if (await isProblemExists(slug)) { skippedCount++; continue; }

                        if (await fetchAndSaveRawData(slug)) {
                            if (await processJsonFile(slug)) successCount++;
                            else failedCount++;
                        } else { failedCount++; }
                        await sleep(1500); 
                    }
                    skip += BATCH_SIZE;
                    await sleep(3000); 
                }
            }
        } catch (err) {
            console.error("❌ LỖI TRONG TIẾN TRÌNH SIÊU CÀO:", err.message);
        }

        return { 
            success: true, 
            message: "Hoàn tất siêu cào toàn bộ hệ thống!", 
            summary: { inserted: successCount, skipped: skippedCount, failed: failedCount } 
        };
    }

    // TRƯỜNG HỢP 2: Cào theo giới hạn số lượng bài trên MỖI DANH MỤC
    // Chuẩn hóa tham số category: Nếu UI truyền lên mảng thì giữ nguyên, nếu truyền string thì bọc thành mảng [string]
    const selectedCategories = Array.isArray(category) ? category : [category];
    
    console.log(`\n==========================================`);
    console.log(`🚀 BẮT ĐẦU CÀO THEO LÔ: CHỌN ${limit} BÀI CHO MỖI DANH MỤC`);
    console.log(`📁 Danh mục sẽ chạy: ${selectedCategories.map(c => c.toUpperCase()).join(', ')}`);
    console.log(`==========================================`);

    let totalSuccess = 0, totalSkipped = 0, totalFailed = 0;

    for (const cat of selectedCategories) {
        console.log(`\n👉 Đang xử lý danh mục: [${cat.toUpperCase()}]`);
        
        // Đọc danh sách slugs dôi ra phòng trừ trùng lặp
        const targetSlugs = await getFreeProblemList(limit * 3, 0, cat);

        if (!targetSlugs || targetSlugs.length === 0) {
            console.log(`   ⚠ Không tìm thấy bài tập nào trong danh mục ${cat}`);
            continue;
        }

        let currentCatSuccess = 0;

        for (const slug of targetSlugs) {
            // Kiểm tra KPI của danh mục HIỆN TẠI
            if (currentCatSuccess >= limit) {
                console.log(`   ✔ Đã gom đủ ${limit} bài mới cho nhóm [${cat.toUpperCase()}]. Chuyển danh mục tiếp theo.`);
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
        
        // Nghỉ ngắn 2 giây đổi không khí trước khi nhảy sang danh mục tiếp theo
        await sleep(2000);
    }

    return { 
        success: true, 
        message: `Đã xử lý xong các danh mục được chọn!`,
        summary: { inserted: totalSuccess, skipped: totalSkipped, failed: totalFailed } 
    };
}

module.exports = { runBatchPipeline };