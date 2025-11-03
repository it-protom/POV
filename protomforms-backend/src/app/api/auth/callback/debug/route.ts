import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint di debug per vedere cosa riceve NextAuth nel callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  console.log('🔍 Callback debug - URL params:', {
    code: searchParams.get('code') ? 'present' : 'missing',
    state: searchParams.get('state') ? 'present' : 'missing',
    error: searchParams.get('error'),
    error_description: searchParams.get('error_description'),
    allParams: Object.fromEntries(searchParams.entries()),
    fullUrl: request.url,
    timestamp: new Date().toISOString()
  });
  
  return NextResponse.json({
    message: 'Check server logs for callback details',
    params: {
      hasCode: !!searchParams.get('code'),
      hasState: !!searchParams.get('state'),
      error: searchParams.get('error'),
      errorDescription: searchParams.get('error_description'),
    }
  });
}


