/**
 * Script per creare utenti di test USER
 * Esegui con: node scripts/create-test-users-lulu-robi-peppi.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'lulu@test.com',
    password: 'lulu123!',
    name: 'Lulu'
  },
  {
    email: 'robi@test.com',
    password: 'robi123!',
    name: 'Robi'
  },
  {
    email: 'peppi@test.com',
    password: 'peppi123!',
    name: 'Peppi'
  }
];

async function createTestUsers() {
  try {
    console.log('🔍 Creazione utenti di test USER...\n');

    for (const userData of testUsers) {
      // Verifica se l'utente esiste già
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`ℹ️  Utente già esistente: ${userData.email}`);
        // Aggiorna la password per sicurezza
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            name: userData.name,
            role: 'USER'
          }
        });
        console.log(`   ✅ Password aggiornata`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role: USER\n`);
      } else {
        console.log(`📝 Creazione utente: ${userData.email}`);
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: 'USER'
          }
        });
        console.log(`✅ Utente creato con successo!`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}\n`);
      }
    }

    console.log('✅ Tutti gli utenti di test sono stati creati/aggiornati!');
  } catch (error) {
    console.error('❌ Errore durante la creazione degli utenti:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

