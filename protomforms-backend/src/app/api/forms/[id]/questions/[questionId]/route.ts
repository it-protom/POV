import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/forms/[id]/questions/[questionId] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    // Verifica che l'utente sia un admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    const { id, questionId } = params;
    
    // Verifica che il form esista
    const existingForm = await prisma.form.findUnique({
      where: { id }
    });
    
    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }
    
    // Verifica che l'utente sia il proprietario del form
    if (existingForm.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    // Verifica che la domanda esista
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Domanda non trovata' },
        { status: 404 }
      );
    }
    
    // Verifica che la domanda appartenga al form
    if (existingQuestion.formId !== id) {
      return NextResponse.json(
        { error: 'La domanda non appartiene a questo form' },
        { status: 400 }
      );
    }
    
    // Elimina la domanda
    await prisma.question.delete({
      where: { id: questionId }
    });
    
    // Recupera il form aggiornato con tutte le domande
    const updatedForm = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Errore nell\'eliminazione della domanda:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id]/questions/[questionId] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    // Verifica che l'utente sia un admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    const { id, questionId } = params;
    
    // Verifica che il form esista
    const existingForm = await prisma.form.findUnique({
      where: { id }
    });
    
    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form non trovato' },
        { status: 404 }
      );
    }
    
    // Verifica che l'utente sia il proprietario del form
    if (existingForm.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }
    
    // Verifica che la domanda esista
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Domanda non trovata' },
        { status: 404 }
      );
    }
    
    // Verifica che la domanda appartenga al form
    if (existingQuestion.formId !== id) {
      return NextResponse.json(
        { error: 'La domanda non appartiene a questo form' },
        { status: 400 }
      );
    }
    
    // Parsing del body della richiesta
    const body = await request.json();
    
    const { 
      text, 
      type, 
      required, 
      options 
    } = body;
    
    // Validazione dei dati
    if (!text) {
      return NextResponse.json(
        { error: 'Il testo della domanda è obbligatorio' },
        { status: 400 }
      );
    }
    
    // Aggiorna la domanda
    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        type,
        required: required || false,
        options: options ? JSON.stringify(options) : undefined
      }
    });
    
    // Recupera il form aggiornato con tutte le domande
    const updatedForm = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della domanda:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 