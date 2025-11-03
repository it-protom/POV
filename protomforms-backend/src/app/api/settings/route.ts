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
      // Restituisce impostazioni di default se non esistono
      return NextResponse.json({
        general: {
          siteName: 'ProtomForms',
          siteDescription: 'Piattaforma per la gestione di form e sondaggi',
          defaultLanguage: 'it',
          timezone: 'Europe/Rome',
          maintenanceMode: false,
        },
        authentication: {
          azureAdEnabled: true,
          azureAdClientId: '',
          azureAdTenantId: '',
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
          },
        },
        notifications: {
          emailEnabled: false,
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          teamsWebhookEnabled: true,
          teamsWebhookUrl: '',
          notificationTypes: {
            newUser: true,
            newForm: true,
            newResponse: true,
            systemAlerts: true,
          },
        },
        security: {
          rateLimitEnabled: true,
          rateLimitRequests: 100,
          rateLimitWindow: 15,
          corsEnabled: true,
          corsOrigins: ['http://localhost:3002'],
          apiKeyRequired: false,
          auditLogEnabled: true,
        },
        database: {
          connectionString: '',
          maxConnections: 10,
          queryTimeout: 30,
          backupEnabled: true,
          backupFrequency: 'daily',
          backupRetention: 30,
        },
        appearance: {
          theme: 'auto',
          primaryColor: '#FFCD00',
          logoUrl: '',
          faviconUrl: '',
          customCss: '',
        },
      });
    }

    return NextResponse.json(settings.settings);
  } catch (error) {
    console.error('Errore nel recupero delle impostazioni:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const settings = await request.json();

    // Salva le impostazioni nel database
    const updatedSettings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {
        settings: settings,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        settings: settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Impostazioni salvate con successo',
      settings: updatedSettings.settings 
    });
  } catch (error) {
    console.error('Errore nel salvataggio delle impostazioni:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 