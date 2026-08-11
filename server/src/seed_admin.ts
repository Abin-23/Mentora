import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mentora.com';
  const password = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      full_name: 'System Admin',
      email: email,
      password: password,
      role: 'SystemAdmin',
      provider: 'local',
    },
  });

  console.log('Admin user seeded:', adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
