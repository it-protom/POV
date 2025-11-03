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
    
    // Get all public forms (isPublic: true)
    // Se hanno status PUBLISHED li mostriamo, altrimenti mostriamo comunque quelli pubblici
    // Questo permette retrocompatibilità con form che non hanno ancora lo status impostato
    const forms = await prisma.form.findMany({
      where: { 
        isPublic: true,
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
      
      const answeredFormIds = new Set(userResponses.map(r => r.formId));

      // Filter out forms the user has already answered
      availableForms = forms.filter(form => !answeredFormIds.has(form.id));
      console.log(`✅ ${availableForms.length} forms available for user (${forms.length - availableForms.length} already answered)`);
    } else {
      console.log('ℹ️ No user session - showing all public forms');
    }

    // Formatta i dati per il frontend in modo compatibile
    const formattedForms = availableForms.map(form => ({
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
      questions: form.questions,
      responses: form.responses
    }));

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