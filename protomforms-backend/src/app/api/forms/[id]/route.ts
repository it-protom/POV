import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/forms/[id] - Get a single form
export async function GET(
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

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch form details first to check permissions
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        owner: true
      }
    });

    if (!form) {
      return new NextResponse('Form not found', { status: 404 });
    }

    // Check permissions: admin can see all forms, users can see their own forms
    if (userRole !== 'ADMIN' && form.ownerId !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch responses separately based on anonymity
    const responsesRaw = await prisma.response.findMany({
      where: { formId: params.id },
      include: {
        user: !form.isAnonymous ? {
          select: {
            id: true,
            name: true,
            email: true
          }
        } : false,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        progressiveNumber: 'desc'
      }
    });

    // Per form anonimi, rimuoviamo le informazioni utente MA manteniamo tutte le risposte individuali
    // Ogni risposta è identificata dal progressiveNumber per permettere all'admin di vedere risposte singole
    const responses = form.isAnonymous
      ? responsesRaw.map(r => ({
          id: r.id,
          formId: r.formId,
          progressiveNumber: r.progressiveNumber, // Usato come identificatore per risposte anonime
          createdAt: r.createdAt,
          user: null, // Nessuna informazione utente per form anonimi
          answers: r.answers // Manteniamo tutte le risposte individuali
        }))
      : responsesRaw;

    // Parse options for questions if they are JSON strings
    const questionsWithParsedOptions = form.questions.map(q => {
      // Parse options if it's a string JSON
      let parsedOptions = q.options;
      if (q.options && typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          console.error('Error parsing options JSON:', e);
          parsedOptions = null;
        }
      }
      // Le opzioni possono essere:
      // - Un array di stringhe per MULTIPLE_CHOICE senza scelta multipla o per RANKING
      // - Un oggetto { choices: [], multiple: true, maxSelections: number } per MULTIPLE_CHOICE con scelta multipla
      // Non impostiamo null se non è un array, perché potrebbe essere un oggetto MultipleChoiceOptions
      
      return {
        ...q,
        options: parsedOptions
      };
    });

    // Arricchisci i dati con lo status e le risposte
    const enrichedForm = {
      ...form,
      questions: questionsWithParsedOptions,
      responses,
      status: form.status.toLowerCase()
    };

    return NextResponse.json(enrichedForm);
  } catch (error) {
    console.error('Error fetching form:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/forms/[id] - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica l'autenticazione
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
    
    console.log('🔐 PUT /api/forms/[id] - Auth check:', {
      hasSession: !!session,
      userId,
      userRole,
      fromHeader: !!request.headers.get('x-user-id'),
    });
    
    if (!userId) {
      console.error('❌ PUT /api/forms/[id] - No user ID found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Verifica che il form esista
    const existingForm = await prisma.form.findUnique({
      where: { id }
    });
    
    if (!existingForm) {
      console.error('❌ PUT /api/forms/[id] - Form not found:', id);
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }
    
    console.log('📋 PUT /api/forms/[id] - Form check:', {
      formId: existingForm.id,
      formOwnerId: existingForm.ownerId,
      currentUserId: userId,
      isOwner: existingForm.ownerId === userId,
      userRole
    });
    
    // Verifica che l'utente sia il proprietario del form O un admin
    if (existingForm.ownerId !== userId && userRole !== 'ADMIN') {
      console.error('❌ PUT /api/forms/[id] - Forbidden: User is not owner and not admin');
      return NextResponse.json(
        { error: 'Forbidden - You must be the owner of the form or an admin' },
        { status: 403 }
      );
    }
    
    // Parsing del body della richiesta
    const body = await request.json();
    
    console.log('📝 PUT /api/forms/[id] - Body received:', {
      title: body.title,
      maxRepeats: body.maxRepeats,
      maxRepeatsType: typeof body.maxRepeats,
      hasQuestions: !!body.questions,
      questionsCount: body.questions?.length || 0
    });
    
    const { 
      title, 
      description, 
      type, 
      isAnonymous, 
      allowEdit, 
      showResults, 
      thankYouMessage,
      questions,
      opensAt,
      closesAt,
      maxRepeats
    } = body;
    
    // Validazione dei dati
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Process maxRepeats value
    let processedMaxRepeats: number | null | undefined = undefined;
    if (maxRepeats !== undefined) {
      if (maxRepeats === null || maxRepeats === 0 || maxRepeats === '0' || maxRepeats === '') {
        processedMaxRepeats = null; // infinito
      } else {
        const numValue = typeof maxRepeats === 'string' ? parseInt(maxRepeats, 10) : maxRepeats;
        if (!isNaN(numValue) && numValue > 0) {
          processedMaxRepeats = numValue;
        } else {
          processedMaxRepeats = 1; // default se il valore non è valido
        }
      }
    }
    
    console.log('📝 PUT /api/forms/[id] - Processed maxRepeats:', processedMaxRepeats);
    
    // Aggiornamento del form nel database
    console.log('🎨 PUT /api/forms/[id] - Tema ricevuto:', body.theme);
    console.log('🖼️ Background image:', body.theme?.backgroundImage ? 'PRESENTE' : 'ASSENTE');
    if (body.theme?.backgroundImage) {
      console.log('📏 Background image length:', body.theme.backgroundImage.length);
    }

    // Build update data object
    const updateData: any = {
      title,
      description,
      type,
      isAnonymous,
      allowEdit,
      showResults,
      thankYouMessage,
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      theme: body.theme || undefined, // Aggiorna il tema se fornito
    };
    
    // Only include maxRepeats if it was provided
    if (maxRepeats !== undefined) {
      updateData.maxRepeats = processedMaxRepeats;
    }
    
    // Only update questions if provided
    if (questions && Array.isArray(questions)) {
      updateData.questions = {
        deleteMany: {},
        create: questions.map((q: any, index: number) => {
          // Debug: log delle opzioni prima del salvataggio
          console.log(`Domanda ${index}:`, {
            text: q.text,
            type: q.type,
            options: q.options,
            optionsStringified: q.options ? JSON.stringify(q.options) : null
          });
          
          return {
            text: q.text,
            type: q.type,
            required: q.required,
            options: q.options ? JSON.stringify(q.options) : null,
            order: index
          };
        })
      };
    }

    console.log('📝 PUT /api/forms/[id] - Update data prepared:', {
      ...updateData,
      questions: updateData.questions ? `${updateData.questions.create?.length || 0} questions` : 'not updating'
    });

    const updatedForm = await prisma.form.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    console.log('✅ PUT /api/forms/[id] - Form aggiornato con tema');
    
    // Parse options for questions if they are JSON strings (come nel GET)
    const questionsWithParsedOptions = updatedForm.questions.map((q: any) => {
      let parsedOptions = q.options;
      if (q.options && typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          console.error('Error parsing options JSON:', e);
          parsedOptions = null;
        }
      }
      return {
        ...q,
        options: parsedOptions
      };
    });
    
    const formWithParsedOptions = {
      ...updatedForm,
      questions: questionsWithParsedOptions
    };
    
    return NextResponse.json(formWithParsedOptions);
  } catch (error: any) {
    console.error('❌ Error updating form:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[id] - Delete a form
export async function DELETE(
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
    
    if (!userId || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = params.id;

    // Check if form exists
    const existingForm = await prisma.form.findUnique({
      where: { id: formId }
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Delete the form (cascade will delete questions and responses)
    await prisma.form.delete({
      where: { id: formId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Form eliminato con successo'
    });

  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Error deleting form' }, { status: 500 });
  }
} 