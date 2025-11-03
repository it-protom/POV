import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const startTime = Date.now();
    
    // Test della connessione al database
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;

    // Recupera informazioni sul database
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "User") as user_count,
        (SELECT COUNT(*) FROM "Form") as form_count,
        (SELECT COUNT(*) FROM "Response") as response_count,
        (SELECT COUNT(*) FROM "Question") as question_count,
        (SELECT COUNT(*) FROM "Answer") as answer_count
    `;

    const lastBackup = new Date().toISOString(); // In un'implementazione reale, recupereresti questa info dal sistema

    return NextResponse.json({
      status: 'connected',
      responseTime,
      lastBackup,
      stats: (stats as any)[0]
    });
  } catch (error) {
    console.error('Errore nel controllo del database:', error);
    return NextResponse.json({
      status: 'error',
      responseTime: 0,
      lastBackup: null,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
} 