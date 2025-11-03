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

// GET /api/users/stats - Get current user statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's responses
    const userResponses = await prisma.response.findMany({
      where: { 
        userId: userId
      },
      select: { 
        id: true,
        formId: true,
        createdAt: true
      }
    });

    // Get count of unique forms the user has responded to
    const completedFormIds = new Set(userResponses.map(r => r.formId));
    const completedForms = completedFormIds.size;

    // Total responses count
    const totalResponses = userResponses.length;

    // Get count of available public forms
    const availableFormsCount = await prisma.form.count({
      where: { 
        isPublic: true,
        status: 'PUBLISHED'
      }
    });

    return NextResponse.json({
      totalResponses,
      completedForms,
      availableForms: availableFormsCount
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 