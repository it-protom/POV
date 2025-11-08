import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyNewFormCreated, sendTeamsNotification } from '@/lib/teams-notification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const formId = params.id;
    console.log('🔐 POST /api/forms/[id]/publish - Auth check:', {
      formId,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId,
      userIdType: typeof userId,
      userEmail: session?.user?.email,
      userRole,
      fromHeader: !!request.headers.get('x-user-id'),
      cookies: request.headers.get('cookie') ? 'present' : 'missing'
    });
    
    if (!userId) {
      console.error('❌ POST /api/forms/[id]/publish - No user ID found in session or header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verifica che il form esista prima di controllare l'ownership
    const formExists = await prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, ownerId: true, title: true }
    });

    if (!formExists) {
      console.error('❌ POST /api/forms/[id]/publish - Form not found:', formId);
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Verifica che il form appartenga all'utente OPPURE che l'utente sia un ADMIN
    if (formExists.ownerId !== userId && userRole !== 'ADMIN') {
      console.error('❌ POST /api/forms/[id]/publish - Form ownership mismatch:', {
        formId,
        formOwnerId: formExists.ownerId,
        userId,
        userRole,
        formTitle: formExists.title
      });
      return NextResponse.json({ 
        error: 'Unauthorized - You do not own this form' 
      }, { status: 403 });
    }

    // Log se un admin sta pubblicando un form di un altro utente
    if (formExists.ownerId !== userId && userRole === 'ADMIN') {
      console.log('✅ POST /api/forms/[id]/publish - Admin publishing form owned by another user:', {
        formId,
        formOwnerId: formExists.ownerId,
        adminUserId: userId,
        formTitle: formExists.title
      });
    }

    // Recupera il form completo
    const form = await prisma.form.findUnique({
      where: { id: formId }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Verifica se il form era già pubblicato prima
    const wasAlreadyPublished = form.isPublic && form.status === 'PUBLISHED';

    // Leggi il body per vedere se inviare il webhook e se ci sono titolo/messaggio personalizzati
    let sendWebhook = false;
    let customTitle: string | undefined;
    let customText: string | undefined;
    try {
      const body = await request.json();
      sendWebhook = body.sendWebhook === true;
      customTitle = body.title;
      customText = body.text;
    } catch (e) {
      // Se non c'è body o è malformato, non inviare webhook (comportamento predefinito)
      console.log('⚠️ Nessun body nella richiesta o body malformato, webhook non verrà inviato');
    }

    // Aggiorna il form per renderlo pubblico
    const updatedForm = await prisma.form.update({
      where: { id: formId },
      data: { 
        isPublic: true, // Rendi il form pubblico quando viene pubblicato
        status: 'PUBLISHED' // Imposta lo stato su PUBLISHED
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        questions: {
          select: {
            id: true
          }
        },
        responses: {
          select: {
            id: true,
            createdAt: true,
            answers: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Invia notifica Teams solo se:
    // 1. Il form non era già pubblicato
    // 2. L'utente è un ADMIN
    // 3. L'utente ha esplicitamente richiesto di inviare il webhook
    if (!wasAlreadyPublished && userRole === 'ADMIN' && sendWebhook) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const formUrl = `${frontendUrl}/forms/${updatedForm.id}`;
        
        // Usa titolo e messaggio personalizzati se forniti, altrimenti usa i valori di default
        const notificationTitle = customTitle || 'Nuovo Form Pubblicato';
        const notificationText = customText || `${updatedForm.owner?.name || updatedForm.owner?.email || 'Admin'} ha pubblicato un nuovo form: ${updatedForm.title}`;
        
        const notificationSent = await sendTeamsNotification({
          title: notificationTitle,
          text: notificationText,
          themeColor: 'FFD700', // Colore giallo Protom
          potentialAction: [
            {
              name: 'Compila Form',
              target: formUrl
            }
          ]
        });
        
        if (notificationSent) {
          // Aggiorna lo stato della notifica nel database
          await prisma.form.update({
            where: { id: updatedForm.id },
            data: {
              teamsNotificationSent: true,
              teamsNotificationSentAt: new Date(),
            }
          });
          console.log('✅ Notifica Teams inviata con successo per il form pubblicato:', updatedForm.id);
        } else {
          console.warn('⚠️ Invio notifica Teams fallito per il form pubblicato:', updatedForm.id);
        }
      } catch (notificationError) {
        // Non blocchiamo la pubblicazione se la notifica fallisce
        console.error('❌ Errore nell\'invio della notifica Teams:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Form published successfully',
      form: updatedForm
    });

  } catch (error) {
    console.error('Error publishing form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 