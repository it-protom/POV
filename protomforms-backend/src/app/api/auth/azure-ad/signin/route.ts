import { NextResponse } from 'next/server';

/**
 * Endpoint legacy per compatibilità - reindirizza a NextAuth
 * Questo endpoint viene mantenuto per retrocompatibilità, ma ora reindirizza
 * a NextAuth che gestisce correttamente state, PKCE e callback
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl');
  // Usa sempre NEXTAUTH_URL che è configurato come HTTPS in produzione
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  
  console.log('🔄 Legacy Azure AD signin endpoint called, redirecting to NextAuth:', {
    callbackUrl,
    nextAuthUrl,
    timestamp: new Date().toISOString()
  });
  
  // Reindirizza a NextAuth che gestirà tutto correttamente
  // NextAuth gestirà state, PKCE e il redirect ad Azure AD
  // IMPORTANTE: usa NEXTAUTH_URL per garantire HTTPS in produzione
  const nextAuthSignInUrl = new URL('/api/auth/signin/azure-ad', nextAuthUrl);
  if (callbackUrl) {
    nextAuthSignInUrl.searchParams.set('callbackUrl', callbackUrl);
  }
  
  console.log('✅ Redirecting to NextAuth (HTTPS in production):', nextAuthSignInUrl.toString());
  
  return NextResponse.redirect(nextAuthSignInUrl.toString(), { 
    status: 307,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}

