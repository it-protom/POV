import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': responseOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET /api/forms/public - Get all public forms available for users
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/forms/public - Request received');
    
    // Non bloccare se getServerSession va in timeout - questo endpoint deve funzionare sempre
    let session = null;
    let userId = null;
    
    try {
      session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log('✅ Session retrieved:', userId ? `User: ${userId}` : 'No session');
    } catch (sessionError) {
      console.warn('⚠️ Session check failed (non-critical):', sessionError);
      // Continua senza sessione - l'endpoint deve funzionare anche senza autenticazione
    }

    console.log('🔍 Fetching public forms from database...');
    
    // Get current date/time for filtering
    const now = new Date();
    
    // Get all public forms that are currently available (not expired, already opened)
    // Se hanno status PUBLISHED li mostriamo, altrimenti mostriamo comunque quelli pubblici
    // Questo permette retrocompatibilità con form che non hanno ancora lo status impostato
    const forms = await prisma.form.findMany({
      where: { 
        isPublic: true,
        // Filtra per date: mostra solo form che sono già aperti (opensAt è null o <= now)
        // E non ancora scaduti (closesAt è null o >= now)
        AND: [
          {
            OR: [
              { opensAt: null },
              { opensAt: { lte: now } }
            ]
          },
          {
            OR: [
              { closesAt: null },
              { closesAt: { gte: now } }
            ]
          }
        ],
        // Non filtriamo per status per retrocompatibilità
        // Mostriamo tutti i form pubblici indipendentemente dallo status
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

    console.log(`📋 Found ${forms.length} public forms`);
    
    // Check if user has already responded to any forms (only if authenticated)
    let availableForms = forms;
    
    if (userId) {
      console.log(`🔍 Filtering forms for user ${userId}...`);
      const userResponses = await prisma.response.findMany({
        where: { 
          userId: userId
        },
        select: { 
          formId: true 
        }
      });
      
      // Count responses per form
      const responseCounts = new Map<string, number>();
      userResponses.forEach(r => {
        responseCounts.set(r.formId, (responseCounts.get(r.formId) || 0) + 1);
      });

      // Filter forms based on maxRepeats
      availableForms = forms.filter(form => {
        const userResponseCount = responseCounts.get(form.id) || 0;
        
        // Se maxRepeats è null, il form può essere ripetuto infinite volte
        if (form.maxRepeats === null) {
          return true;
        }
        
        // Se maxRepeats è definito, controlla se l'utente può ancora rispondere
        const maxRepeats = form.maxRepeats || 1; // Default a 1 se non specificato
        return userResponseCount < maxRepeats;
      });
      
      console.log(`✅ ${availableForms.length} forms available for user (${forms.length - availableForms.length} already answered or max repeats reached)`);
    } else {
      console.log('ℹ️ No user session - showing all public forms');
    }

    // Formatta i dati per il frontend in modo compatibile
    const formattedForms = availableForms.map(form => {
      // Parse options for questions if they are JSON strings
      const questionsWithParsedOptions = form.questions.map(q => {
        // Parse options if it's a string JSON
        let parsedOptions = q.options;
        if (q.options && typeof q.options === 'string') {
          try {
            parsedOptions = JSON.parse(q.options);
          } catch (e) {
            console.error('Error parsing options JSON:', e);
            parsedOptions = null;
          }
        }
        // Ensure options is an array for MULTIPLE_CHOICE type
        if (q.type === 'MULTIPLE_CHOICE' && parsedOptions && !Array.isArray(parsedOptions)) {
          parsedOptions = null;
        }
        
        return {
          ...q,
          options: parsedOptions
        };
      });

      return {
        id: form.id,
        title: form.title,
        description: form.description || '',
        type: form.type,
        isPublic: form.isPublic,
        isAnonymous: form.isAnonymous,
        allowEdit: form.allowEdit,
        showResults: form.showResults,
        opensAt: form.opensAt?.toISOString(),
        closesAt: form.closesAt?.toISOString(),
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
        owner: {
          id: form.owner.id,
          name: form.owner.name || 'Utente Sconosciuto',
          email: form.owner.email
        },
        questions: questionsWithParsedOptions,
        responses: form.responses
      };
    });

    console.log(`✅ Returning ${formattedForms.length} formatted forms`);
    
    const response = NextResponse.json(formattedForms);
    
    // Aggiungi CORS headers espliciti
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    response.headers.set('Access-Control-Allow-Origin', responseOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
    
    return response;

  } catch (error) {
    console.error('❌ Error fetching public forms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 