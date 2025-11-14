import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Crea utente Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@protom.com' },
    update: {},
    create: {
      email: 'admin@protom.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  // Crea utente normale
  const user = await prisma.user.upsert({
    where: { email: 'user@protom.com' },
    update: {},
    create: {
      email: 'user@protom.com',
      name: 'Test User',
      role: 'USER',
      password: hashedPassword,
    },
  });

  console.log('✅ Utenti creati con successo!');
  console.log('\n📧 Credenziali Admin:');
  console.log('   Email: admin@protom.com');
  console.log('   Password: Password123!');
  console.log('   Ruolo: ADMIN');
  console.log('\n📧 Credenziali User:');
  console.log('   Email: user@protom.com');
  console.log('   Password: Password123!');
  console.log('   Ruolo: USER');
  console.log('\n', { admin: { id: admin.id, email: admin.email, role: admin.role }, user: { id: user.id, email: user.email, role: user.role } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 