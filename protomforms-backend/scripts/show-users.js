const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showUsers() {
  try {
    console.log('Utenti nel sistema:');
    console.log('==================\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('Nessun utente trovato nel database.');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Nome non specificato'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Ruolo: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Creato: ${user.createdAt.toLocaleDateString('it-IT')}`);
      console.log('');
    });

    console.log('\nPer accedere al sistema:');
    console.log('1. Vai su http://localhost:3002/auth/signin');
    console.log('2. Usa le credenziali di uno degli utenti sopra elencati');
    console.log('3. Se non ricordi la password, puoi usare Azure AD se configurato');

  } catch (error) {
    console.error('Errore durante il recupero degli utenti:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers(); 