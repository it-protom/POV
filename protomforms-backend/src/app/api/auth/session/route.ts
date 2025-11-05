import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    
    // If we have a NextAuth session, use that
    if (session && session.user) {
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
    }
    
    // Fallback: check x-user-id header for custom auth flow (used after /api/auth/login)
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userIdHeader },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        });
        
        if (user) {
          console.log('✅ Session restored from x-user-id header:', user.email);
          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name || user.email?.split('@')[0] || 'User',
              role: user.role,
              image: null,
            },
            isAuthenticated: true,
          });
        }
      } catch (error) {
        console.error('Error fetching user from x-user-id header:', error);
      }
    }
    
    // No session found
    return NextResponse.json(
      { 
        user: null,
        isAuthenticated: false 
      },
      { status: 200 }
    );
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


