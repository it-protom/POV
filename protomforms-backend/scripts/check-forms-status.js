const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFormsStatus() {
  try {
    console.log('Verifica stato dei form...');

    const forms = await prisma.form.findMany({
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        questions: {
          select: {
            id: true
          }
        },
        responses: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`\nTrovati ${forms.length} form:`);
    
    forms.forEach((form, index) => {
      const totalResponses = form.responses.length;
      const totalQuestions = form.questions.length;
      
      // Calcola lo status attuale
      let status = 'draft';
      if (form.isPublic) {
        status = 'published';
      }
      if (form.closesAt && new Date(form.closesAt) < new Date()) {
        status = 'archived';
      }

      console.log(`\n${index + 1}. "${form.title}"`);
      console.log(`   - ID: ${form.id}`);
      console.log(`   - isPublic: ${form.isPublic}`);
      console.log(`   - Risposte: ${totalResponses}`);
      console.log(`   - Domande: ${totalQuestions}`);
      console.log(`   - Status calcolato: ${status}`);
      console.log(`   - Proprietario: ${form.owner?.name || 'N/A'}`);
    });

  } catch (error) {
    console.error('Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFormsStatus(); 