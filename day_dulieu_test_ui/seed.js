const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu đổ dữ liệu mẫu...');

  // 1. Lấy 1 Admin và 1 User bất kỳ để làm tác giả
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  const user = await prisma.user.findFirst({ where: { role: 'user' } });

  if (!admin || !user) {
    console.log('❌ Lỗi: Bạn cần tạo ít nhất 1 tài khoản Admin và 1 tài khoản User trước khi Seed.');
    return;
  }

  // 2. Xóa dữ liệu cũ (để tránh rác nếu chạy script nhiều lần)
  await prisma.announcement.deleteMany();
  await prisma.discussion.deleteMany();

  // 3. Bơm Thông Báo (Announcements)
  console.log('Đang tạo Thông báo...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Cập nhật hệ thống chấm code tự động',
        content: 'Hệ thống đã hỗ trợ phiên bản C++20 và Java 17. Chúc các bạn luyện tập tốt!',
        isPinned: true,
        authorId: admin.id
      },
      {
        title: 'Sự kiện: Tuần lễ thuật toán Đồ thị',
        content: 'Hoàn thành 5 bài đồ thị trong tuần này để nhận huy hiệu độc quyền từ LeetCode Clone.',
        isPinned: false,
        authorId: admin.id
      },
      {
        title: 'Bảo trì máy chủ định kỳ',
        content: 'Hệ thống sẽ bảo trì từ 2h-4h sáng Chủ Nhật tuần này. Mong các bạn thông cảm.',
        isPinned: false,
        authorId: admin.id
      }
    ]
  });

  // 4. Bơm Thảo Luận (Discussions)
  console.log('Đang tạo Thảo luận...');
  await prisma.discussion.createMany({
    data: [
      {
        title: 'Cách tối ưu thuật toán quy hoạch động (QHD)?',
        content: 'Mọi người cho mình hỏi làm sao để tư duy ra state transition dễ hơn nhỉ?',
        tags: JSON.stringify(['Thuật toán', 'Quy hoạch động']),
        upvotes: 124,
        views: 500,
        userId: user.id
      },
      {
        title: 'Lỗi Time Limit Exceeded bài Two Sum bằng Python',
        content: 'Mình dùng 2 vòng lặp for lồng nhau bị TLE, ai có cách nào dùng Dictionary không?',
        tags: JSON.stringify(['Python', 'Hỏi đáp lỗi']),
        upvotes: 45,
        views: 200,
        userId: user.id
      },
      {
        title: 'Chia sẻ kinh nghiệm phỏng vấn Backend tại VNG',
        content: 'Hôm nay mình vừa pass phỏng vấn, chia sẻ chút kinh nghiệm system design cho anh em.',
        tags: JSON.stringify(['Phỏng vấn', 'Backend', 'Tâm sự']),
        upvotes: 89,
        views: 1200,
        isPinned: true,
        userId: user.id
      }
    ]
  });

  console.log('✅ Bơm dữ liệu thành công!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });