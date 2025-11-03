import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`;
  
  // Test direct Azure AD authorization URL
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', 'test-state-' + Date.now());
  
  return NextResponse.json({
    message: 'Azure AD Direct Test',
    authUrl: authUrl.toString(),
    instructions: [
      '1. Copia l\'URL authUrl',
      '2. Incollalo nel browser',
      '3. Prova a fare login con giuseppe.mursia@protom.com',
      '4. Se funziona, l\'applicazione Azure AD è configurata correttamente',
      '5. Se non funziona, controlla la configurazione nel portale Azure AD'
    ],
    config: {
      clientId,
      tenantId,
      redirectUri,
    },
    timestamp: new Date().toISOString(),
  });
}
