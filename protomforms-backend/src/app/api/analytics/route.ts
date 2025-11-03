import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
    
    if (!userId || userRole !== 'ADMIN') {
      console.log('⚠️ /api/analytics - Unauthorized:', {
        hasUserId: !!userId,
        userRole,
        hasSession: !!session
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const formId = searchParams.get('formId');
    const questionType = searchParams.get('questionType');
    const completionStatus = searchParams.get('completionStatus');
    const search = searchParams.get('search');

    // Filtri di base
    const whereClause: any = {};
    if (formId && formId !== 'all') {
      whereClause.formId = formId;
    }
    if (from && to) {
      whereClause.createdAt = {
        gte: new Date(from),
        lte: new Date(to)
      };
    }

    // Overview - Statistiche generali
    const totalResponses = await prisma.response.count({ where: whereClause });
    const totalForms = await prisma.form.count();
    
    // Calcolo tasso di completamento (assumiamo che tutte le risposte siano complete per ora)
    const completionRate = totalResponses > 0 ? 100 : 0;
    
    // Tempo medio di risposta (mock per ora)
    const avgResponseTime = 5; // minuti
    
    // Utenti attivi (unici)
    const activeUsers = await prisma.response.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: true
    }).then(result => result.length);

    // Analisi per domanda
    const questionsWithResponses = await prisma.question.findMany({
      where: {
        form: whereClause.formId ? { id: whereClause.formId } : undefined
      },
      include: {
        answers: {
          where: whereClause,
          include: {
            response: true
          }
        }
      }
    });

    const responsesByQuestion = questionsWithResponses.map(question => {
      const answers = question.answers;
      const responseCounts = answers.reduce((acc, answer) => {
        const value = String(answer.value || '');
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalAnswers = answers.length;
      const responses = Object.entries(responseCounts).map(([value, count]) => ({
        value,
        count,
        percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
      }));

      // Calcolo statistiche per domande numeriche
      let statistics: any = {};
      if (['RATING', 'LIKERT', 'NPS'].includes(question.type)) {
        const numericValues = answers.map(a => parseFloat(String(a.value || ''))).filter(v => !isNaN(v));
        if (numericValues.length > 0) {
          statistics.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          statistics.median = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)];
          statistics.min = Math.min(...numericValues);
          statistics.max = Math.max(...numericValues);
        }
      }

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        responses,
        statistics
      };
    });

    // Dati temporali - ultimi 30 giorni
    const temporalData = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayResponses = await prisma.response.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
            lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
          }
        }
      });

      const dayCompletions = dayResponses; // Assumiamo tutte complete per ora
      
      // Punteggio medio del giorno
      const dayScores = await prisma.response.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
            lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
          }
        },
        select: { score: true }
      });

      const avgScore = dayScores.length > 0 
        ? dayScores.reduce((sum, r) => sum + (r.score || 0), 0) / dayScores.length 
        : 0;

      temporalData.push({
        date: dateStr,
        responses: dayResponses,
        completions: dayCompletions,
        avgScore: Math.round(avgScore * 100) / 100
      });
    }

    // Analisi completamento
    const completionAnalysis = {
      completed: totalResponses,
      partial: 0, // Per ora assumiamo tutte complete
      abandoned: 0,
      total: totalResponses
    };

    // Risposte a testo libero
    const openResponses = await prisma.question.findMany({
      where: {
        type: 'TEXT',
        form: whereClause.formId ? { id: whereClause.formId } : undefined
      },
      include: {
        answers: {
          where: whereClause,
          include: {
            response: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    const openResponsesData = openResponses.map(question => ({
      questionId: question.id,
      questionText: question.text,
      responses: question.answers.map(answer => ({
        id: answer.id,
        value: answer.value,
        createdAt: answer.createdAt.toISOString(),
        userId: answer.response.userId,
        userName: answer.response.user?.name || 'Anonimo'
      }))
    }));

    // Demografia (mock data per ora)
    const demographics = {
      deviceTypes: [
        { device: 'Desktop', count: Math.floor(totalResponses * 0.6), percentage: 60 },
        { device: 'Mobile', count: Math.floor(totalResponses * 0.35), percentage: 35 },
        { device: 'Tablet', count: Math.floor(totalResponses * 0.05), percentage: 5 }
      ],
      timeOfDay: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: Math.floor(Math.random() * 50) + 10
      })),
      dayOfWeek: [
        { day: 'Lunedì', count: Math.floor(Math.random() * 100) + 50 },
        { day: 'Martedì', count: Math.floor(Math.random() * 100) + 50 },
        { day: 'Mercoledì', count: Math.floor(Math.random() * 100) + 50 },
        { day: 'Giovedì', count: Math.floor(Math.random() * 100) + 50 },
        { day: 'Venerdì', count: Math.floor(Math.random() * 100) + 50 },
        { day: 'Sabato', count: Math.floor(Math.random() * 50) + 20 },
        { day: 'Domenica', count: Math.floor(Math.random() * 30) + 10 }
      ]
    };

    const analyticsData = {
      overview: {
        totalResponses,
        totalForms,
        completionRate,
        avgResponseTime,
        activeUsers
      },
      responsesByQuestion,
      temporalData,
      completionAnalysis,
      openResponses: openResponsesData,
      demographics
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 