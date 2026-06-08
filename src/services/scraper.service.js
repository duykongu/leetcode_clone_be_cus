/**
 * FILE: src/services/scraper.service.js
 *
 * Service quản lý tiến trình cào bài tập.
 * Dùng EventEmitter để đẩy progress real-time ra SSE endpoint.
 */

const EventEmitter = require('events');
const { getFreeProblemList, fetchAndSaveRawData } = require('../tools/scraper/extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('../tools/scraper/transformer');
const { generateSolution } = require('./ai.service');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Interruptible sleep — kiểm tra stopRequested mỗi 200ms
const cancellableSleep = async (ms, job) => {
  const step = 200;
  let remaining = ms;
  while (remaining > 0) {
    if (job?.stopRequested) return;
    await new Promise(r => setTimeout(r, Math.min(step, remaining)));
    remaining -= step;
  }
};

const AI_CONCURRENCY = 5;
const SCRAPE_CONCURRENCY = 3;

// Singleton emitter — Controller subscribe vào đây để gửi SSE
const scraperEmitter = new EventEmitter();
scraperEmitter.setMaxListeners(50);

// Trạng thái toàn cục của job đang chạy (chỉ 1 job tại một thời điểm)
let activeJob = null;

/**
 * Trả về trạng thái job hiện tại (dùng cho GET /scraper/status)
 */
function getJobStatus() {
  if (!activeJob) return { running: false };
  return { running: true, ...activeJob };
}

function stopJob() {
  if (activeJob) {
    activeJob.stopRequested = true;
  }
}

/**
 * Hàm emit helper — gửi event ra emitter VÀ cập nhật activeJob
 */
function emit(event, data) {
  scraperEmitter.emit(event, data);
  if (activeJob) {
    // Ghi vào log của job để SSE client mới connect vẫn lấy được history
    activeJob.log = activeJob.log || [];
    activeJob.log.push({ event, data, ts: Date.now() });
    if (activeJob.log.length > 500) activeJob.log.shift(); // giới hạn bộ nhớ
  }
}

/**
 * Chạy pipeline cào batch:
 * - limit: số bài tối đa cần cào mới (bỏ qua bài đã tồn tại)
 * - categories: mảng các danh mục ['algorithms','database',...]
 */
async function runBatchScrape({ limit = 50, categories = ['algorithms'] }) {
  if (activeJob && !activeJob.done) {
    return { success: false, message: 'Đang có job đang chạy. Vui lòng đợi hoặc dừng trước.' };
  }

  activeJob = {
    id: Date.now(),
    startTime: new Date().toISOString(),
    limit,
    categories,
    done: false,
    stopRequested: false,
    inserted: 0,
    skipped: 0,
    failed: 0,
    totalQueued: 0,
    currentIndex: 0,
    log: [],
  };

  // Chạy async - không await để trả về ngay cho HTTP response
  _executePipeline(activeJob).catch((err) => {
    emit('error', { message: err.message });
  });

  return { success: true, jobId: activeJob.id };
}

async function _executePipeline(job) {
  const CATEGORIES_MAP = {
    algorithms: '',
    database: 'database-problems',
    javascript: 'javascript',
    pandas: 'pandas',
    shell: 'shell',
  };

  emit('start', {
    jobId: job.id,
    limit: job.limit,
    categories: job.categories,
    message: `🚀 Bắt đầu job cào: ${job.limit} bài, danh mục: ${job.categories.join(', ')}`,
  });

  try {
    // --- Bước 1: Thu thập danh sách slug từ tất cả category được chọn ---
    let allSlugs = [];

    for (const cat of job.categories) {
      if (job.stopRequested) break;

      emit('log', { message: `📁 Đang lấy danh sách bài từ danh mục: ${cat.toUpperCase()}...` });

      const BATCH = 200; // lấy 200 slug mỗi lần gọi API để đảm bảo đủ bài sau khi lọc
      let skip = 0;
      let catSlugs = [];
      let hasMore = true;

      while (hasMore && catSlugs.length < job.limit * 2) {
        const slugs = await getFreeProblemList(BATCH, skip, cat);
        if (!slugs || slugs.length === 0) { hasMore = false; break; }
        catSlugs = catSlugs.concat(slugs);
        if (slugs.length < BATCH) { hasMore = false; break; }
        skip += BATCH;
        await sleep(800);
      }

      emit('log', { message: `   → Tìm thấy ${catSlugs.length} bài miễn phí trong [${cat}]` });
      allSlugs = allSlugs.concat(catSlugs);
    }

    // Deduplicate
    allSlugs = [...new Set(allSlugs)];
    job.totalQueued = allSlugs.length;

    emit('log', { message: `📋 Tổng danh sách slug thu thập: ${allSlugs.length} bài` });

    // --- Bước 2: Lọc slug chưa có trong DB, giới hạn theo limit ---
    const slugsToProcess = [];
    for (const slug of allSlugs) {
      if (slugsToProcess.length >= job.limit) break;
      const exists = await isProblemExists(slug);
      if (!exists) slugsToProcess.push(slug);
    }

    job.totalNew = slugsToProcess.length;
    job.skipped = allSlugs.length - slugsToProcess.length;
    emit('log', { message: `🆕 Số bài cần cào mới: ${slugsToProcess.length} (bỏ qua ${job.skipped} bài đã có)` });

    // --- Bước 3: Cào song song với SCRAPE_CONCURRENCY workers ---
    const aiPromises = [];
    let aiSlotCount = 0;
    const aiSlotResolvers = [];
    const waitForAiSlot = () => {
      if (aiSlotCount < AI_CONCURRENCY || job.stopRequested) return Promise.resolve();
      return new Promise(r => { aiSlotResolvers.push(r); });
    };
    const releaseAiSlot = () => {
      if (aiSlotResolvers.length > 0) aiSlotResolvers.shift()();
    };

    let workerIndex = 0;
    const runWorker = async () => {
      while (!job.stopRequested) {
        const i = workerIndex++;
        if (i >= slugsToProcess.length) break;

        if (job.stopRequested) break;
        const slug = slugsToProcess[i];

        if (job.stopRequested) break;
        const extracted = await fetchAndSaveRawData(slug);
        if (!extracted) {
          job.failed++;
          emit('progress', {
            current: i + 1, total: slugsToProcess.length,
            inserted: job.inserted, skipped: job.skipped, failed: job.failed,
            slug, result: 'failed',
            message: `❌ [${i + 1}] ${slug}: lỗi cào mạng`,
          });
          await cancellableSleep(2000, job);
          continue;
        }

        if (job.stopRequested) break;
        const saved = await processJsonFile(slug);
        if (saved) {
          job.inserted++;
          emit('progress', {
            current: i + 1, total: slugsToProcess.length,
            inserted: job.inserted, skipped: job.skipped, failed: job.failed,
            slug, result: 'inserted',
            message: `✔ [${i + 1}] ${slug}: thêm mới`,
          });

          // AI non‑blocking, tối đa AI_CONCURRENCY
          if (!job.stopRequested) {
            await waitForAiSlot();
            if (!job.stopRequested) {
              const p = generateSolution(slug).finally(() => {
                aiSlotCount--;
                releaseAiSlot();
              });
              aiSlotCount++;
              aiPromises.push(p);
            }
          }
        } else {
          job.failed++;
          emit('progress', {
            current: i + 1, total: slugsToProcess.length,
            inserted: job.inserted, skipped: job.skipped, failed: job.failed,
            slug, result: 'failed',
            message: `❌ [${i + 1}] ${slug}: lỗi lưu DB`,
          });
        }

        // Rate‑limit: mỗi worker nghỉ 2s giữa các request (có thể cancel)
        await cancellableSleep(2000, job);
      }
    };

    const workers = Array.from({ length: SCRAPE_CONCURRENCY }, () => runWorker());
    await Promise.allSettled(workers);

    // Đợi tất cả AI hoàn thành
    emit('log', { message: '⏳ Đang đợi AI sinh solution cho các bài đã cào...' });
    await Promise.allSettled(aiPromises);
  } catch (err) {
    emit('error', { message: `💥 Lỗi nghiêm trọng: ${err.message}` });
  } finally {
    job.done = true;
    job.endTime = new Date().toISOString();

    emit('done', {
      jobId: job.id,
      inserted: job.inserted,
      skipped: job.skipped,
      failed: job.failed,
      message: `🎉 Hoàn tất! Thêm mới: ${job.inserted} | Bỏ qua: ${job.skipped} | Lỗi: ${job.failed}`,
    });

    await disconnectDB();
  }
}

module.exports = { runBatchScrape, getJobStatus, stopJob, scraperEmitter };
