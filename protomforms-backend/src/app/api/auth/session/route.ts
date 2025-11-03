import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          user: null,
          isAuthenticated: false 
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: (session.user as any).name || session.user.email?.split('@')[0] || 'User',
        role: (session.user as any).role,
        image: (session.user as any).image || null,
      },
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


