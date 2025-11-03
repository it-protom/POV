import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      message: 'Azure AD Auth Test',
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: (session.user as any)?.name || session.user?.email?.split('@')[0] || 'User',
          role: (session.user as any)?.role,
        },
        isAuthenticated: true,
      } : {
        isAuthenticated: false,
        message: 'No active session'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Azure AD auth test error:', error);
    return NextResponse.json(
      { 
        error: 'Azure AD auth test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
