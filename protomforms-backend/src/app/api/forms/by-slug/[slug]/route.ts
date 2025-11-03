import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/forms/by-slug/[slug] - Get a form by its slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Richiedi autenticazione per accedere ai form tramite slug
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Verifica che l'utente sia un admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    const form = await prisma.form.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
        id: true,
        title: true,
        description: true,
        isAnonymous: true,
        slug: true,
        ownerId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }

    // Verifica che l'utente sia il proprietario del form
    if (form.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form by slug:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 