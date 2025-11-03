import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = params.id;

    // Verifica che il form esista e appartenga all'utente
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        ownerId: session.user.id
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
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