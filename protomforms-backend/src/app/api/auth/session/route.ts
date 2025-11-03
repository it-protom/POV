import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authOptions configuration
    if (!authOptions) {
      console.error('❌ NextAuth configuration error: authOptions is undefined');
      return NextResponse.json(
        { 
          user: null,
          isAuthenticated: false,
          error: 'Server configuration error: authOptions is not configured'
        },
        { status: 500 }
      );
    }
    
    if (!authOptions.secret) {
      console.error('❌ NextAuth configuration error: secret is missing');
      console.error('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
      return NextResponse.json(
        { 
          user: null,
          isAuthenticated: false,
          error: 'Server configuration error: NEXTAUTH_SECRET is missing'
        },
        { status: 500 }
      );
    }
    
    // Try to get session - in App Router, getServerSession should work with just authOptions
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError: any) {
      console.error('❌ getServerSession error:', {
        message: sessionError?.message,
        stack: sessionError?.stack,
        authOptionsKeys: Object.keys(authOptions),
        hasSecret: !!authOptions.secret,
        hasAdapter: !!authOptions.adapter,
      });
      throw sessionError;
    }
    
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


