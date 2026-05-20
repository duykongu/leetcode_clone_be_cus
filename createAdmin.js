const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@leetcode.local' },
    update: {
      role: 'admin',
      passwordHash: passwordHash,
    },
    create: {
      username: 'admin',
      email: 'admin@leetcode.local',
      passwordHash: passwordHash,
      role: 'admin',
    },
  });
  
  console.log('Tạo tài khoản Admin thành công!');
  console.log('=============================');
  console.log('Email:', admin.email);
  console.log('Mật khẩu:', 'admin123');
  console.log('=============================');
}

main()
  .catch(e => {
    console.error('Lỗi khi tạo tài khoản:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
