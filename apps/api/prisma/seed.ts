import { PrismaClient, PackageType, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: 'admin' },
    select: { id: true }
  });
  if (existingAdmin) {
    console.log('管理员账号已存在，跳过创建。');
  } else {
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash: await hash('admin123', 10),
        name: '系统管理员',
        role: Role.SUPER_ADMIN
      }
    });
    console.log('默认管理员已创建，账号: admin，密码: admin123，请登录后立即修改密码！');
  }

  await prisma.packagePlan.upsert({
    where: { id: 'seed-time-card' },
    update: {},
    create: {
      id: 'seed-time-card',
      name: '月卡',
      type: PackageType.TIME_CARD,
      price: 399,
      durationDays: 30
    }
  });

  await prisma.packagePlan.upsert({
    where: { id: 'seed-visit-card' },
    update: {},
    create: {
      id: 'seed-visit-card',
      name: '20 次健身卡',
      type: PackageType.VISIT_CARD,
      price: 699,
      durationDays: 180,
      totalVisits: 20
    }
  });

  await prisma.packagePlan.upsert({
    where: { id: 'seed-pt-card' },
    update: {},
    create: {
      id: 'seed-pt-card',
      name: '10 节私教卡',
      type: PackageType.PT_CARD,
      price: 2800,
      durationDays: 180,
      totalLessons: 10
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
