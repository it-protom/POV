import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
    
    if (!userId || userRole !== 'ADMIN') {
      console.log('⚠️ /api/responses - Unauthorized:', {
        hasUserId: !!userId,
        userRole,
        hasSession: !!session
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const responses = await prisma.response.findMany({
      include: {
        form: {
          select: {
            title: true,
            description: true,
            isAnonymous: true,
            slug: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 