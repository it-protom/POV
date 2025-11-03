import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTeamsNotification } from '@/lib/teams-notification';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'URL del webhook sia configurato
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL non configurato' },
        { status: 500 }
      );
    }

    // Invia una notifica di test
    const result = await sendTeamsNotification({
      title: 'Test Connessione Webhook Teams',
      text: 'Questa è una notifica di test per verificare la connessione del webhook.',
      themeColor: 'FFD700',
      potentialAction: [
        {
          name: 'Vai alla Dashboard',
          target: '/admin/dashboard'
        }
      ]
    });

    return NextResponse.json({
      success: result,
      message: result 
        ? 'Notifica inviata con successo' 
        : 'Impossibile inviare la notifica',
      webhookUrl: webhookUrl
    });
  } catch (error) {
    console.error('Errore nel test del webhook Teams:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 