const EventEmitter = require('events');
const { getFreeProblemList, fetchAndSaveRawData } = require('../tools/scraper/extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('../tools/scraper/transformer');
const { generateSolution } = require('./ai.service');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const cancellableSleep = async (ms, job) => {
  const step = 200;
  let remaining = ms;
  while (remaining > 0) {
    if (job?.stopRequested) return;
    await new Promise(r => setTimeout(r, Math.min(step, remaining)));
    remaining -= step;
  }
};

function waitForStopSignal(job) {
  if (job.stopRequested) return Promise.resolve();
  return new Promise(r => {
    job._stopResolvers = job._stopResolvers || [];
    job._stopResolvers.push(r);
  });
}

async function withCancellation(fn, job) {
  if (job.stopRequested) return undefined;
  return Promise.race([
    fn(),
    waitForStopSignal(job).then(() => undefined),
  ]);
}

const AI_CONCURRENCY = 5;
const SCRAPE_CONCURRENCY = 3;

const scraperEmitter = new EventEmitter();
scraperEmitter.setMaxListeners(50);

let activeJob = null;

function getJobStatus() {
  if (!activeJob) return { running: false };
  return { running: true, ...activeJob };
}

function stopJob() {
  if (activeJob) {
    activeJob.stopRequested = true;
    if (activeJob._aiSlotResolvers) {
      while (activeJob._aiSlotResolvers.length > 0) {
        activeJob._aiSlotResolvers.shift()();
      }
    }
    if (activeJob._stopResolvers) {
      while (activeJob._stopResolvers.length > 0) {
        activeJob._stopResolvers.shift()();
      }
    }
    emit('log', { message: '🛑 Người dùng yêu cầu dừng job. Đang kết thúc...' });
    emit('stop', { message: 'Đã ghi nhận lệnh dừng.' });
  }
}

function emit(event, data) {
  scraperEmitter.emit(event, data);
  if (activeJob) {
    activeJob.log = activeJob.log || [];
    activeJob.log.push({ event, data, ts: Date.now() });
    if (activeJob.log.length > 500) activeJob.log.shift();
  }
}

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
    _aiSlotResolvers: [],
    _stopResolvers: [],
  };

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
    // --- Bước 1: Thu thập danh sách slug ---
    let allSlugs = [];

    for (const cat of job.categories) {
      if (job.stopRequested) break;

      emit('log', { message: `📁 Đang lấy danh sách bài từ danh mục: ${cat.toUpperCase()}...` });

      const BATCH = 200;
      let skip = 0;
      let catSlugs = [];
      let hasMore = true;

      while (hasMore && catSlugs.length < job.limit * 2) {
        if (job.stopRequested) { hasMore = false; break; }
        const slugs = await withCancellation(() => getFreeProblemList(BATCH, skip, cat), job);
        if (!slugs || slugs.length === 0) { hasMore = false; break; }
        catSlugs = catSlugs.concat(slugs);
        if (slugs.length < BATCH) { hasMore = false; break; }
        skip += BATCH;
        await cancellableSleep(800, job);
      }

      emit('log', { message: `   → Tìm thấy ${catSlugs.length} bài miễn phí trong [${cat}]` });
      allSlugs = allSlugs.concat(catSlugs);
    }

    allSlugs = [...new Set(allSlugs)];
    job.totalQueued = allSlugs.length;

    emit('log', { message: `📋 Tổng danh sách slug thu thập: ${allSlugs.length} bài` });

    // --- Bước 2: Lọc slug chưa có trong DB ---
    const slugsToProcess = [];
    for (const slug of allSlugs) {
      if (job.stopRequested) break;
      if (slugsToProcess.length >= job.limit) break;
      const exists = await withCancellation(() => isProblemExists(slug), job);
      if (!exists) slugsToProcess.push(slug);
    }

    job.totalNew = slugsToProcess.length;
    job.skipped = allSlugs.length - slugsToProcess.length;
    emit('log', { message: `🆕 Số bài cần cào mới: ${slugsToProcess.length} (bỏ qua ${job.skipped} bài đã có)` });

    // --- Bước 3: Cào song song ---
    const aiPromises = [];
    let aiSlotCount = 0;
    const waitForAiSlot = () => {
      if (aiSlotCount < AI_CONCURRENCY || job.stopRequested) return Promise.resolve();
      return new Promise(r => { job._aiSlotResolvers.push(r); });
    };
    const releaseAiSlot = () => {
      if (job._aiSlotResolvers.length > 0) job._aiSlotResolvers.shift()();
    };

    let workerIndex = 0;
    const runWorker = async () => {
      while (!job.stopRequested) {
        const i = workerIndex++;
        if (i >= slugsToProcess.length) break;

        if (job.stopRequested) break;
        const slug = slugsToProcess[i];

        if (job.stopRequested) break;
        const extracted = await withCancellation(() => fetchAndSaveRawData(slug), job);
        if (!extracted) {
          if (job.stopRequested) break;
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
        const saved = await withCancellation(() => processJsonFile(slug), job);
        if (saved) {
          job.inserted++;
          emit('progress', {
            current: i + 1, total: slugsToProcess.length,
            inserted: job.inserted, skipped: job.skipped, failed: job.failed,
            slug, result: 'inserted',
            message: `✔ [${i + 1}] ${slug}: thêm mới`,
          });

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
          if (job.stopRequested) break;
          job.failed++;
          emit('progress', {
            current: i + 1, total: slugsToProcess.length,
            inserted: job.inserted, skipped: job.skipped, failed: job.failed,
            slug, result: 'failed',
            message: `❌ [${i + 1}] ${slug}: lỗi lưu DB`,
          });
        }

        await cancellableSleep(2000, job);
      }
    };

    const workers = Array.from({ length: SCRAPE_CONCURRENCY }, () => runWorker());
    await Promise.allSettled(workers);

    if (!job.stopRequested) {
      emit('log', { message: '⏳ Đang đợi AI sinh solution cho các bài đã cào...' });
      await Promise.allSettled(aiPromises);
    } else {
      emit('log', { message: '⏭ Bỏ qua AI solution do người dùng yêu cầu dừng.' });
    }
  } catch (err) {
    emit('error', { message: `💥 Lỗi nghiêm trọng: ${err.message}` });
  } finally {
    job.done = true;
    job.endTime = new Date().toISOString();

    const stopped = job.stopRequested;
    emit('done', {
      jobId: job.id,
      inserted: job.inserted,
      skipped: job.skipped,
      failed: job.failed,
      stopped,
      message: stopped
        ? `🛑 Đã dừng! Thêm mới: ${job.inserted} | Bỏ qua: ${job.skipped} | Lỗi: ${job.failed}`
        : `🎉 Hoàn tất! Thêm mới: ${job.inserted} | Bỏ qua: ${job.skipped} | Lỗi: ${job.failed}`,
    });

    await disconnectDB();
  }
}

module.exports = { runBatchScrape, getJobStatus, stopJob, scraperEmitter };
