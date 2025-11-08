const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Carica manualmente le variabili d'ambiente dal file .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n');
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const prisma = new PrismaClient();

async function populateResponses() {
  try {
    console.log('🔄 Inizio popolamento risposte...\n');

    // Recupera tutti i form con le loro domande
    const forms = await prisma.form.findMany({
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        owner: {
          select: {
            id: true
          }
        }
      }
    });

    if (forms.length === 0) {
      console.log('❌ Nessun form trovato nel database');
      return;
    }

    console.log(`📋 Trovati ${forms.length} form\n`);

    // Risposte realistiche per diversi tipi di domande
    const textAnswers = [
      'Ottimo servizio, molto soddisfatto',
      'Buona esperienza complessiva',
      'Potrebbe essere migliorato',
      'Eccellente qualità del prodotto',
      'Servizio clienti molto disponibile',
      'Tempi di consegna rispettati',
      'Prezzo competitivo',
      'Interfaccia intuitiva e facile da usare',
      'Documentazione chiara e completa',
      'Supporto tecnico efficace',
      'Prodotto di alta qualità',
      'Raccomanderei sicuramente',
      'Buon rapporto qualità-prezzo',
      'Soddisfatto delle funzionalità',
      'Ottima esperienza utente',
      'Servizio professionale',
      'Risposte rapide alle richieste',
      'Prodotto affidabile',
      'Facile da configurare',
      'Supera le aspettative',
      'Molto utile per il lavoro quotidiano',
      'Interfaccia moderna e pulita',
      'Funzionalità complete',
      'Ottimo supporto',
      'Valore eccellente per il prezzo'
    ];

    let totalResponsesCreated = 0;
    const results = [];

    for (const form of forms) {
      if (form.questions.length === 0) {
        console.log(`⏭️  Form "${form.title}" saltato (nessuna domanda)`);
        continue;
      }

      console.log(`📝 Elaborazione form: "${form.title}" (${form.questions.length} domande)`);

      // Crea un numero variabile di risposte per form (tra 25 e 60)
      const numResponses = Math.floor(Math.random() * 36) + 25;
      let formResponsesCreated = 0;

      // Recupera tutti gli utenti per assegnare risposte
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      for (let i = 0; i < numResponses; i++) {
        try {
          // Calcola il progressiveNumber
          const maxProgressiveResult = await prisma.$queryRaw`
            SELECT MAX("progressiveNumber") as max 
            FROM "Response" 
            WHERE "formId" = ${form.id}
          `;
          const nextProgressive = Number(maxProgressiveResult[0]?.max || 0) + 1;

          // Seleziona un utente casuale o null per form anonimi
          const randomUser = form.isAnonymous 
            ? null 
            : users.length > 0 
              ? users[Math.floor(Math.random() * users.length)].id 
              : form.owner.id;

          // Crea le risposte per ogni domanda
          const answersToCreate = [];

          for (const question of form.questions) {
            let answerValue = null;

            switch (question.type) {
              case 'RATING':
                // Distribuzione più realistica: più risposte centrali (curva normale)
                const ratingWeights = [0.05, 0.08, 0.12, 0.15, 0.18, 0.15, 0.12, 0.08, 0.05, 0.02];
                const random = Math.random();
                let cumulative = 0;
                let selectedRating = 1;
                for (let j = 0; j < ratingWeights.length; j++) {
                  cumulative += ratingWeights[j];
                  if (random <= cumulative) {
                    selectedRating = j + 1;
                    break;
                  }
                }
                answerValue = selectedRating;
                break;

              case 'LIKERT':
                // Distribuzione più realistica per Likert (1-5)
                const likertWeights = [0.1, 0.15, 0.2, 0.3, 0.25];
                const likertRandom = Math.random();
                let likertCumulative = 0;
                let selectedLikert = 1;
                for (let j = 0; j < likertWeights.length; j++) {
                  likertCumulative += likertWeights[j];
                  if (likertRandom <= likertCumulative) {
                    selectedLikert = j + 1;
                    break;
                  }
                }
                answerValue = selectedLikert;
                break;

              case 'NPS':
                // Distribuzione NPS: più risposte centrali (0-10)
                const npsWeights = [0.02, 0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.15, 0.12, 0.1, 0.08];
                const npsRandom = Math.random();
                let npsCumulative = 0;
                let selectedNPS = 0;
                for (let j = 0; j < npsWeights.length; j++) {
                  npsCumulative += npsWeights[j];
                  if (npsRandom <= npsCumulative) {
                    selectedNPS = j;
                    break;
                  }
                }
                answerValue = selectedNPS;
                break;

              case 'MULTIPLE_CHOICE':
                const options = question.options;
                if (Array.isArray(options) && options.length > 0) {
                  // Controlla se è sì/no
                  const isYesNo = options.length === 2 && 
                    ((options.includes('Sì') || options.includes('Si') || options.includes('Yes')) &&
                     (options.includes('No') || options.includes('NO')));
                  
                  if (isYesNo) {
                    // 60% sì, 40% no
                    answerValue = Math.random() < 0.6 ? 
                      (options.includes('Sì') ? 'Sì' : options.includes('Si') ? 'Si' : 'Yes') :
                      'No';
                  } else {
                    // Seleziona una o più opzioni casuali
                    const numSelections = Math.random() < 0.7 ? 1 : Math.floor(Math.random() * 2) + 2;
                    const selectedOptions = [];
                    const availableOptions = [...options];
                    for (let j = 0; j < Math.min(numSelections, availableOptions.length); j++) {
                      const randomIndex = Math.floor(Math.random() * availableOptions.length);
                      selectedOptions.push(availableOptions[randomIndex]);
                      availableOptions.splice(randomIndex, 1);
                    }
                    answerValue = selectedOptions.length === 1 ? selectedOptions[0] : selectedOptions;
                  }
                } else {
                  // Fallback: usa opzioni predefinite
                  const defaultOptions = [
                    'Opzione A', 'Opzione B', 'Opzione C',
                    'Molto soddisfatto', 'Soddisfatto', 'Neutro', 'Insoddisfatto', 'Molto insoddisfatto',
                    'Eccellente', 'Buono', 'Discreto', 'Sufficiente', 'Insufficiente'
                  ];
                  answerValue = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
                }
                break;

              case 'TEXT':
                // Seleziona una risposta di testo casuale
                answerValue = textAnswers[Math.floor(Math.random() * textAnswers.length)];
                // A volte aggiungi variazioni
                if (Math.random() < 0.3) {
                  answerValue += '. ' + textAnswers[Math.floor(Math.random() * textAnswers.length)];
                }
                break;

              case 'DATE':
                // Data casuale negli ultimi 6 mesi
                const daysAgo = Math.floor(Math.random() * 180);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                answerValue = date.toISOString().split('T')[0];
                break;

              default:
                // Per altri tipi, usa un valore generico
                answerValue = 'Risposta generica';
            }

            if (answerValue !== null) {
              answersToCreate.push({
                questionId: question.id,
                value: answerValue
              });
            }
          }

          // Crea la risposta solo se ci sono risposte da creare
          if (answersToCreate.length > 0) {
            // Crea date casuali negli ultimi 30 giorni
            const daysAgo = Math.floor(Math.random() * 30);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);
            createdAt.setHours(Math.floor(Math.random() * 24));
            createdAt.setMinutes(Math.floor(Math.random() * 60));

            await prisma.response.create({
              data: {
                formId: form.id,
                progressiveNumber: nextProgressive,
                userId: randomUser,
                createdAt: createdAt,
                answers: {
                  create: answersToCreate
                }
              }
            });

            formResponsesCreated++;
            totalResponsesCreated++;

            // Mostra progresso ogni 10 risposte
            if (formResponsesCreated % 10 === 0) {
              process.stdout.write(`  ✓ ${formResponsesCreated}/${numResponses} risposte create\r`);
            }
          }
        } catch (error) {
          console.error(`\n  ❌ Errore creando risposta ${i + 1}:`, error.message);
        }
      }

      console.log(`  ✅ ${formResponsesCreated} risposte create per "${form.title}"\n`);
      results.push({
        formId: form.id,
        formTitle: form.title,
        responsesCreated: formResponsesCreated
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Popolamento completato!`);
    console.log(`📊 Totale risposte create: ${totalResponsesCreated}`);
    console.log(`📋 Form elaborati: ${results.length}`);
    console.log('='.repeat(60) + '\n');

    console.log('Dettagli per form:');
    results.forEach(result => {
      console.log(`  - ${result.formTitle}: ${result.responsesCreated} risposte`);
    });

  } catch (error) {
    console.error('❌ Errore nel popolamento delle risposte:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateResponses();

