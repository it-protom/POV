import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    tenantId: process.env.AZURE_AD_TENANT_ID,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV,
    hasClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
    redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`,
  };

  return NextResponse.json({
    message: 'Azure AD Configuration Debug',
    config,
    timestamp: new Date().toISOString(),
  });
}
