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

    // Solo ADMIN possono vedere le statistiche di altri utenti
    // Gli utenti normali possono vedere solo le proprie statistiche
    if (session.user.role !== 'ADMIN' && session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, 1y, all

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calcola la data di inizio basata sul timeRange
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Data molto indietro
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Statistiche generali
    const totalResponses = await prisma.response.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalAnswers = await prisma.answer.count({
      where: {
        response: {
          userId: userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    });

    // Form unici a cui ha risposto
    const uniqueFormsResponded = await prisma.response.groupBy({
      by: ['formId'],
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });

    // Form creati (se è owner)
    const formsCreated = await prisma.form.count({
      where: {
        ownerId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Risposte ricevute sui propri form
    const responsesReceived = await prisma.response.count({
      where: {
        form: {
          ownerId: userId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Attività nel tempo (ultimi 30 giorni)
    const dailyActivity = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let d = new Date(thirtyDaysAgo); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const dayResponses = await prisma.response.count({
        where: {
          userId: userId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      });

      const dayFormsCreated = await prisma.form.count({
        where: {
          ownerId: userId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      });

      dailyActivity.push({
        date: dayStart.toISOString().split('T')[0],
        responses: dayResponses,
        formsCreated: dayFormsCreated,
        totalActivity: dayResponses + dayFormsCreated
      });
    }

    // Top form a cui ha risposto
    const topFormsResponded = await prisma.response.groupBy({
      by: ['formId'],
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        formId: true
      },
      orderBy: {
        _count: {
          formId: 'desc'
        }
      },
      take: 5
    });

    // Ottieni i dettagli dei form
    const topFormsDetails = await Promise.all(
      topFormsResponded.map(async (item) => {
        const form = await prisma.form.findUnique({
          where: { id: item.formId },
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
        });

        return {
          form,
          responseCount: item._count.formId
        };
      })
    );

    // Distribuzione per tipo di form
    const formTypeDistribution = await prisma.response.groupBy({
      by: ['formId'],
      where: {
        userId: userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });

    // Ottieni i tipi di form per la distribuzione
    const formTypes = await Promise.all(
      formTypeDistribution.map(async (item) => {
        const form = await prisma.form.findUnique({
          where: { id: item.formId },
          select: { type: true }
        });
        return form?.type || 'UNKNOWN';
      })
    );

    const typeDistribution = formTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcola medie e statistiche
    const averageResponsesPerForm = uniqueFormsResponded.length > 0 
      ? Math.round(totalResponses / uniqueFormsResponded.length * 100) / 100 
      : 0;

    const averageAnswersPerResponse = totalResponses > 0 
      ? Math.round(totalAnswers / totalResponses * 100) / 100 
      : 0;

    // Streak di attività (giorni consecutivi con attività)
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].totalActivity > 0) {
        tempStreak++;
        if (i === dailyActivity.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Statistiche sui punteggi (se disponibili)
    const scores = await prisma.response.findMany({
      where: {
        userId: userId,
        score: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { score: true }
    });

    const scoreStats = scores.length > 0 ? {
      average: scores.reduce((sum, r) => sum + (r.score || 0), 0) / scores.length,
      min: Math.min(...scores.map(r => r.score || 0)),
      max: Math.max(...scores.map(r => r.score || 0)),
      count: scores.length
    } : null;

    const stats = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt.toISOString(),
        lastActivity: user.updatedAt.toISOString()
      },
      timeRange: {
        period: timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      overview: {
        totalResponses,
        totalAnswers,
        uniqueFormsResponded: uniqueFormsResponded.length,
        formsCreated,
        responsesReceived,
        averageResponsesPerForm,
        averageAnswersPerResponse
      },
      activity: {
        dailyActivity,
        currentStreak,
        maxStreak,
        totalActiveDays: dailyActivity.filter(d => d.totalActivity > 0).length
      },
      topForms: topFormsDetails,
      formTypeDistribution: Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / uniqueFormsResponded.length) * 100)
      })),
      scoreStatistics: scoreStats
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 