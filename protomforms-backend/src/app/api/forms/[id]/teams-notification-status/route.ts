import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/forms/[id]/teams-notification-status - Get the status of the Teams notification
export async function GET(
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
      select: {
        teamsNotificationSent: true,
        teamsNotificationSentAt: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teamsNotificationSent: form.teamsNotificationSent,
      teamsNotificationSentAt: form.teamsNotificationSentAt,
    });
  } catch (error) {
    console.error('Errore nel recupero dello stato della notifica Teams:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 