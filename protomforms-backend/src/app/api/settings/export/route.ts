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

    // Recupera le impostazioni dal database
    const settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json({ error: 'Nessuna impostazione trovata' }, { status: 404 });
    }

    // Prepara i dati per l'esportazione
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email,
      settings: settings.settings,
      metadata: {
        version: '1.0.0',
        platform: 'ProtomForms',
        exportFormat: 'JSON'
      }
    };

    // Crea il file di esportazione
    const filename = `protomforms-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Errore nell\'esportazione delle impostazioni:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 