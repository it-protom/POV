import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Redirect backend root to frontend dashboard
  if (request.nextUrl.pathname === '/' && request.method === 'GET') {
    return NextResponse.redirect(frontendUrl + '/admin/dashboard', { status: 302 });
  }

  // CORS for API routes (including NextAuth)
  if (request.nextUrl.pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'https://agoexplorer.protom.com',
      'http://localhost:3001',
    ];
    const isOriginAllowed = origin && allowedOrigins.includes(origin);
    const responseOrigin = isOriginAllowed ? origin : allowedOrigins[0];

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': responseOrigin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-user-id',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', responseOrigin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', 'Set-Cookie');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/'],
};

