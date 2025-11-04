import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/forms/[id]/user-response - Check if user has already submitted this form
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Fallback: controlla anche l'header x-user-id se la sessione non esiste
    const userIdHeader = req.headers.get('x-user-id');
    const userId = session?.user?.id || userIdHeader;
    
    console.log('🔍 Checking if user has submitted form:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      headerUserId: userIdHeader,
      finalUserId: userId,
      formId: params.id
    });
    
    // Se non c'è autenticazione, ritorna che non ha compilato
    if (!userId) {
      return NextResponse.json({ 
        hasSubmitted: false 
      });
    }
    
    // Verifica che il form esista
    const form = await prisma.form.findUnique({
      where: { id: params.id }
    });
    
    if (!form) {
      return NextResponse.json({ error: 'Form non trovato' }, { status: 404 });
    }
    
    // Per form anonimi, non tracciamo le submission per utente
    if (form.isAnonymous) {
      return NextResponse.json({ 
        hasSubmitted: false 
      });
    }
    
    // Cerca una risposta esistente per questo utente e form
    const existingResponse = await prisma.response.findFirst({
      where: {
        formId: params.id,
        userId: userId,
      },
      select: {
        id: true,
        progressiveNumber: true,
        createdAt: true,
      }
    });
    
    if (existingResponse) {
      console.log('✅ User has already submitted this form:', {
        userId,
        formId: params.id,
        responseId: existingResponse.id,
        progressiveNumber: existingResponse.progressiveNumber
      });
      
      return NextResponse.json({
        hasSubmitted: true,
        responseId: existingResponse.id,
        progressiveNumber: existingResponse.progressiveNumber,
        submittedAt: existingResponse.createdAt.toISOString()
      });
    }
    
    return NextResponse.json({ 
      hasSubmitted: false 
    });
    
  } catch (error) {
    console.error('Error checking user response:', error);
    return NextResponse.json(
      { error: 'Errore nel controllo dello stato di invio' },
      { status: 500 }
    );
  }
}



