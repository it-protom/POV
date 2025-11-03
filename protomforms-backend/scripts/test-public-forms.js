const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPublicForms() {
  try {
    console.log('Test API endpoint per form pubblici...\n');

    // Get all public forms
    const forms = await prisma.form.findMany({
      where: { 
        isPublic: true,
        status: 'PUBLISHED'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            required: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        responses: {
          select: {
            id: true,
            userId: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`Trovati ${forms.length} form pubblici pubblicati:\n`);

    forms.forEach((form, index) => {
      console.log(`${index + 1}. "${form.title}"`);
      console.log(`   - ID: ${form.id}`);
      console.log(`   - Tipo: ${form.type}`);
      console.log(`   - Status: ${form.status}`);
      console.log(`   - isPublic: ${form.isPublic}`);
      console.log(`   - Domande: ${form.questions.length}`);
      console.log(`   - Risposte: ${form.responses.length}`);
      console.log(`   - Creato da: ${form.owner.name} (${form.owner.email})`);
      console.log(`   - Data creazione: ${form.createdAt.toLocaleDateString('it-IT')}`);
      console.log(`   - Data aggiornamento: ${form.updatedAt.toLocaleDateString('it-IT')}`);
      if (form.description) {
        console.log(`   - Descrizione: ${form.description}`);
      }
      if (form.opensAt) {
        console.log(`   - Apre: ${form.opensAt.toLocaleDateString('it-IT')}`);
      }
      if (form.closesAt) {
        console.log(`   - Chiude: ${form.closesAt.toLocaleDateString('it-IT')}`);
      }
      console.log('');
    });

    // Test with a specific user (simulate user responses)
    const testUserId = 'test-user-id';
    const userResponses = await prisma.response.findMany({
      where: { 
        userId: testUserId 
      },
      select: { 
        formId: true 
      }
    });
    
    const answeredFormIds = new Set(userResponses.map(r => r.formId));
    const availableForms = forms.filter(form => !answeredFormIds.has(form.id));

    console.log(`Form disponibili per l'utente (escludendo quelli già compilati): ${availableForms.length}`);
    availableForms.forEach((form, index) => {
      console.log(`   ${index + 1}. ${form.title}`);
    });

  } catch (error) {
    console.error('Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPublicForms(); 