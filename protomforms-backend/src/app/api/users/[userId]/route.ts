import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo ADMIN possono vedere le informazioni di altri utenti
    // Gli utenti normali possono vedere solo le proprie informazioni
    if (session.user.role !== 'ADMIN' && session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    // Ottieni le informazioni dell'utente
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        // Informazioni Azure AD (se disponibili)
        accounts: {
          where: {
            provider: 'azure-ad'
          },
          select: {
            providerAccountId: true,
            provider: true,
          }
        },
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calcola statistiche aggiuntive
    const totalAnswers = await prisma.answer.count({
      where: {
        response: {
          userId: userId
        }
      }
    });

    // Ultimi form creati
    const recentForms = await prisma.form.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        isPublic: true,
        _count: {
          select: {
            responses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Ultime risposte
    const recentResponses = await prisma.response.findMany({
      where: { userId: userId },
      select: {
        id: true,
        createdAt: true,
        progressiveNumber: true,
        form: {
          select: {
            id: true,
            title: true,
            type: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calcola il tasso di completamento medio
    const responsesWithAnswers = await prisma.response.findMany({
      where: { userId: userId },
      select: {
        answers: {
          select: { id: true }
        },
        form: {
          select: {
            questions: {
              select: { id: true }
            }
          }
        }
      }
    });

    let totalCompletionRate = 0;
    if (responsesWithAnswers.length > 0) {
      const completionRates = responsesWithAnswers.map(response => {
        const answersCount = response.answers.length;
        const questionsCount = response.form.questions.length;
        return questionsCount > 0 ? (answersCount / questionsCount) * 100 : 0;
      });
      totalCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;
    }

    // Formatta i dati per il frontend
    const formattedUser = {
      id: user.id,
      name: user.name || 'Utente senza nome',
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isActive: true, // Tutti gli utenti sono considerati attivi
      
      // Statistiche
      statistics: {
        formsCreated: user._count.forms,
        responsesSubmitted: user._count.responses,
        totalAnswers: totalAnswers,
        averageCompletionRate: Math.round(totalCompletionRate),
        averageAnswersPerResponse: user._count.responses > 0 ? Math.round(totalAnswers / user._count.responses) : 0
      },

      // Informazioni account
      accounts: user.accounts.map(account => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId
      })),

      // Attività recente
      recentActivity: {
        forms: recentForms.map(form => ({
          id: form.id,
          title: form.title,
          type: form.type,
          createdAt: form.createdAt.toISOString(),
          isPublic: form.isPublic,
          responsesCount: form._count.responses
        })),
        responses: recentResponses.map(response => ({
          id: response.id,
          createdAt: response.createdAt.toISOString(),
          progressiveNumber: response.progressiveNumber,
          form: {
            id: response.form.id,
            title: response.form.title,
            type: response.form.type,
            owner: response.form.owner
          }
        }))
      },

      // Metadati aggiuntivi
      metadata: {
        joinedDaysAgo: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        lastActivityDaysAgo: Math.floor((Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    return NextResponse.json(formattedUser);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Solo ADMIN possono modificare altri utenti
    // Gli utenti normali possono modificare solo se stessi (limitato)
    if (session.user.role !== 'ADMIN' && session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepara i dati da aggiornare
    const updateData: any = {};

    // Solo ADMIN possono cambiare il ruolo
    if (session.user.role === 'ADMIN' && body.role) {
      updateData.role = body.role;
    }

    // Tutti possono aggiornare nome (se è il proprio profilo)
    if (body.name && session.user.id === userId) {
      updateData.name = body.name;
    }

    // Solo ADMIN possono aggiornare nome di altri utenti
    if (body.name && session.user.role === 'ADMIN') {
      updateData.name = body.name;
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Non permettere di eliminare se stesso
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Elimina l'utente (cascade eliminerà form e risposte)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 