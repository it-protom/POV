/**
 * Script per aggiungere i nomi agli utenti
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addUserNames() {
  try {
    console.log('📝 Aggiunta nomi agli utenti...\n');

    // Aggiorna admin
    const admin = await prisma.user.update({
      where: { email: 'admin@protom.com' },
      data: { name: 'Admin User' }
    });
    console.log('✅ Admin aggiornato:', admin.email, '-', admin.name);

    // Aggiorna user
    const user = await prisma.user.update({
      where: { email: 'user@protom.com' },
      data: { name: 'Test User' }
    });
    console.log('✅ User aggiornato:', user.email, '-', user.name);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 UTENTI FINALI');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@protom.com');
    console.log('   Nome: Admin User');
    console.log('   Password: Password123!');
    console.log('   Ruolo: ADMIN\n');
    console.log('👤 USER:');
    console.log('   Email: user@protom.com');
    console.log('   Nome: Test User');
    console.log('   Password: Password123!');
    console.log('   Ruolo: USER\n');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ Completo! Gli utenti sono pronti per il login.\n');

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addUserNames();


