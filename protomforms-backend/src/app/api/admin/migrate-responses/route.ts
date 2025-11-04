import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ENDPOINT TEMPORANEO PER MIGRAZIONE RISPOSTE
// Associa le risposte con userId = null agli utenti corretti

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo ADMIN può eseguire la migrazione
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting response migration...');

    // 1. Trova tutte le risposte con userId = null
    const orphanedResponses = await prisma.response.findMany({
      where: {
        userId: null
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            isAnonymous: true,
            ownerId: true
          }
        }
      }
    });

    console.log(`Found ${orphanedResponses.length} orphaned responses`);

    let migratedCount = 0;
    let skippedCount = 0;

    // 2. Per ogni risposta orfana, prova ad associarla all'owner del form
    // (assumendo che l'owner abbia testato il proprio form)
    for (const response of orphanedResponses) {
      // Solo per form NON anonimi, associa all'owner
      if (!response.form.isAnonymous && response.form.ownerId) {
        try {
          await prisma.response.update({
            where: { id: response.id },
            data: { userId: response.form.ownerId }
          });
          migratedCount++;
          console.log(`✅ Migrated response ${response.id} to owner ${response.form.ownerId}`);
        } catch (error) {
          console.error(`❌ Failed to migrate response ${response.id}:`, error);
          skippedCount++;
        }
      } else {
        // Per form anonimi, lascia userId = null
        skippedCount++;
        console.log(`⏭️ Skipped anonymous form response ${response.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        total: orphanedResponses.length,
        migrated: migratedCount,
        skipped: skippedCount
      }
    });

  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET per vedere lo stato senza migrare
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orphanedResponses = await prisma.response.findMany({
      where: {
        userId: null
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            isAnonymous: true,
            ownerId: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      take: 50
    });

    const totalOrphaned = await prisma.response.count({
      where: {
        userId: null
      }
    });

    const totalWithUser = await prisma.response.count({
      where: {
        userId: { not: null }
      }
    });

    return NextResponse.json({
      stats: {
        totalOrphaned,
        totalWithUser,
        total: totalOrphaned + totalWithUser
      },
      orphanedResponses: orphanedResponses.map(r => ({
        id: r.id,
        formId: r.formId,
        formTitle: r.form.title,
        isAnonymous: r.form.isAnonymous,
        ownerId: r.form.ownerId,
        ownerName: r.form.owner?.name,
        progressiveNumber: r.progressiveNumber,
        createdAt: r.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching migration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

