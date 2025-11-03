import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendFormInvite } from '@/lib/email';

// POST /api/forms/[id]/share - Invia email di invito per il form
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verifica che l'utente sia admin o proprietario del form
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        ownerId: true,
        isPublic: true
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }

    // Solo admin o proprietario possono inviare inviti
    const isOwner = form.ownerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato a condividere questo form' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipients, subject, message } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Almeno un destinatario è richiesto' },
        { status: 400 }
      );
    }

    // Valida gli indirizzi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = recipients.filter((email: string) => 
      emailRegex.test(email.trim())
    );

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Nessun indirizzo email valido' },
        { status: 400 }
      );
    }

    // Costruisci l'URL del form - usa il dominio di produzione se disponibile
    // In produzione dovrebbe essere https://pov.protom.com
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Se FRONTEND_URL non è impostato ma siamo in produzione, usa pov.protom.com
    if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
      frontendUrl = 'https://pov.protom.com';
    }
    
    // Override se esiste una variabile PUBLIC_URL esplicita
    if (process.env.PUBLIC_URL) {
      frontendUrl = process.env.PUBLIC_URL;
    }
    
    const formUrl = `${frontendUrl}/forms/${params.id}`;

    // Invia le email
    const emailResult = await sendFormInvite(
      validRecipients,
      subject || `Invito a compilare il form: ${form.title}`,
      formUrl,
      message
    );

    console.log('✅ Form share emails sent:', {
      formId: params.id,
      formTitle: form.title,
      recipients: validRecipients.length,
      sender: session.user.email
    });

    return NextResponse.json({
      success: true,
      message: 'Inviti inviati con successo',
      recipients: emailResult.recipients,
      messageId: emailResult.messageId
    });

  } catch (error: any) {
    console.error('❌ Error sending form share emails:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Errore durante l\'invio delle email',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': responseOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

