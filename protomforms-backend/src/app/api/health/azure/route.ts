import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // In un'implementazione reale, verificheresti la connessione ad Azure AD
    // Per ora restituiamo uno stato simulato
    const lastSync = new Date().toISOString();

    return NextResponse.json({
      status: 'connected',
      lastSync,
      provider: 'Azure AD',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'N/A',
      clientId: process.env.AZURE_AD_CLIENT_ID || 'N/A'
    });
  } catch (error) {
    console.error('Errore nel controllo di Azure AD:', error);
    return NextResponse.json({
      status: 'error',
      lastSync: null,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
} 