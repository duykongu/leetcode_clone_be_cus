const { getFreeProblemList, fetchAndSaveRawData } = require('./extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('./transformer'); // Đã import thêm isProblemExists

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPipeline() {
    console.log(`\n==========================================`);
    console.log(`🚀 BẮT ĐẦU CÀO TỰ ĐỘNG 50 BÀI THUẬT TOÁN`);
    console.log(`==========================================`);
    
    const BATCH_SIZE = 50;
    console.log(`\nĐang tải danh sách ${BATCH_SIZE} bài tập từ LeetCode...`);
    
    // Lấy 50 bài thuật toán
    const targetSlugs = await getFreeProblemList(BATCH_SIZE, 0, "algorithms");

    if (targetSlugs.length === 0) {
        console.log("Không tìm thấy bài tập nào. Hủy tiến trình.");
        process.exit(1);
    }

    console.log(`Đã tìm thấy ${targetSlugs.length} bài. Bắt đầu rà soát và xử lý:`);

    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < targetSlugs.length; i++) {
        const slug = targetSlugs[i];
        console.log(`\n--- [${i + 1}/${targetSlugs.length}] Xử lý: ${slug} ---`);
        
        // KIỂM TRA TRÙNG LẶP
        const exists = await isProblemExists(slug);
        if (exists) {
            console.log(`   [Manager] ⏭ Bài tập đã tồn tại trong Database. Bỏ qua!`);
            skippedCount++;
            continue; // Nhảy ngay sang bài tiếp theo
        }
        
        // Nếu chưa có, mới bắt đầu cào data (Extractor)
        const isExtracted = await fetchAndSaveRawData(slug);
        
        if (isExtracted) {
            // Xử lý và nạp DB (Transformer)
            const isProcessed = await processJsonFile(slug);
            if (isProcessed) successCount++;
        }

        // Tôn trọng Rate Limit của LeetCode
        await sleep(1500); 
    }

    console.log(`\n==========================================`);
    console.log(`🎉 PIPELINE ĐÃ HOÀN TẤT!`);
    console.log(`- Thêm mới thành công: ${successCount} bài.`);
    console.log(`- Bỏ qua (đã tồn tại): ${skippedCount} bài.`);
    console.log(`==========================================`);
    
    await disconnectDB();
    process.exit(0);
}

runPipeline();