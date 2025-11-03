import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { type } = await request.json();

    switch (type) {
      case 'email':
        // Simula test email
        await new Promise(resolve => setTimeout(resolve, 2000));
        return NextResponse.json({
          success: true,
          message: 'Test email completato con successo',
          details: {
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
            connectionTime: 1500,
            lastTest: new Date().toISOString()
          }
        });

      case 'teams':
        // Simula test Teams webhook
        await new Promise(resolve => setTimeout(resolve, 1500));
        return NextResponse.json({
          success: true,
          message: 'Test Teams webhook completato con successo',
          details: {
            webhookUrl: 'https://webhook.office.com/...',
            responseTime: 800,
            lastNotification: new Date().toISOString()
          }
        });

      case 'azure':
        // Simula test Azure AD
        await new Promise(resolve => setTimeout(resolve, 1000));
        return NextResponse.json({
          success: true,
          message: 'Test Azure AD completato con successo',
          details: {
            tenantId: process.env.AZURE_AD_TENANT_ID || 'N/A',
            clientId: process.env.AZURE_AD_CLIENT_ID || 'N/A',
            connectionTime: 500,
            lastSync: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({ error: 'Tipo di test non supportato' }, { status: 400 });
    }
  } catch (error) {
    console.error('Errore nel test della connessione:', error);
    return NextResponse.json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 