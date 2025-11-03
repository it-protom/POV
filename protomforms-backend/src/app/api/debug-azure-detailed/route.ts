import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    // Environment variables
    clientId: process.env.AZURE_AD_CLIENT_ID,
    tenantId: process.env.AZURE_AD_TENANT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    nextAuthUrl: process.env.NEXTAUTH_URL,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV,
    
    // Computed values
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`,
    authorizationUrl: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
    
    // Azure AD configuration check
    azureConfig: {
      clientIdValid: !!process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_ID !== 'development-client-id',
      tenantIdValid: !!process.env.AZURE_AD_TENANT_ID && process.env.AZURE_AD_TENANT_ID !== 'development-tenant-id',
      clientSecretValid: !!process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_CLIENT_SECRET !== 'development-client-secret',
      nextAuthUrlValid: !!process.env.NEXTAUTH_URL,
    }
  };

  return NextResponse.json({
    message: 'Detailed Azure AD Configuration Debug',
    config,
    timestamp: new Date().toISOString(),
    recommendations: [
      'Verify Azure AD app registration has correct redirect URI',
      'Check that Token ID is enabled in Azure AD app',
      'Ensure Client ID and Tenant ID are correct',
      'Verify Client Secret is valid and not expired'
    ]
  });
}
