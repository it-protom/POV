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
    
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';

    // Fetch the form
    // If preview and requester is admin or owner, allow fetching even if not public
    const baseForm = await prisma.form.findUnique({
      where: { id: params.id },
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

    if (!baseForm) {
      return NextResponse.json(
        { error: 'Form non trovato o non pubblico' },
        { status: 404 }
      );
    }

    const isOwner = userId && baseForm.ownerId === userId;
    const isAdmin = userRole === 'ADMIN';
    const canPreviewBypass = isPreview && (isOwner || isAdmin);

    // If not in preview-bypass mode, require form to be public
    if (!canPreviewBypass && !baseForm.isPublic) {
      return NextResponse.json(
        { error: 'Form non trovato o non pubblico' },
        { status: 404 }
      );
    }

    // Check dates only if not bypassing preview
    const now = new Date();
    if (!canPreviewBypass && baseForm.closesAt && new Date(baseForm.closesAt) < now) {
      console.log(`⚠️ Form ${params.id} è scaduto (closesAt: ${baseForm.closesAt})`);
      return NextResponse.json(
        { error: 'Form scaduto' },
        { status: 403 }
      );
    }

    // Check if form is not yet open
    if (!canPreviewBypass && baseForm.opensAt && new Date(baseForm.opensAt) > now) {
      console.log(`⚠️ Form ${params.id} non ancora disponibile (opensAt: ${baseForm.opensAt})`);
      return NextResponse.json(
        { error: 'Form non ancora disponibile' },
        { status: 403 }
      );
    }

    // If user is authenticated, and not bypassing preview, check if they already submitted
    if (!canPreviewBypass && userId && !baseForm.isAnonymous) {
      const existingResponse = await prisma.response.findFirst({
        where: {
          formId: baseForm.id,
          userId: userId
        }
      });

      if (existingResponse && !baseForm.allowEdit) {
        console.log(`⚠️ Form ${params.id} già compilato dall'utente ${userId} (allowEdit: false)`);
        return NextResponse.json(
          { 
            error: 'Hai già compilato questo form', 
            alreadySubmitted: true,
            allowEdit: false 
          },
          { status: 403 }
        );
      }
    }

    // Format response - includi il tema completo
    const formattedForm = {
      id: baseForm.id,
      title: baseForm.title,
      description: baseForm.description || '',
      type: baseForm.type,
      isPublic: baseForm.isPublic,
      isAnonymous: baseForm.isAnonymous,
      allowEdit: baseForm.allowEdit,
      showResults: baseForm.showResults,
      thankYouMessage: baseForm.thankYouMessage,
      opensAt: baseForm.opensAt?.toISOString(),
      closesAt: baseForm.closesAt?.toISOString(),
      createdAt: baseForm.createdAt.toISOString(),
      updatedAt: baseForm.updatedAt.toISOString(),
      theme: baseForm.theme || null, // Include il tema completo (JSON)
      owner: {
        id: baseForm.owner.id,
        name: baseForm.owner.name || 'Utente Sconosciuto',
        email: baseForm.owner.email
      },
      questions: baseForm.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options,
        order: q.order
      }))
    };

    console.log('🎨 GET /api/forms/[id]/public - Tema dal DB:', baseForm.theme);
    console.log('🖼️ Background image:', baseForm.theme?.backgroundImage ? 'PRESENTE' : 'ASSENTE');
    if (baseForm.theme?.backgroundImage) {
      console.log('📏 Background image length:', (baseForm.theme.backgroundImage as string).length);
    }

    return NextResponse.json(formattedForm);

  } catch (error) {
    console.error('Error fetching public form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
