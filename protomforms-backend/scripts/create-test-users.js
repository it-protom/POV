/**
 * Script per creare account admin e user di test
 * Esegui con: node scripts/create-test-users.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔍 Verifica utenti esistenti...\n');

    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@protom.com' }
    });

    if (!existingAdmin) {
      console.log('📝 Creazione utente ADMIN...');
      const hashedAdminPassword = await bcrypt.hash('Password123!', 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@protom.com',
          name: 'Admin User',
          password: hashedAdminPassword,
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin creato con successo!');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Role: ${admin.role}\n`);
    } else {
      console.log('ℹ️  Admin già esistente');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Role: ${existingAdmin.role}\n`);
    }

    // Verifica se l'utente normale esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@protom.com' }
    });

    if (!existingUser) {
      console.log('📝 Creazione utente USER...');
      const hashedUserPassword = await bcrypt.hash('Password123!', 10);
      const user = await prisma.user.create({
        data: {
          email: 'user@protom.com',
          name: 'Test User',
          password: hashedUserPassword,
          role: 'USER'
        }
      });
      console.log('✅ User creato con successo!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Role: ${user.role}\n`);
    } else {
      console.log('ℹ️  User già esistente');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Role: ${existingUser.role}\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 CREDENZIALI PER IL LOGIN');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@protom.com');
    console.log('   Password: Password123!');
    console.log('');
    console.log('👤 USER:');
    console.log('   Email: user@protom.com');
    console.log('   Password: Password123!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Inizializzazione completata!');
    console.log('');
    console.log('💡 Puoi ora fare login usando queste credenziali');
    console.log('   con l\'autenticazione normale (non Azure AD)');
    console.log('');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createTestUsers();
