const { PrismaClient, Prisma } = require('@prisma/client');
const { getFreeProblemList, fetchAndSaveRawData, getQuestionDetail } = require('./extractor');
const { processJsonFile, isProblemExists } = require('./transformer');
 
const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 
const TARGET_RANGES = [
  '0000-0099', '0100-0199', '0200-0299', '0300-0399', '0400-0499',
  '0500-0599', '0600-0699', '0700-0799', '0800-0899', '0900-0999',
  '1000-1099', '1100-1199', '1200-1299', '1300-1399', '1400-1499',
  '1500-1599', '1600-1699', '1700-1799', '1800-1899', '1900-1999',
  '2000-2099', '2100-2199', '2200-2299', '2300-2399', '2400-2499',
  '2500-2599', '2600-2699', '2700-2799', '2800-2899', '2900-2999',
  '3000-3099', '3100-3199', '3200-3299', '3300-3399', '3400-3499',
  '3500-3599', '3600-3699', '3700-3799', '3800-3899', '3900-3999'
];
 
/**
 * Hàm cập nhật metadata cho các bài bị thiếu
 */
async function updateMissingMetadata() {
  console.log("🔍 Đang tìm kiếm các bài tập bị thiếu metadata...");
  
  const missing = await prisma.problem.findMany({
    where: { metadata: { equals: Prisma.JsonNull } },
    select: { slug: true }
  });
 
  if (missing.length === 0) {
    console.log("✅ Tất cả bài tập đã có metadata!");
    return;
  }
 
  console.log(`📋 Tìm thấy ${missing.length} bài cần cập nhật.`);
 
  for (const item of missing) {
    try {
      console.log(`🔄 Đang fetch metadata cho: ${item.slug}`);
      const detail = await getQuestionDetail(item.slug);
      
      if (detail && detail.metaData) {
        await prisma.problem.update({
          where: { slug: item.slug },
          data: { 
            metadata: JSON.parse(detail.metaData) 
          }
        });
        console.log(`   ✔️ Đã cập nhật thành công: ${item.slug}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
    } catch (error) {
      console.error(`   ❌ Lỗi khi cập nhật ${item.slug}:`, error.message);
    }
  }
}
 
/**
 * Pipeline chạy batch chính
 */
async function runBatchPipeline(limit = 50) {
  console.log('\n==========================================');
  console.log(`START BATCH SCRAPER: ${limit} NEW PROBLEMS (CLI)`);
  console.log('==========================================');
 
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
 
  for (const range of TARGET_RANGES) {
    if (totalSuccess >= limit) break;
 
    console.log(`\nScanning range: [${range}]`);
 
    let skip = 0;
    const batchSize = 100;
    let hasMore = true;
 
    while (hasMore) {
      const slugs = await getFreeProblemList(batchSize, skip, range);
      if (!slugs || slugs.length === 0) break;
 
      for (const slug of slugs) {
        if (totalSuccess >= limit) break;
 
        if (await isProblemExists(slug)) {
          totalSkipped++;
          continue;
        }
 
        if (await fetchAndSaveRawData(slug)) {
          if (await processJsonFile(slug)) {
            totalSuccess++;
            console.log(`   ✔ Đã crawl xong: ${slug} (${totalSuccess}/${limit})`);
          } else {
            totalFailed++;
          }
        } else {
          totalFailed++;
        }
        await sleep(1500);
      }
 
      if (slugs.length < batchSize) {
        hasMore = false;
        break;
      }
      skip += batchSize;
      await sleep(300);
    }
  }
 
  return {
    success: true,
    message: 'Finished processing pipeline.',
    summary: { inserted: totalSuccess, skipped: totalSkipped, failed: totalFailed },
  };
}
 
// Logic điều khiển CLI
async function run() {
  const args = process.argv;
 
  if (args.includes('--fix-metadata')) {
    await updateMissingMetadata();
    await prisma.$disconnect();
    process.exit(0);
  } else {
    // Chạy mặc định hoặc gọi hàm runBatchPipeline
    console.log("⚙️ Đang chạy chế độ cào mặc định...");
    await runBatchPipeline();
    await prisma.$disconnect();
    process.exit(0);
  }
}
 
run().catch(console.error);