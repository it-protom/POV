import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@protom.com' },
    update: {},
    create: {
      email: 'admin@protom.com',
      name: 'Admin',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 