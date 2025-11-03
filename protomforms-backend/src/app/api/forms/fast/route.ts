import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { advancedCache } from '@/lib/advanced-cache';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = session.user.id;

    // Cache ultra-aggressivo per i form dell'utente
    const cacheKey = `forms:user:${userId}:limit:${limit}:ultra-fast`;
    
    const forms = await advancedCache.getOrSet(
      cacheKey,
      async () => {
        console.time('Ultra-fast forms query');
        
        // Query Prisma ottimizzata per evitare errori SQL
        const formsRaw = await prisma.form.findMany({
          where: {
            ownerId: userId
          },
          include: {
            owner: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                responses: true,
                questions: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: limit
        });
        
        console.timeEnd('Ultra-fast forms query');
        
        // Calcola statistiche aggregate
        const totalResponses = formsRaw.reduce((sum, form) => sum + form._count.responses, 0);
        const totalQuestions = formsRaw.reduce((sum, form) => sum + form._count.questions, 0);
        
        const transformedForms = formsRaw.map(form => ({
          id: form.id,
          title: form.title,
          description: form.description,
          type: form.type,
          status: form.isPublic ? 'published' : 'draft',
          responseCount: form._count.responses,
          questionCount: form._count.questions,
          author: form.owner?.name || 'Unknown',
          createdAt: form.createdAt.toISOString(),
          updatedAt: form.updatedAt.toISOString()
        }));
        
        return {
          forms: transformedForms,
          stats: {
            totalForms: formsRaw.length,
            totalResponses,
            totalQuestions,
            avgResponsesPerForm: formsRaw.length > 0 ? Math.round(totalResponses / formsRaw.length) : 0
          }
        };
      },
      20 * 60 // 20 minuti di cache (in secondi)
    );

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching ultra-fast forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 