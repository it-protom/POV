import { NextRequest, NextResponse } from 'next/server';

/**
 * Intercetta gli errori da NextAuth e reindirizza al frontend
 * NextAuth reindirizza a /api/auth/signin?error=... quando ci sono errori
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl');
  const pathname = request.nextUrl.pathname;
  
  console.log('🔍 /api/auth/signin called:', {
    pathname,
    error,
    callbackUrl,
    fullUrl: request.url,
    timestamp: new Date().toISOString()
  });
  
  // Se c'è un errore, reindirizza SEMPRE al frontend invece di mostrare la pagina interna di NextAuth
  if (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorParams = new URLSearchParams();
    errorParams.set('error', error);
    if (callbackUrl) {
      errorParams.set('callbackUrl', callbackUrl);
    }
    const errorUrl = `${frontendUrl}/auth/signin?${errorParams.toString()}`;
    
    console.log('🔴 NextAuth error intercepted, redirecting to frontend:', {
      error,
      errorUrl,
      originalUrl: request.url
    });
    
    return NextResponse.redirect(errorUrl, { status: 302 });
  }
  
  // Se il path include un provider (es. /api/auth/signin/azure-ad), reindirizza direttamente
  // al provider-specific signin endpoint di NextAuth per avviare il flusso OAuth
  if (pathname.startsWith('/api/auth/signin/')) {
    const baseUrl = process.env.NEXTAUTH_URL || request.url.split('/api')[0];
    const directProviderUrl = new URL(pathname, baseUrl);
    directProviderUrl.search = request.url.split('?')[1] || '';

    console.log('✅ Redirecting directly to provider signin (no NextAuth page):', {
      baseUrl,
      directProviderUrl: directProviderUrl.toString(),
      originalPath: pathname
    });

    return NextResponse.redirect(directProviderUrl.toString(), { status: 307 });
  }
  
  // Altrimenti passa al handler NextAuth standard
  console.log('⚠️ /api/auth/signin called without error or provider - passing to NextAuth');
  const baseUrl = process.env.NEXTAUTH_URL || request.url.split('/api')[0];
  const nextAuthUrl = new URL('/api/auth/[...nextauth]', baseUrl);
  nextAuthUrl.search = request.url.split('?')[1] || '';
  
  console.log('🔄 Passing to NextAuth:', {
    baseUrl,
    nextAuthUrl: nextAuthUrl.toString(),
    originalUrl: request.url
  });
  
  return NextResponse.redirect(nextAuthUrl.toString(), { status: 307 });
}

