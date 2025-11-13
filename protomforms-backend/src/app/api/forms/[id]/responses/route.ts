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

    // Verifica che l'utente possa ancora inviare una risposta in base a maxRepeats
    console.log('🔍 POST /api/forms/[id]/responses - Checking maxRepeats:', {
      userId,
      formId: params.id,
      formMaxRepeats: form.maxRepeats,
      isAnonymous: form.isAnonymous
    });
    
    if (userId) {
      // Count how many times the user has responded to this form
      const userResponses = await prisma.response.findMany({
        where: {
          formId: params.id,
          userId: userId,
        },
      });

      const userResponseCount = userResponses.length;
      
      console.log('📊 User response count:', {
        userId,
        formId: params.id,
        userResponseCount,
        formMaxRepeats: form.maxRepeats,
        responses: userResponses.map(r => ({ id: r.id, progressiveNumber: r.progressiveNumber }))
      });

      // Check maxRepeats logic
      if (form.maxRepeats !== null) {
        // Form has a limit on repeats
        const maxRepeats = form.maxRepeats || 1;
        if (userResponseCount >= maxRepeats) {
          console.log(`⚠️ User ${userId} has reached max repeats for form ${params.id} (${userResponseCount}/${maxRepeats})`);
          return NextResponse.json(
            { 
              error: `Hai già compilato questo form il numero massimo di volte consentite (${maxRepeats})`,
              maxRepeatsReached: true,
              userResponseCount,
              maxRepeats
            },
            { status: 403 }
          );
        } else {
          console.log(`✅ User ${userId} can still submit (${userResponseCount}/${maxRepeats})`);
        }
      } else {
        console.log(`✅ Form ${params.id} has unlimited repeats (maxRepeats: null)`);
      }
      // If maxRepeats is null, form can be repeated infinitely, so we allow submission
      
      // If allowEdit is false and user has already responded, check if they can create a new response
      // Since we already checked maxRepeats above, if we reach here, user can still respond
      // (either because maxRepeats allows it or because it's null/infinite)
    } else {
      console.log('ℹ️ No userId - checking anonymous form logic');
    }

    // Per form anonimi, verifica maxRepeats usando i cookie
    if (form.isAnonymous) {
      // Se l'utente è autenticato anche per form anonimi, usa la logica userId
      // (già gestita sopra)
      // Se non è autenticato, conta i cookie per questo form
      if (!userId) {
        const cookieName = `form_submitted_${params.id}`;
        const submittedCookie = req.cookies.get(cookieName);
        
        // Count responses from cookies (for anonymous users without userId)
        // We'll count all responses for this form that don't have a userId
        const anonymousResponses = await prisma.response.count({
          where: {
            formId: params.id,
            userId: null
          }
        });
        
        // Check maxRepeats for anonymous form
        if (form.maxRepeats !== null) {
          const maxRepeats = form.maxRepeats || 1;
          // For anonymous forms without userId, we can't track individual users perfectly
          // But we can still check if the form has reached its general limit
          // However, this is not ideal - ideally anonymous forms should allow unlimited responses
          // unless we have a better tracking mechanism
          
          // If there's a cookie, check if this specific user (via cookie) has reached limit
          if (submittedCookie) {
            try {
              const cookieData = JSON.parse(submittedCookie.value);
              if (cookieData.progressiveNumber) {
                // Check if this progressiveNumber already exists (same user trying to resubmit)
                const existingResponse = await prisma.response.findFirst({
                  where: {
                    formId: params.id,
                    progressiveNumber: cookieData.progressiveNumber,
                  },
                });
                
                if (existingResponse) {
                  // Same user trying to resubmit - check maxRepeats
                  // For anonymous, we can't perfectly track, but if maxRepeats is 1, block
                  if (form.maxRepeats === 1) {
                    return NextResponse.json(
                      { error: 'Hai già inviato una risposta a questo form' },
                      { status: 403 }
                    );
                  }
                  // If maxRepeats > 1, allow but we can't perfectly track anonymous users
                  // So we'll allow it
                }
              }
            } catch (e) {
              // Se il cookie è malformato, continua comunque
            }
          }
        } else {
          // maxRepeats is null (infinite) - allow submission
          // But still check cookie to prevent exact duplicate submission
          if (submittedCookie) {
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
                  // Same progressiveNumber already exists - this is a duplicate
                  return NextResponse.json(
                    { error: 'Hai già inviato questa risposta' },
                    { status: 403 }
                  );
                }
              }
            } catch (e) {
              // Se il cookie è malformato, continua comunque
            }
          }
        }
      }
      // If userId exists even for anonymous form, the check above (lines 100-134) already handles it
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
    
    let userId: string | null = null;
    let userRole: string | null = null;
    
    // Try to get user from session first
    if (session?.user?.id) {
      userId = session.user.id;
      userRole = (session.user as any).role;
    } else {
      // Fallback: try to get userId from header (for custom auth flow)
      const userIdHeader = request.headers.get('x-user-id');
      if (userIdHeader) {
        userId = userIdHeader;
        // Fetch user role from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        if (user) {
          userRole = user.role;
        }
      }
    }
    
    if (!userId) {
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
    if (userRole !== 'ADMIN' && form.ownerId !== userId) {
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