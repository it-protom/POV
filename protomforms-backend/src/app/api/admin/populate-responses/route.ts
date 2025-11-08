import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Endpoint per popolare il database con risposte realistiche per tutti i form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({ 
        message: 'Nessun form trovato nel database',
        created: 0
      });
    }

    // Risposte realistiche per diversi tipi di domande
    const ratingAnswers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const likertAnswers = [1, 2, 3, 4, 5];
    const npsAnswers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const yesNoAnswers = ['Sì', 'No', 'Si', 'Yes', 'No'];
    const multipleChoiceOptions = [
      ['Opzione A', 'Opzione B', 'Opzione C'],
      ['Molto soddisfatto', 'Soddisfatto', 'Neutro', 'Insoddisfatto', 'Molto insoddisfatto'],
      ['Eccellente', 'Buono', 'Discreto', 'Sufficiente', 'Insufficiente'],
      ['Sempre', 'Spesso', 'A volte', 'Raramente', 'Mai'],
      ['Assolutamente d\'accordo', 'D\'accordo', 'Neutro', 'In disaccordo', 'Assolutamente in disaccordo']
    ];

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
      'Supera le aspettative'
    ];

    let totalResponsesCreated = 0;
    const results = [];

    for (const form of forms) {
      if (form.questions.length === 0) {
        continue;
      }

      // Crea un numero variabile di risposte per form (tra 20 e 50)
      const numResponses = Math.floor(Math.random() * 31) + 20;
      let formResponsesCreated = 0;

      // Recupera tutti gli utenti per assegnare risposte
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      for (let i = 0; i < numResponses; i++) {
        try {
          // Calcola il progressiveNumber
          const maxProgressiveResult = await prisma.$queryRaw<[{ max: bigint | null }]>`
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
            let answerValue: any = null;

            switch (question.type) {
              case 'RATING':
                // Distribuzione più realistica: più risposte centrali
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
                // Distribuzione più realistica per Likert
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
                // Distribuzione NPS: più risposte centrali
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
                const options = question.options as any;
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
                  const defaultOptions = multipleChoiceOptions[Math.floor(Math.random() * multipleChoiceOptions.length)];
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
          }
        } catch (error) {
          console.error(`Errore creando risposta ${i + 1} per form ${form.id}:`, error);
        }
      }

      results.push({
        formId: form.id,
        formTitle: form.title,
        responsesCreated: formResponsesCreated
      });
    }

    return NextResponse.json({
      message: `Creato con successo ${totalResponsesCreated} risposte`,
      totalResponses: totalResponsesCreated,
      formsProcessed: results.length,
      details: results
    });

  } catch (error) {
    console.error('Error populating responses:', error);
    return NextResponse.json(
      { error: 'Errore nel popolamento delle risposte', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

