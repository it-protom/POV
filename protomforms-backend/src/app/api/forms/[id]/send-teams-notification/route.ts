import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTeamsNotification } from '@/lib/teams-notification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    let userId: string | null = null;
    let userRole: string | null = null;
    
    // Try to get user from session first
    if (session?.user?.id) {
      userId = session.user.id;
      userRole = (session.user as any).role;
    } else {
      // Fallback: try to get userId from header (for custom auth flow)
      const userIdHeader = request.headers.get('x-user-id');
      if (userIdHeader) {
        userId = userIdHeader;
        // Fetch user role from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        if (user) {
          userRole = user.role;
        }
      }
    }

    if (!userId) {
      console.log('⚠️ /api/forms/[id]/send-teams-notification - Unauthorized: No userId');
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'utente sia ADMIN
    if (userRole !== 'ADMIN') {
      console.log('⚠️ /api/forms/[id]/send-teams-notification - Forbidden: User is not ADMIN');
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono inviare notifiche Teams.' },
        { status: 403 }
      );
    }

    // Leggi title e text dal body (opzionali, con valori di default)
    const body = await request.json().catch(() => ({}));
    const customTitle = body.title;
    const customText = body.text;

    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }

    // Usa i valori personalizzati o quelli di default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const formUrl = `${frontendUrl}/forms/${form.id}`;
    
    const notificationTitle = customTitle || 'Nuovo Form Creato';
    const notificationText = customText || `${form.owner?.name || 'Utente'} ha creato un nuovo form: ${form.title}`;

    // Invia la notifica a Teams
    let notificationSent = false;
    try {
      notificationSent = await sendTeamsNotification({
        title: notificationTitle,
        text: notificationText,
        themeColor: 'FFD700', // Colore giallo Protom
        potentialAction: [
          {
            name: 'Compila Form',
            target: formUrl
          }
        ]
      });
      console.log('Risultato invio notifica Teams:', notificationSent);
    } catch (notificationError) {
      console.error('Errore nell\'invio della notifica Teams:', notificationError);
      // Non blocchiamo l'aggiornamento dello stato se la notifica fallisce
    }

    // Aggiorna lo stato della notifica
    const updatedForm = await prisma.form.update({
      where: { id: params.id },
      data: {
        teamsNotificationSent: notificationSent,
        teamsNotificationSentAt: notificationSent ? new Date() : null,
      },
      select: {
        teamsNotificationSent: true,
        teamsNotificationSentAt: true,
      },
    });

    return NextResponse.json({
      success: notificationSent,
      teamsNotificationSent: updatedForm.teamsNotificationSent,
      teamsNotificationSentAt: updatedForm.teamsNotificationSentAt,
    });
  } catch (error) {
    console.error('Errore nell\'invio della notifica Teams:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 