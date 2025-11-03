import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the session first
    const session = await getServerSession(authOptions);
    
    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

    // Clear NextAuth session cookies
    // These cookie names match what's configured in auth.ts
    const isProduction = process.env.NODE_ENV === 'production';
    const sessionTokenName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    const callbackUrlName = isProduction ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url';
    const csrfTokenName = isProduction ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token';

    // Clear all NextAuth cookies
    response.cookies.delete(sessionTokenName);
    response.cookies.delete(callbackUrlName);
    response.cookies.delete(csrfTokenName);
    
    // Also try alternative cookie names in case they exist
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Host-next-auth.csrf-token');

    // Set expired cookies to ensure they're removed from the client
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      secure: isProduction,
      maxAge: 0,
      expires: new Date(0),
    };

    response.cookies.set(sessionTokenName, '', cookieOptions);
    response.cookies.set(callbackUrlName, '', cookieOptions);
    response.cookies.set(csrfTokenName, '', cookieOptions);

    console.log('👋 User signed out, session cleared:', session?.user?.email);

    return response;
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

