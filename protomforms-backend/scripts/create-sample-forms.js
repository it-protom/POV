const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Carica manualmente le variabili d'ambiente dal file .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n');
  envVars.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const prisma = new PrismaClient();

async function createSampleForms() {
  try {
    console.log('Creating sample forms...');

    // Trova l'admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    // Form 1: Sondaggio Soddisfazione Clienti
    const form1 = await prisma.form.create({
      data: {
        title: 'Sondaggio Soddisfazione Clienti 2024',
        description: 'Raccogliamo feedback sulla soddisfazione dei nostri clienti per migliorare i nostri servizi e l\'esperienza offerta.',
        type: 'SURVEY',
        isPublic: true,
        isAnonymous: false,
        allowEdit: true,
        showResults: false,
        thankYouMessage: 'Grazie per il tuo prezioso feedback! Le tue opinioni ci aiutano a migliorare costantemente.',
        ownerId: adminUser.id,
        questions: {
          create: [
            {
              text: 'Quanto sei soddisfatto del nostro servizio complessivo?',
              type: 'RATING',
              required: true,
              options: JSON.stringify({ scale: 5, labels: ['Molto insoddisfatto', 'Insoddisfatto', 'Neutrale', 'Soddisfatto', 'Molto soddisfatto'] }),
              order: 1
            },
            {
              text: 'Quale aspetto del nostro servizio apprezzi di più?',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: JSON.stringify(['Qualità del prodotto', 'Assistenza clienti', 'Velocità di consegna', 'Prezzo competitivo', 'Facilità d\'uso']),
              order: 2
            },
            {
              text: 'Hai suggerimenti per migliorare i nostri servizi?',
              type: 'TEXT',
              required: false,
              options: null,
              order: 3
            },
            {
              text: 'Consiglieresti i nostri servizi ad un amico?',
              type: 'NPS',
              required: true,
              options: JSON.stringify({ scale: 10 }),
              order: 4
            }
          ]
        }
      }
    });

    // Form 2: Feedback Prodotto Tech
    const form2 = await prisma.form.create({
      data: {
        title: 'Feedback Prodotto Tech Q1 2024',
        description: 'Valutazione dei nostri ultimi prodotti tecnologici e raccolta suggerimenti per il miglioramento.',
        type: 'SURVEY',
        isPublic: true,
        isAnonymous: true,
        allowEdit: false,
        showResults: true,
        thankYouMessage: 'Grazie per aver condiviso la tua esperienza con i nostri prodotti tech!',
        ownerId: adminUser.id,
        questions: {
          create: [
            {
              text: 'Quale prodotto tech hai utilizzato di recente?',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: JSON.stringify(['App Mobile', 'Piattaforma Web', 'API Integration', 'Dashboard Analytics', 'Sistema CRM']),
              order: 1
            },
            {
              text: 'Valuta la facilità d\'uso del prodotto (1-5)',
              type: 'RATING',
              required: true,
              options: JSON.stringify({ scale: 5 }),
              order: 2
            },
            {
              text: 'Quali funzionalità vorresti vedere aggiunte?',
              type: 'TEXT',
              required: false,
              options: null,
              order: 3
            }
          ]
        }
      }
    });

    // Form 3: Questionario Dipendenti HR
    const form3 = await prisma.form.create({
      data: {
        title: 'Clima Aziendale e Engagement Q1',
        description: 'Valutazione del clima lavorativo e del livello di coinvolgimento dei dipendenti nel primo trimestre 2024.',
        type: 'SURVEY',
        isPublic: false,
        isAnonymous: true,
        allowEdit: true,
        showResults: false,
        thankYouMessage: 'Grazie per il tuo contributo al miglioramento del nostro ambiente di lavoro!',
        ownerId: adminUser.id,
        questions: {
          create: [
            {
              text: 'Come valuti il clima lavorativo nel tuo team?',
              type: 'LIKERT',
              required: true,
              options: JSON.stringify(['Molto negativo', 'Negativo', 'Neutrale', 'Positivo', 'Molto positivo']),
              order: 1
            },
            {
              text: 'Ti senti valorizzato nel tuo ruolo attuale?',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: JSON.stringify(['Sempre', 'Spesso', 'A volte', 'Raramente', 'Mai']),
              order: 2
            },
            {
              text: 'Quali aspetti del lavoro vorresti migliorare?',
              type: 'TEXT',
              required: false,
              options: null,
              order: 3
            },
            {
              text: 'Ordina per importanza questi fattori nel tuo lavoro',
              type: 'RANKING',
              required: true,
              options: JSON.stringify(['Equilibrio vita-lavoro', 'Crescita professionale', 'Retribuzione', 'Colleghi', 'Ambiente fisico']),
              order: 4
            }
          ]
        }
      }
    });

    // Form 4: Survey UX Website
    const form4 = await prisma.form.create({
      data: {
        title: 'User Experience Nuovo Sito Web',
        description: 'Raccolta feedback sull\'esperienza utente del nostro sito web rinnovato per identificare aree di miglioramento.',
        type: 'SURVEY',
        isPublic: true,
        isAnonymous: false,
        allowEdit: false,
        showResults: true,
        thankYouMessage: 'Grazie per averci aiutato a migliorare l\'esperienza del nostro sito web!',
        ownerId: adminUser.id,
        opensAt: new Date(),
        closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni da ora
        questions: {
          create: [
            {
              text: 'Come hai trovato il nuovo design del sito?',
              type: 'RATING',
              required: true,
              options: JSON.stringify({ scale: 5, labels: ['Molto difficile', 'Difficile', 'Neutrale', 'Facile', 'Molto facile'] }),
              order: 1
            },
            {
              text: 'Quale sezione del sito utilizzi di più?',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: JSON.stringify(['Homepage', 'Prodotti', 'Servizi', 'Blog', 'Contatti', 'Area Cliente']),
              order: 2
            },
            {
              text: 'Hai riscontrato problemi durante la navigazione?',
              type: 'TEXT',
              required: false,
              options: null,
              order: 3
            },
            {
              text: 'Quanto è probabile che raccomandi il nostro sito?',
              type: 'NPS',
              required: true,
              options: JSON.stringify({ scale: 10 }),
              order: 4
            }
          ]
        }
      }
    });

    // Crea alcune risposte di esempio per rendere i dati più realistici
    console.log('Creating sample responses...');

    // Risposte per il Form 1
    for (let i = 0; i < 50; i++) {
      await prisma.response.create({
        data: {
          formId: form1.id,
          userId: adminUser.id,
          answers: {
            create: [
              {
                questionId: (await prisma.question.findFirst({ where: { formId: form1.id, order: 1 } }))?.id,
                value: JSON.stringify(Math.floor(Math.random() * 5) + 1)
              },
              {
                questionId: (await prisma.question.findFirst({ where: { formId: form1.id, order: 2 } }))?.id,
                value: JSON.stringify(['Qualità del prodotto', 'Assistenza clienti'][Math.floor(Math.random() * 2)])
              }
            ]
          }
        }
      });
    }

    // Risposte per il Form 2
    for (let i = 0; i < 30; i++) {
      await prisma.response.create({
        data: {
          formId: form2.id,
          userId: adminUser.id,
          answers: {
            create: [
              {
                questionId: (await prisma.question.findFirst({ where: { formId: form2.id, order: 1 } }))?.id,
                value: JSON.stringify(['App Mobile', 'Piattaforma Web', 'Dashboard Analytics'][Math.floor(Math.random() * 3)])
              },
              {
                questionId: (await prisma.question.findFirst({ where: { formId: form2.id, order: 2 } }))?.id,
                value: JSON.stringify(Math.floor(Math.random() * 5) + 1)
              }
            ]
          }
        }
      });
    }

    console.log('✅ Sample forms created successfully!');
    console.log(`Created forms:
    - ${form1.title} (ID: ${form1.id})
    - ${form2.title} (ID: ${form2.id})
    - ${form3.title} (ID: ${form3.id})
    - ${form4.title} (ID: ${form4.id})`);

  } catch (error) {
    console.error('Error creating sample forms:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleForms(); 