const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@protom.com';
    const password = 'Password123!';
    
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!existing) {
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: email,
          name: 'Admin User',
          password: hashed,
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin creato:', user.email, user.role);
    } else {
      console.log('ℹ️ Admin già esistente:', existing.email, existing.role);
      if (!existing.password) {
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { email },
          data: { password: hashed }
        });
        console.log('✅ Password aggiunta');
      } else {
        console.log('ℹ️ Admin ha già una password');
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Errore:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();

