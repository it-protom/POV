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

// GET /api/users/responses - Get current user's responses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    let userId: string | null = null;
    
    // Try to get userId from session
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // If no session, try to get userId from header (for custom auth)
      const userIdHeader = request.headers.get('x-user-id');
      if (userIdHeader) {
        userId = userIdHeader;
      }
    }
    
    if (!userId) {
      console.log('❌ No user ID found in session or header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's responses
    const responses = await prisma.response.findMany({
      where: {
        userId: userId
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
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
    console.error('Error fetching user responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
