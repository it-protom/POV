import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`;
  
  // Create direct Azure AD authorization URL
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', 'direct-auth-' + Date.now());
  authUrl.searchParams.set('prompt', 'select_account');
  
  // Redirect directly to Azure AD
  return NextResponse.redirect(authUrl.toString());
}
