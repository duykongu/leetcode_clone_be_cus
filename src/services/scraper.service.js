require('dotenv').config(); // ✅ ÉP ĐỌC FILE .env TỪ THƯ MỤC GỐC
 
/**
 * FILE: src/services/scraper.service.js
 *
 * PIPELINE 3 GIAI ĐOẠN (Cuốn chiếu theo cụm thư mục từ GitHub):
 * Phase 1 — COLLECT
 * Phase 2 — SCRAPE
 * Phase 3 — PERSIST
 */
const EventEmitter = require('events');
const fs           = require('fs');
const path         = require('path');
const { PrismaClient } = require('@prisma/client');
 
const extractorPath   = path.resolve(__dirname, '../tools/scraper/extractor');
const transformerPath = path.resolve(__dirname, '../tools/scraper/transformer');
 
const { getFreeProblemList, fetchAndSaveRawData, fetchTargetSolutionCode } = require(extractorPath);
const { processJsonFile, isProblemExists }                                 = require(transformerPath);
 
const prisma = new PrismaClient();
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));
 
// ✅ LOGIC TĂNG TỐC TỰ ĐỘNG NẾU CÓ TOKEN
const HAS_TOKEN = !!process.env.GITHUB_TOKEN;
const PROBLEM_DELAY = HAS_TOKEN ? 1200 : 60000; // 1.2s nếu có token, 60s nếu không có
const BATCH_DELAY = HAS_TOKEN ? 300 : 10000;
 
const TEMP_DIR   = path.resolve(__dirname, '../temp/scraper_data');
const RETRY_LOG  = path.join(TEMP_DIR, 'retry.log');
 
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
 
const TARGET_LANGUAGES = ['cpp', 'python', 'java', 'javascript', 'typescript'];
 
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
 
// ─────────────────────────────────────────────
// JOB STATE
// ─────────────────────────────────────────────
 
const scraperEmitter = new EventEmitter();
scraperEmitter.setMaxListeners(50);
 
let activeJob = null;
 
function getJobStatus() {
  if (!activeJob) return { running: false };
  return {
    running      : activeJob.done ? false : true,
    jobId        : activeJob.id,
    startTime    : activeJob.startTime,
    endTime      : activeJob.endTime ?? null,
    limit        : activeJob.limit,
    categories   : activeJob.categories,
    phase        : activeJob.phase,
    inserted     : activeJob.inserted,
    skipped      : activeJob.skipped,
    failed       : activeJob.failed,
    totalQueued  : activeJob.totalQueued,
    currentIndex : activeJob.currentIndex,
    done         : activeJob.done,
    log          : activeJob.log?.slice(-40) ?? [],
  };
}
 
function stopJob() {
  if (activeJob) activeJob.stopRequested = true;
}
 
// ─────────────────────────────────────────────
// EMIT HELPER
// ─────────────────────────────────────────────
 
function emit(event, data) {
  scraperEmitter.emit(event, data);
  if (activeJob) {
    activeJob.log = activeJob.log || [];
    activeJob.log.push({ event, data, ts: Date.now() });
    if (activeJob.log.length > 500) activeJob.log.shift();
  }
}
 
// ─────────────────────────────────────────────
// RETRY LOG HELPER
// ─────────────────────────────────────────────
 
function appendRetryLog(slug, reason) {
  const line = `${new Date().toISOString()} | ${slug} | ${reason}\n`;
  fs.appendFileSync(RETRY_LOG, line, 'utf-8');
}
 
// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────
 
async function runBatchScrape({ limit = 100, mode = 'all', categories = ['algorithms'] }) {
  if (activeJob && !activeJob.done) {
    return { success: false, message: 'Đang có tác vụ chạy. Vui lòng dừng hoặc chờ hoàn tất.' };
  }
 
  const parsedLimit = limit >= 3000 ? 3000 : limit;
 
  activeJob = {
    id            : Date.now(),
    startTime     : new Date().toISOString(),
    limit         : parsedLimit,
    mode          : mode,
    categories,
    phase         : 'idle',
    done          : false,
    stopRequested : false,
    inserted      : 0,
    skipped       : 0,
    failed        : 0,
    totalQueued   : 0,
    currentIndex  : 0,
    log           : [],
  };
 
  _runPipeline(activeJob).catch((err) => emit('error', { message: err.message }));
  return { success: true, jobId: activeJob.id };
}
 
// ─────────────────────────────────────────────
// PIPELINE CHÍNH
// ─────────────────────────────────────────────
 
async function _runPipeline(job) {
  // Cảnh báo nếu vẫn chưa gắn Token
  if (!HAS_TOKEN) {
    emit('log', {
      message: '⚠️ GITHUB_TOKEN chưa được cấu hình. Hệ thống tự động kích hoạt "Chế độ chậm" (chờ 60s/bài) để tránh lỗi giới hạn API.',
    });
  } else {
    emit('log', {
      message: '🚀 GITHUB_TOKEN hợp lệ. Đã kích hoạt chế độ cào TỐC ĐỘ CAO (1.2s/bài).',
    });
  }
 
  emit('start', {
    jobId      : job.id,
    limit      : job.limit,
    categories : job.categories,
    message    : `🚀 Pipeline khởi động — mục tiêu cuốn chiếu: ${job.limit} bài mới từ các cụm thư mục GitHub.`,
  });
 
  try {
    job.phase = 'collect';
    emit('phase', { phase: 'collect', message: '📋 Phase 1/3 — Đang quét danh sách thư mục cuốn chiếu từ GitHub...' });
 
    const allSlugs = await _collectSlugs(job);
 
    if (allSlugs.length === 0) {
      emit('log', { message: '⚠ Không tìm thấy bài mới nào cần xử lý trong các cụm thư mục. Kết thúc sớm.' });
      return;
    }
 
    emit('log', {
      message: `✔ Phase 1 hoàn tất — Đã gom ${allSlugs.length} bài mới, bắt đầu tiến trình cào dữ liệu chi tiết.`,
    });
 
    job.totalQueued = allSlugs.length;
 
    job.phase = 'scrape';
    emit('phase', { phase: 'scrape', message: `🔍 Phase 2/3 — Bắt đầu cào ${allSlugs.length} bài tuần tự...` });
 
    const readySlugs = await _scrapeSlugs(job, allSlugs);
 
    emit('log', {
      message: `✔ Phase 2 hoàn tất — ${readySlugs.length} bài sẵn sàng để ghi vào Database.`,
    });
 
    job.phase = 'persist';
    emit('phase', { phase: 'persist', message: `💾 Phase 3/3 — Đang thực hiện lưu dữ liệu bài tập vào Database...` });
 
    await _persistSlugs(job, readySlugs);
 
  } catch (err) {
    emit('error', { message: `💥 Lỗi pipeline nghiêm trọng: ${err.message}` });
  } finally {
    _finalizeJob(job);
  }
}
 
// ══════════════════════════════════════════════════════════════
// PHASE 1 — COLLECT
// ══════════════════════════════════════════════════════════════
async function _collectSlugs(job) {
  const BATCH       = 100;
  const newSlugs    = [];
  const queuedSlugs = new Set();
 
  for (const range of TARGET_RANGES) {
    if (job.stopRequested || newSlugs.length >= job.limit) break;
 
    emit('log', { message: `📁 [Collect] Quét cụm thư mục: solution/${range}` });
 
    let skip    = 0;
    let hasMore = true;
 
    while (hasMore && newSlugs.length < job.limit) {
      if (job.stopRequested) break;
 
      const slugBatch = await getFreeProblemList(BATCH, skip, range);
 
      if (!slugBatch || slugBatch.length === 0) {
        hasMore = false;
        break;
      }
 
      emit('log', { message: `   → Nhận được ${slugBatch.length} bài từ cụm ${range}, tiến hành kiểm tra DB...` });
 
      for (const slug of slugBatch) {
        if (newSlugs.length >= job.limit) break;
 
        if (queuedSlugs.has(slug)) continue;
 
        const exists = await isProblemExists(slug);
        if (exists && job.mode !== 'solutions_only') {
          job.skipped++;
          continue;
        }
 
        queuedSlugs.add(slug);
        newSlugs.push(slug);
      }
 
      emit('log', { message: `   → Đã gom tích lũy được: ${newSlugs.length}/${job.limit} bài mới.` });
 
      if (slugBatch.length < BATCH) {
        hasMore = false;
        break;
      }
 
      skip += BATCH;
      await sleep(BATCH_DELAY);
    }
  }
 
  return newSlugs;
}
 
// ══════════════════════════════════════════════════════════════
// PHASE 2 — SCRAPE
// ══════════════════════════════════════════════════════════════
async function _scrapeSlugs(job, slugs) {
  const readySlugs = [];
 
  for (let i = 0; i < slugs.length; i++) {
    if (job.stopRequested) {
      emit('log', { message: '🛑 Dừng tiến trình theo yêu cầu của Admin.' });
      break;
    }
 
    const slug = slugs[i];
    job.currentIndex = i + 1;
 
    emit('progress', {
      phase        : 'scrape',
      current      : job.currentIndex,
      total        : job.totalQueued,
      inserted     : job.inserted,
      skipped      : job.skipped,
      failed       : job.failed,
      slug,
      message      : `🔍 [${job.currentIndex}/${job.totalQueued}] Đang xử lý cấu trúc bài: ${slug}`,
    });
 
    const rawOk = await fetchAndSaveRawData(slug);
    if (!rawOk) {
      job.failed++;
      appendRetryLog(slug, 'fetchAndSaveRawData thất bại');
      emit('progress', {
        phase   : 'scrape',
        current : job.currentIndex,
        total   : job.totalQueued,
        inserted: job.inserted,
        skipped : job.skipped,
        failed  : job.failed,
        slug,
        result  : 'failed',
        message : `❌ [${job.currentIndex}] ${slug}: lỗi cào file thô từ GitHub → xem retry.log`,
      });
      await sleep(PROBLEM_DELAY);
      continue;
    }
 
    const jsonPath      = path.join(TEMP_DIR, `${slug}.json`);
    const solutions     = {};
    let   solutionCount = 0;
 
    for (const lang of TARGET_LANGUAGES) {
      if (job.stopRequested) break;
 
      const code = await fetchTargetSolutionCode(slug, lang);
      if (code) {
        solutions[lang] = code;
        solutionCount++;
      }
      await sleep(300);
    }
 
    try {
      const raw       = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      raw._solutions  = solutions;
      fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2), 'utf-8');
    } catch (err) {
      job.failed++;
      appendRetryLog(slug, `Ghi solutions vào tệp JSON lỗi: ${err.message}`);
      emit('progress', {
        phase   : 'scrape',
        current : job.currentIndex,
        total   : job.totalQueued,
        inserted: job.inserted,
        skipped : job.skipped,
        failed  : job.failed,
        slug,
        result  : 'failed',
        message : `❌ [${job.currentIndex}] ${slug}: Lỗi xử lý cấu trúc mảng giải → bỏ qua`,
      });
      await sleep(PROBLEM_DELAY);
      continue;
    }
 
    readySlugs.push(slug);
 
    emit('progress', {
      phase          : 'scrape',
      current        : job.currentIndex,
      total          : job.totalQueued,
      inserted       : job.inserted,
      skipped        : job.skipped,
      failed         : job.failed,
      slug,
      result         : 'inserted',
      solutionCount,
      message        : `✔ [${job.currentIndex}] ${slug}: Quét xong — Thu được ${solutionCount}/${TARGET_LANGUAGES.length} ngôn ngữ giải pháp`,
    });
 
    await sleep(PROBLEM_DELAY);
  }
 
  return readySlugs;
}
 
// ══════════════════════════════════════════════════════════════
// PHASE 3 — PERSIST
// ══════════════════════════════════════════════════════════════
async function _persistSlugs(job, slugs) {
  for (let i = 0; i < slugs.length; i++) {
    if (job.stopRequested) {
      emit('log', { message: '🛑 Dừng tiến trình ghi dữ liệu theo yêu cầu.' });
      break;
    }
 
    const slug     = slugs[i];
 
    emit('progress', {
      phase   : 'persist',
      current : i + 1,
      total   : slugs.length,
      inserted: job.inserted,
      skipped : job.skipped,
      failed  : job.failed,
      slug,
      message : `💾 [${i + 1}/${slugs.length}] Đang đồng bộ hóa Database: ${slug}`,
    });
 
    const saved = await processJsonFile(slug);
    
    if (!saved) {
      job.failed++;
      appendRetryLog(slug, 'processJsonFile (transformer) thất bại');
      emit('progress', {
        phase   : 'persist',
        current : i + 1,
        total   : slugs.length,
        inserted: job.inserted,
        skipped : job.skipped,
        failed  : job.failed,
        slug,
        result  : 'failed',
        message : `❌ [${i + 1}] ${slug}: Lỗi ghi mô hình thực thể vào DB → xem lỗi`,
      });
      continue;
    }
 
    job.inserted++;
 
    emit('progress', {
      phase    : 'persist',
      current  : i + 1,
      total    : slugs.length,
      inserted : job.inserted,
      skipped  : job.skipped,
      failed   : job.failed,
      slug,
      result   : 'inserted',
      message  : `✔ [${i + 1}] ${slug}: Đã lưu trữ dữ liệu bền vững thành công (Tổng: ${job.inserted} bài)`,
    });
  }
}
 
// ─────────────────────────────────────────────
// FINALIZE
// ─────────────────────────────────────────────
 
function _finalizeJob(job) {
  job.done    = true;
  job.phase   = 'done';
  job.endTime = new Date().toISOString();
 
  const retryExists = fs.existsSync(RETRY_LOG);
 
  emit('done', {
    jobId    : job.id,
    inserted : job.inserted,
    skipped  : job.skipped,
    failed   : job.failed,
    message  : [
      `🎉 Pipeline hoàn tất!`,
      `✔ Thêm mới thành công: ${job.inserted}`,
      `⏭ Đã tồn tại sẵn: ${job.skipped}`,
      `❌ Gặp lỗi: ${job.failed}`,
      retryExists ? `📄 Chi tiết bài lỗi tại: src/temp/scraper_data/retry.log` : '',
    ].filter(Boolean).join(' | '),
  });
}
 
module.exports = { runBatchScrape, getJobStatus, stopJob, scraperEmitter };