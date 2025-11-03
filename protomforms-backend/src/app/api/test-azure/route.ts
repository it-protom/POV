import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.AZURE_AD_CLIENT_ID;
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const redirectUri = process.env.AZURE_AD_REDIRECT_URI;

    // Check if all values are present
    const config = {
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 8)}...` : 'MISSING',
      tenantId: tenantId ? `${tenantId.substring(0, 8)}...` : 'MISSING',
      redirectUri: redirectUri || 'MISSING',
      allConfigured: !!(clientId && clientSecret && tenantId && redirectUri),
    };

    return NextResponse.json({
      success: true,
      config,
      message: config.allConfigured 
        ? 'All Azure AD environment variables are configured' 
        : 'Some Azure AD environment variables are missing',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

