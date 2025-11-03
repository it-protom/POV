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

    // Invia una notifica di test
    const result = await sendTeamsNotification({
      title: 'Test Notifica Teams',
      text: 'Questa è una notifica di test inviata da Protom Forms.',
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
        : 'Impossibile inviare la notifica'
    });
  } catch (error) {
    console.error('Errore nell\'invio della notifica di test:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 