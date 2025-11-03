import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione e ruolo admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ottieni tutti gli utenti con informazioni aggiuntive
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Conta i form creati e risposte
        _count: {
          select: {
            forms: true,
            responses: true,
          },
        },
        // Informazioni Azure AD
        accounts: {
          where: {
            provider: 'azure-ad'
          },
          select: {
            providerAccountId: true,
            access_token: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcola le statistiche
    const totalUsers = users.length;
    const activeUsers = users.length; // Tutti gli utenti sono considerati attivi
    const adminUsers = users.filter(user => user.role === 'ADMIN').length;
    
    // Utenti nuovi questo mese
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = users.filter(user => 
      new Date(user.createdAt) >= thisMonth
    ).length;

    // Statistiche totali
    const totalFormsCreated = users.reduce((sum, user) => sum + user._count.forms, 0);
    const totalResponsesSubmitted = users.reduce((sum, user) => sum + user._count.responses, 0);

    // Formatta i dati per il frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Utente senza nome',
      email: user.email,
      role: user.role,
      image: null, // Non disponibile nel modello attuale
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.updatedAt.toISOString(), // Usa updatedAt come proxy
      isActive: true, // Tutti gli utenti sono considerati attivi
      formsCreated: user._count.forms,
      responsesSubmitted: user._count.responses,
      azureId: user.accounts[0]?.providerAccountId || null,
      department: null, // Non disponibile nel modello attuale
      jobTitle: null, // Non disponibile nel modello attuale
      officeLocation: null, // Non disponibile nel modello attuale
    }));

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisMonth,
      totalFormsCreated,
      totalResponsesSubmitted,
    };

    return NextResponse.json({
      users: formattedUsers,
      stats,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticazione e ruolo admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticazione e ruolo admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Per ora, restituisci un errore perché non abbiamo un campo isActive
    return NextResponse.json({ 
      error: 'User deactivation not implemented - missing isActive field in schema' 
    }, { status: 501 });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 