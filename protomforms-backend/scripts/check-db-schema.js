const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('Verifica struttura database...');

    // Prova a ottenere un form per vedere la struttura
    const forms = await prisma.form.findMany({
      take: 1,
      select: {
        id: true,
        title: true,
        // Prova ad accedere al campo status
        // status: true, // Questo causerà un errore se il campo non esiste
      }
    });

    console.log('Form trovati:', forms.length);
    if (forms.length > 0) {
      console.log('Primo form:', forms[0]);
    }

    // Prova a vedere se possiamo accedere al campo status
    try {
      const formWithStatus = await prisma.form.findFirst({
        select: {
          id: true,
          title: true,
          status: true
        }
      });
      console.log('Form con status:', formWithStatus);
    } catch (error) {
      console.log('Errore nell\'accesso al campo status:', error.message);
    }

    // Verifica la struttura della tabella Form
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Form' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Struttura tabella Form:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

  } catch (error) {
    console.error('Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema(); 