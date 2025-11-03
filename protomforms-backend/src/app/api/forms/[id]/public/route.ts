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

// GET /api/forms/[id]/public - Get a single public form for filling
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Fetch the form - must be public
    const form = await prisma.form.findUnique({
      where: { 
        id: params.id,
        isPublic: true // Must be public
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato o non pubblico' },
        { status: 404 }
      );
    }

    // Check if form is expired
    const now = new Date();
    if (form.closesAt && new Date(form.closesAt) < now) {
      return NextResponse.json(
        { error: 'Form scaduto' },
        { status: 403 }
      );
    }

    // Check if form is not yet open
    if (form.opensAt && new Date(form.opensAt) > now) {
      return NextResponse.json(
        { error: 'Form non ancora disponibile' },
        { status: 403 }
      );
    }

    // If user is authenticated, check if they already submitted
    if (userId && !form.isAnonymous) {
      const existingResponse = await prisma.response.findFirst({
        where: {
          formId: form.id,
          userId: userId
        }
      });

      if (existingResponse && !form.allowEdit) {
        return NextResponse.json(
          { error: 'Hai già compilato questo form' },
          { status: 403 }
        );
      }
    }

    // Format response - includi il tema completo
    const formattedForm = {
      id: form.id,
      title: form.title,
      description: form.description || '',
      type: form.type,
      isPublic: form.isPublic,
      isAnonymous: form.isAnonymous,
      allowEdit: form.allowEdit,
      showResults: form.showResults,
      thankYouMessage: form.thankYouMessage,
      opensAt: form.opensAt?.toISOString(),
      closesAt: form.closesAt?.toISOString(),
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
      theme: form.theme || null, // Include il tema completo (JSON)
      owner: {
        id: form.owner.id,
        name: form.owner.name || 'Utente Sconosciuto',
        email: form.owner.email
      },
      questions: form.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options,
        order: q.order
      }))
    };

    return NextResponse.json(formattedForm);

  } catch (error) {
    console.error('Error fetching public form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
