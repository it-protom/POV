/**
 * Script per correggere i ruoli degli utenti
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUsersRoles() {
  try {
    console.log('🔧 Correzione ruoli utenti...\n');

    // Correggi admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@protom.com' }
    });

    if (admin && admin.role !== 'ADMIN') {
      console.log('📝 Correzione ruolo ADMIN...');
      await prisma.user.update({
        where: { email: 'admin@protom.com' },
        data: { role: 'ADMIN' }
      });
      console.log('✅ Ruolo ADMIN corretto!\n');
    } else if (admin) {
      console.log('✅ Admin ha già il ruolo corretto (ADMIN)\n');
    }

    // Verifica user
    const user = await prisma.user.findUnique({
      where: { email: 'user@protom.com' }
    });

    if (user && user.role !== 'USER') {
      console.log('📝 Correzione ruolo USER...');
      await prisma.user.update({
        where: { email: 'user@protom.com' },
        data: { role: 'USER' }
      });
      console.log('✅ Ruolo USER corretto!\n');
    } else if (user) {
      console.log('✅ User ha già il ruolo corretto (USER)\n');
    }

    // Verifica finale
    const finalAdmin = await prisma.user.findUnique({
      where: { email: 'admin@protom.com' }
    });
    const finalUser = await prisma.user.findUnique({
      where: { email: 'user@protom.com' }
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 STATO FINALE UTENTI');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    if (finalAdmin) {
      console.log('🔐 ADMIN:');
      console.log(`   Email: ${finalAdmin.email}`);
      console.log(`   Nome: ${finalAdmin.name || 'N/A'}`);
      console.log(`   Ruolo: ${finalAdmin.role}`);
      console.log('');
    }
    if (finalUser) {
      console.log('👤 USER:');
      console.log(`   Email: ${finalUser.email}`);
      console.log(`   Nome: ${finalUser.name || 'N/A'}`);
      console.log(`   Ruolo: ${finalUser.role}`);
      console.log('');
    }
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Correzione completata!');
    console.log('');

  } catch (error) {
    console.error('❌ Errore durante la correzione:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersRoles();


