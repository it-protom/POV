import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { advancedCache } from '@/lib/advanced-cache';

// GET /api/forms/summary - Get forms summary with minimal data for performance
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
    
    // Log per debug
    if (!userId) {
      console.log('⚠️ /api/forms/summary - No user ID found in session or header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (userRole !== 'ADMIN') {
      console.log('⚠️ /api/forms/summary - User is not ADMIN:', {
        userId,
        userRole,
        hasSession: !!session
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ /api/forms/summary - Authorized:', {
      userId,
      userRole,
      hasSession: !!session
    });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Costruisci la query where
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }

    if (status && status !== 'all') {
      if (status === 'published') {
        where.isPublic = true;
      } else if (status === 'draft') {
        where.isPublic = false;
      }
    }

    // Cache ultra-ottimizzato con TTL lunghi
    const cacheKey = `forms:summary:ultra:${JSON.stringify({
      search,
      type,
      status,
      includeStats
    })}`;

    // Query ottimizzata con caching aggressivo
    const forms = await advancedCache.getOrSet(
      cacheKey,
      async () => {
        console.time('Forms summary query');
        
        // Usa Prisma normale ma ottimizzato per evitare errori SQL
        const formsData = await prisma.form.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
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
          }
        });
        
        console.timeEnd('Forms summary query');
        
        return formsData;
      },
      30 * 60 // 30 minuti di cache (in secondi)
    );

    // Se richieste statistiche aggiuntive, calcoliamo anche il totale
    let totalStats = null;
    if (includeStats) {
      const [totalForms, totalResponses] = await Promise.all([
        prisma.form.count({ where }),
        prisma.response.count({
          where: {
            form: where
          }
        })
      ]);
      
      totalStats = {
        totalForms,
        totalResponses,
        averageResponsesPerForm: totalForms > 0 ? Math.round(totalResponses / totalForms) : 0
      };
    }

    // Formatta i dati in formato summary
    const formattedForms = forms.map(form => {
      const status = form.isPublic ? 'published' : 'draft';
      
      return {
        id: form.id,
        title: form.title,
        description: form.description,
        type: form.type,
        status,
        responseCount: form._count.responses,
        questionCount: form._count.questions,
        author: form.owner?.name || 'Unknown',
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
      };
    });

    const response = {
      forms: formattedForms,
      ...(totalStats && { stats: totalStats })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching forms summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 