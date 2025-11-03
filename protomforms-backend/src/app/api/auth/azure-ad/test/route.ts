import { NextResponse } from 'next/server';

/**
 * Endpoint di test per verificare l'URL di autenticazione Azure AD
 */
export async function GET(request: Request) {
  const clientId = 'bb85c044-bde0-48e2-b050-57da3690b9ff';
  const tenantId = '94524ed0-9807-4351-bd2e-ba548fd5a31d';
  const redirectUri = 'http://localhost:3001/api/auth/callback/azure-ad';
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') || 'http://localhost:3000/admin/dashboard';
  
  // Create Azure AD authorization URL manually
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', 'test-' + Date.now());
  authUrl.searchParams.set('prompt', 'select_account');
  
  return NextResponse.json({
    success: true,
    azureAdUrl: authUrl.toString(),
    redirectUri,
    callbackUrl,
    info: 'Questo è l\'URL che dovrebbe essere aperto per l\'autenticazione Azure AD'
  });
}


