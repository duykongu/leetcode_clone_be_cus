/**
 * FILE: src/services/scraper.service.js
 *
 * Service quản lý tiến trình cào bài tập.
 * Dùng EventEmitter để đẩy progress real-time ra SSE endpoint.
 */

const EventEmitter = require('events');
const { getFreeProblemList, fetchAndSaveRawData } = require('../tools/scraper/extractor');
const { processJsonFile, disconnectDB, isProblemExists } = require('../tools/scraper/transformer');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/**
 * Dừng job đang chạy
 */
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
    activeJob.log = activeJob.log || [];
    activeJob.log.push({ event, data, ts: Date.now() });
    if (activeJob.log.length > 500) activeJob.log.shift(); // giới hạn bộ nhớ
  }
}

/**
 * Chạy pipeline cào batch theo số lượng N bài yêu cầu từ FE
 */
async function runBatchScrape({ limit = 50, categories = ['algorithms', 'javascript'] }) {
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

/**
 * Luồng execute pipeline gốc lấy đúng 229 bài mặc định trang đầu
 */
async function _executePipeline(job) {
  emit('start', {
    jobId: job.id,
    limit: job.limit,
    categories: job.categories,
    message: `🚀 Bắt đầu job cào cuốn chiếu: Mục tiêu ${job.limit} bài mới, danh mục: ${job.categories.join(', ')}`,
  });

  try {
    let newlyInserted = 0; // Số bài mới thực tế đã lưu thành công
    let currentVirtualIndex = 0; // Chỉ số chạy giả lập cho FE hiển thị thanh tiến độ
    
    // Đặt kích thước mỗi đợt lấy danh sách là 50 bài theo yêu cầu của bạn
    const BATCH = 50; 

    for (const cat of job.categories) {
      if (job.stopRequested || newlyInserted >= job.limit) break;

      emit('log', { message: `📁 Bắt đầu xử lý danh mục: ${cat.toUpperCase()}` });

      let skip = 0;
      let hasMoreInCat = true;

      // VÒNG LẶP CUỐN CHIẾU: Lấy 50 bài -> Cào luôn -> Thiếu thì lấy tiếp 50 bài
      while (hasMoreInCat && newlyInserted < job.limit) {
        if (job.stopRequested) break;

        emit('log', { message: `🔍 Đang lấy ${BATCH} đề mục LeetCode (vị trí skip: ${skip})...` });
        
        // Gọi API lấy đúng 50 bài từ extractor
        const slugs = await getFreeProblemList(BATCH, skip, cat);

        if (!slugs || slugs.length === 0) {
          emit('log', { message: `🏁 Đã quét hết toàn bộ kho bài của danh mục [${cat.toUpperCase()}].` });
          hasMoreInCat = false;
          break;
        }

        emit('log', { message: `📥 Lấy thành công ${slugs.length} đề mục. Bắt đầu sàng lọc và cào ngay...` });

        // Tăng tổng số lượng hàng đợi trên giao diện động theo số bài vừa lấy về
        job.totalQueued += slugs.length;

        // Duyệt qua lô 50 bài vừa lấy được để xử lý lập tức
        for (const slug of slugs) {
          if (job.stopRequested || newlyInserted >= job.limit) break;

          currentVirtualIndex++;
          job.currentIndex = currentVirtualIndex;

          // Kiểm tra trùng trong cơ sở dữ liệu
          const exists = await isProblemExists(slug);
          if (exists) {
            job.skipped++;
            emit('progress', {
              current: job.currentIndex,
              total: job.totalQueued,
              inserted: job.inserted,
              skipped: job.skipped,
              failed: job.failed,
              slug,
              result: 'skipped',
              message: `⏭ [${job.currentIndex}] ${slug}: đã có trong DB (bỏ qua)`,
            });
            continue;
          }

          // Tiến hành cào dữ liệu thô từ LeetCode
          const extracted = await fetchAndSaveRawData(slug);
          if (!extracted) {
            job.failed++;
            emit('progress', {
              current: job.currentIndex,
              total: job.totalQueued,
              inserted: job.inserted,
              skipped: job.skipped,
              failed: job.failed,
              slug,
              result: 'failed',
              message: `❌ [${job.currentIndex}] ${slug}: lỗi kết nối cào mạng`,
            });
            await sleep(1500);
            continue;
          }

          // Phân tích cú pháp JSON và lưu vào Database
          const saved = await processJsonFile(slug);
          if (saved) {
            job.inserted++;
            newlyInserted++; // Tăng chỉ tiêu bài mới thành công
            emit('progress', {
              current: job.currentIndex,
              total: job.totalQueued,
              inserted: job.inserted,
              skipped: job.skipped,
              failed: job.failed,
              slug,
              result: 'inserted',
              message: `✔ [${job.currentIndex}] ${slug}: THÊM MỚI THÀNH CÔNG (${newlyInserted}/${job.limit})`,
            });
          } else {
            job.failed++;
            emit('progress', {
              current: job.currentIndex,
              total: job.totalQueued,
              inserted: job.inserted,
              skipped: job.skipped,
              failed: job.failed,
              slug,
              result: 'failed',
              message: `❌ [${job.currentIndex}] ${slug}: lỗi xử lý/lưu DB`,
            });
          }

          // Khoảng nghỉ an toàn giữa các bài cào chi tiết chống bị chặn IP
          await sleep(1800);
        }

        // Nếu LeetCode trả về ít hơn 50 bài, tức là danh mục này đã cạn bài tập
        if (slugs.length < BATCH) {
          hasMoreInCat = false;
          break;
        }

        // Tăng biến skip lên 50 để chuẩn bị lật trang tiếp theo nếu chưa đủ chỉ tiêu N bài
        skip += BATCH;
        
        // Nghỉ ngắn giữa các đợt lấy danh sách
        await sleep(1000);
      }
    }

    if (newlyInserted >= job.limit) {
      emit('log', { message: `🎉 Đạt mục tiêu! Đã tìm và cào đủ ${job.limit} bài mới theo yêu cầu.` });
    }

  } catch (err) {
    emit('error', { message: `💥 Lỗi nghiêm trọng trong tiến trình cào cuốn chiếu: ${err.message}` });
  } finally {
    job.done = true;
    job.endTime = new Date().toISOString();

    emit('done', {
      jobId: job.id,
      inserted: job.inserted,
      skipped: job.skipped,
      failed: job.failed,
      message: `🎉 Hoàn tất tiến trình! Đã thêm thành công: ${job.inserted} bài mới | Bỏ qua trùng: ${job.skipped} | Lỗi: ${job.failed}`,
    });

    await disconnectDB();
  }
}

module.exports = { runBatchScrape, getJobStatus, stopJob, scraperEmitter };