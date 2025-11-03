import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Intercept root path redirects after Azure AD callback
  // If someone tries to access the backend root, redirect to frontend
  if (request.nextUrl.pathname === '/' && request.method === 'GET') {
    console.log('🔄 Root path accessed, redirecting to frontend:', frontendUrl);
    return NextResponse.redirect(frontendUrl + '/admin/dashboard', { status: 302 });
  }

  // Skip middleware for test endpoint to avoid blocking
  if (request.nextUrl.pathname === '/api/test') {
    return NextResponse.next();
  }

  // Handle CORS for all API routes including NextAuth
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    
    // List of allowed origins
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'https://agoexplorer.protom.com',
      'http://localhost:3001',
    ];

    // Check if the origin is allowed
    const isOriginAllowed = origin && allowedOrigins.includes(origin);
    const responseOrigin = isOriginAllowed ? origin : allowedOrigins[0];

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': responseOrigin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For actual requests, add CORS headers to the response
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', responseOrigin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', 'Set-Cookie');

    return response;
  }

  // For non-API routes, just pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/', // Intercept root path redirects
  ],
};

