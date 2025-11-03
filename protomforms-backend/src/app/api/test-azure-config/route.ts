import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    clientId: process.env.AZURE_AD_CLIENT_ID || 'NOT_SET',
    clientSecretLength: process.env.AZURE_AD_CLIENT_SECRET?.length || 0,
    clientSecretStart: process.env.AZURE_AD_CLIENT_SECRET?.substring(0, 10) || 'NOT_SET',
    tenantId: process.env.AZURE_AD_TENANT_ID || 'NOT_SET',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT_SET',
    frontendUrl: process.env.FRONTEND_URL || 'NOT_SET',
    
    // Costruisce l'URL di autorizzazione manualmente
    authorizationUrl: process.env.AZURE_AD_TENANT_ID 
      ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`
      : 'TENANT_ID_NOT_SET',
    
    // URL di callback che NextAuth userà
    callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/auth/callback/azure-ad`,
    
    // Parametri che NextAuth invierà
    expectedParams: {
      client_id: process.env.AZURE_AD_CLIENT_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/auth/callback/azure-ad`,
      response_type: 'code',
      scope: 'openid profile email User.Read',
    },
  };

  return NextResponse.json(config, { status: 200 });
}

