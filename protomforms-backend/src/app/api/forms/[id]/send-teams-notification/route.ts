import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewFormCreated } from '@/lib/teams-notification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

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

    // Se la notifica è già stata inviata, restituisci un errore
    if (form.teamsNotificationSent) {
      return NextResponse.json(
        { error: 'La notifica Teams è già stata inviata' },
        { status: 400 }
      );
    }

    // Invia la notifica a Teams
    let notificationSent = false;
    try {
      notificationSent = await notifyNewFormCreated(
        form.id,
        form.title,
        form.owner?.name || 'Utente'
      );
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