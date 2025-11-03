import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; progressive: string } }
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
    
    if (!userId) {
      console.log('⚠️ /api/responses/[slug]/[progressive] - Unauthorized: No userId');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Trova il form tramite slug
    const form = await prisma.form.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
        id: true,
        title: true,
        isAnonymous: true
      }
    });

    if (!form) {
      return new NextResponse('Form not found', { status: 404 });
    }

    // Trova la risposta tramite formId e numero progressivo
    const response = await prisma.response.findFirst({
      where: {
        formId: form.id,
        progressiveNumber: parseInt(params.progressive),
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            isAnonymous: true
          }
        },
        user: false, // Non includiamo mai informazioni utente per sicurezza
        answers: {
          include: {
            question: {
              select: {
                text: true,
                type: true
              }
            }
          }
        }
      },
    });

    if (!response) {
      return new NextResponse('Response not found', { status: 404 });
    }

    // Verifica i permessi:
    // - ADMIN può vedere tutte le risposte
    // - USER può vedere solo le proprie risposte
    if (userRole !== 'ADMIN' && response.userId !== userId) {
      console.log('⚠️ /api/responses/[slug]/[progressive] - Forbidden: User trying to view someone else\'s response', {
        userId,
        responseUserId: response.userId,
        userRole
      });
      return new NextResponse('Forbidden: You can only view your own responses', { status: 403 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 