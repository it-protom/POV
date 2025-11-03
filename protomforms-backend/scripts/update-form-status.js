const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateFormStatus() {
  try {
    console.log('Aggiornamento status dei form esistenti...');

    // Ottieni tutti i form
    const forms = await prisma.form.findMany({
      include: {
        responses: true,
        questions: true
      }
    });

    console.log(`Trovati ${forms.length} form da aggiornare`);

    for (const form of forms) {
      let status = 'DRAFT';
      
      // Se il form ha risposte, è pubblicato
      if (form.responses.length > 0) {
        status = 'PUBLISHED';
      }
      
      // Se il form ha una data di chiusura passata, è archiviato
      if (form.closesAt && new Date(form.closesAt) < new Date()) {
        status = 'ARCHIVED';
      }

      // Aggiorna il form
      await prisma.form.update({
        where: { id: form.id },
        data: { status }
      });

      console.log(`Form "${form.title}" aggiornato con status: ${status}`);
    }

    console.log('Aggiornamento completato con successo!');
  } catch (error) {
    console.error('Errore durante l\'aggiornamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFormStatus(); 