import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  callFlowisePrediction, 
  prepareFormResponsesVars 
} from '@/lib/flowiseService';

/**
 * POST /api/forms/[id]/analyze-responses
 * Analizza le risposte di un form usando Flowise Agentflow
 * 
 * Body:
 * {
 *   "agentflowId": "uuid-del-agentflow",
 *   "question": "Analizza le risposte" (opzionale)
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    const userIdHeader = req.headers.get('x-user-id');
    const userId = session?.user?.id || userIdHeader;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    // Verifica ruolo (solo ADMIN o owner del form)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    const userRole = user?.role || (session?.user as any)?.role;
    
    // Recupera il form
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
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
    
    // Verifica permessi
    if (userRole !== 'ADMIN' && form.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    // Recupera tutte le risposte
    const responses = await prisma.response.findMany({
      where: {
        formId: params.id
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        progressiveNumber: 'desc'
      }
    });
    
    if (responses.length === 0) {
      return NextResponse.json(
        { 
          error: 'Nessuna risposta trovata per questo form',
          summary: {
            total: 0,
            positive: 0,
            negative: 0,
            neutral: 0
          }
        },
        { status: 200 }
      );
    }
    
    // Leggi il body per ottenere agentflowId
    const body = await req.json();
    const agentflowId = body.agentflowId;
    const question = body.question || 'Analizza tutte le risposte di questo form e determina il sentiment generale';
    
    if (!agentflowId) {
      return NextResponse.json(
        { error: 'agentflowId è richiesto' },
        { status: 400 }
      );
    }
    
    // Prepara le variabili per Flowise
    const vars = prepareFormResponsesVars(
      {
        id: form.id,
        title: form.title,
        description: form.description,
        questions: form.questions
      },
      responses,
      userId
    );
    
    console.log('📊 Analizzando risposte con Flowise:', {
      formId: params.id,
      agentflowId,
      totalResponses: responses.length,
      textResponsesCount: vars.textResponsesCount
    });
    
    // Chiama Flowise Agentflow
    const flowiseResponse = await callFlowisePrediction(agentflowId, {
      question: question,
      history: [],
      overrideConfig: {
        returnSourceDocuments: false,
        sessionId: `form-analysis-${params.id}-${Date.now()}`,
        vars: vars
      }
    });
    
    // Estrai il risultato
    let analysisResult;
    try {
      // Prova a parsare JSON dalla risposta
      const responseText = flowiseResponse.text || flowiseResponse.message || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Se non è JSON, crea un risultato di default
        analysisResult = {
          rawResponse: responseText,
          parsed: false
        };
      }
    } catch (e) {
      // Se il parsing fallisce, restituisci la risposta raw
      analysisResult = {
        rawResponse: flowiseResponse.text || flowiseResponse.message || '',
        parsed: false,
        error: 'Impossibile parsare la risposta JSON'
      };
    }
    
    return NextResponse.json({
      success: true,
      formId: params.id,
      formTitle: form.title,
      totalResponses: responses.length,
      textResponsesCount: vars.textResponsesCount,
      analysis: analysisResult,
      flowiseResponse: flowiseResponse
    });
    
  } catch (error) {
    console.error('❌ Errore nell\'analisi delle risposte:', error);
    return NextResponse.json(
      { 
        error: 'Errore nell\'analisi delle risposte',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forms/[id]/analyze-responses
 * Restituisce informazioni sull'endpoint
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    endpoint: `/api/forms/${params.id}/analyze-responses`,
    method: 'POST',
    description: 'Analizza le risposte di un form usando Flowise Agentflow',
    requiredBody: {
      agentflowId: 'string (UUID del Agentflow in Flowise)',
      question: 'string (opzionale, domanda per l\'analisi)'
    },
    example: {
      agentflowId: 'b1d6d758-d8c4-4ac9-b023-5791c4939217',
      question: 'Analizza tutte le risposte e determina il sentiment'
    }
  });
}

