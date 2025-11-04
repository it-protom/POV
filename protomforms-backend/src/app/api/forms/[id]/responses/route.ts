import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST /api/forms/[id]/responses - Submit form responses
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Fallback: controlla anche l'header x-user-id se la sessione non esiste
    const userIdHeader = req.headers.get('x-user-id');
    const userId = session?.user?.id || userIdHeader;
    
    console.log('🔐 Form submission auth check:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      headerUserId: userIdHeader,
      finalUserId: userId,
      formId: params.id
    });
    
    // Recupera il form con le domande per validazione
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form non trovato' }, { status: 404 });
    }

    // Verifica che il form sia pubblicato e disponibile
    if (form.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Form non disponibile' }, { status: 403 });
    }

    // Verifica date di apertura/chiusura
    const now = new Date();
    if (form.opensAt && new Date(form.opensAt) > now) {
      return NextResponse.json({ error: 'Form non ancora disponibile' }, { status: 403 });
    }
    if (form.closesAt && new Date(form.closesAt) < now) {
      return NextResponse.json({ error: 'Form scaduto' }, { status: 403 });
    }

    // Per form non anonimi, richiedi autenticazione (sessione O header x-user-id)
    if (!form.isAnonymous && !userId) {
      console.log('❌ Form non anonimo richiede autenticazione');
      return NextResponse.json({ 
        error: 'Autenticazione richiesta. Effettua il login per compilare questo form.' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Risposte non valide' }, { status: 400 });
    }

    // Valida che tutte le domande obbligatorie siano risposte
    const requiredQuestions = form.questions.filter(q => q.required);
    const missingRequired = requiredQuestions.filter(q => {
      const answer = answers[q.id];
      if (!answer) return true;
      if (Array.isArray(answer) && answer.length === 0) return true;
      if (typeof answer === 'string' && answer.trim() === '') return true;
      return false;
    });

    if (missingRequired.length > 0) {
      return NextResponse.json(
        { 
          error: 'Domande obbligatorie mancanti',
          missingQuestions: missingRequired.map(q => q.text)
        },
        { status: 400 }
      );
    }

    // Valida che le domande risposte esistano nel form
    const questionIds = new Set(form.questions.map(q => q.id));
    const invalidQuestions = Object.keys(answers).filter(qId => !questionIds.has(qId));
    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        { error: 'Alcune risposte riferiscono a domande non esistenti' },
        { status: 400 }
      );
    }

    // Verifica che l'utente non abbia già inviato una risposta (sia per form anonimi che non)
    // Ora che salviamo sempre il userId, possiamo prevenire doppie submission anche per form anonimi
    if (userId) {
      const existingResponse = await prisma.response.findFirst({
        where: {
          formId: params.id,
          userId: userId,
        },
      });

      if (existingResponse) {
        console.log('⚠️ Utente ha già inviato una risposta:', { userId, formId: params.id });
        return NextResponse.json(
          { error: 'Hai già inviato una risposta a questo form' },
          { status: 403 }
        );
      }
    }

    // Per form anonimi, verifica tramite cookie se il form è già stato compilato
    if (form.isAnonymous) {
      const cookieName = `form_submitted_${params.id}`;
      const submittedCookie = req.cookies.get(cookieName);
      
      if (submittedCookie) {
        // Verifica anche nel database usando il progressiveNumber dal cookie
        try {
          const cookieData = JSON.parse(submittedCookie.value);
          if (cookieData.progressiveNumber) {
            const existingResponse = await prisma.response.findFirst({
              where: {
                formId: params.id,
                progressiveNumber: cookieData.progressiveNumber,
              },
            });
            
            if (existingResponse) {
              return NextResponse.json(
                { error: 'Hai già inviato una risposta a questo form' },
                { status: 403 }
              );
            }
          }
        } catch (e) {
          // Se il cookie è malformato, continua comunque
        }
      }
    }

    // Calcola il prossimo progressiveNumber per il form usando SQL raw
    const result = await prisma.$queryRaw<[{ max: bigint | null }]>`
      SELECT MAX("progressiveNumber") as max 
      FROM "Response" 
      WHERE "formId" = ${params.id}
    `;
    const nextProgressive = Number(result[0]?.max || 0) + 1;

    const response = await prisma.response.create({
      data: {
        formId: params.id,
        progressiveNumber: nextProgressive,
        // Salva sempre userId se disponibile, anche per form anonimi
        // L'anonimato si riferisce alla visualizzazione pubblica, ma l'utente
        // deve poter vedere le proprie risposte nella sezione "Le Mie Risposte"
        userId: userId || null,
        answers: {
          create: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: value as any,
          })),
        },
      },
    });
    
    console.log('✅ Response created successfully:', {
      responseId: response.id,
      progressiveNumber: nextProgressive,
      userId: response.userId,
      formId: params.id
    });
    
    // Crea la risposta
    const responseJson = NextResponse.json({ 
      success: true, 
      responseId: response.id, 
      progressiveNumber: nextProgressive 
    });
    
    // Per form anonimi, imposta un cookie per prevenire doppi invii
    if (form.isAnonymous) {
      const cookieName = `form_submitted_${params.id}`;
      const cookieValue = JSON.stringify({
        responseId: response.id,
        progressiveNumber: nextProgressive,
        submittedAt: new Date().toISOString()
      });
      
      // Cookie valido per 1 anno
      responseJson.cookies.set(cookieName, cookieValue, {
        httpOnly: false, // Deve essere leggibile da JavaScript per localStorage sync
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 anno
        path: '/'
      });
    }
    
    return responseJson;
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 });
  }
}

// GET /api/forms/[id]/responses - Get form responses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Verifica che il form esista
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            responses: true
          }
        }
      }
    });
    
    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }
    
    // Verifica i permessi: admin può vedere tutto, owner può vedere i propri form
    if (session.user.role !== 'ADMIN' && form.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    // Recupero delle risposte - includiamo informazioni utente solo se il form non è anonimo
    const responsesRaw = await prisma.response.findMany({
      where: {
        formId: id
      },
      include: {
        user: !form.isAnonymous ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : false,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                options: true
              }
            }
          }
        }
      },
      orderBy: {
        progressiveNumber: 'desc'
      }
    });

    // Per form anonimi, rimuoviamo le informazioni utente MA manteniamo tutte le risposte individuali
    // Ogni risposta è identificata dal progressiveNumber per permettere all'admin di vedere risposte singole
    const responses = form.isAnonymous
      ? responsesRaw.map(r => ({
          id: r.id,
          formId: r.formId,
          progressiveNumber: r.progressiveNumber, // Usato come identificatore per risposte anonime
          createdAt: r.createdAt,
          user: null, // Nessuna informazione utente per form anonimi
          answers: r.answers // Manteniamo tutte le risposte individuali
        }))
      : responsesRaw;
    
    return NextResponse.json(responses);
  } catch (error) {
    console.error('Errore nel recupero delle risposte:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 