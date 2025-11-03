import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/forms/[id]/questions - Add a new question to a form
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const { id } = params;
    
    // Verifica che il form esista
    const existingForm = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'desc'
          },
          take: 1
        }
      }
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
    
    // Calcola l'ordine della nuova domanda
    const maxOrder = existingForm.questions.length > 0 
      ? existingForm.questions[0].order 
      : -1;
    
    // Crea la nuova domanda
    const newQuestion = await prisma.question.create({
      data: {
        formId: id,
        text,
        type,
        required: required || false,
        options: options ? JSON.stringify(options) : undefined,
        order: maxOrder + 1
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
    console.error('Errore nell\'aggiunta della domanda:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 