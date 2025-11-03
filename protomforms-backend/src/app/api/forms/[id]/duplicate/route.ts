import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/forms/[id]/duplicate - Duplicate a form
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = params.id;

    // Get the original form with all its questions
    const originalForm = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!originalForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Create a new form with copied data
    const duplicatedForm = await prisma.form.create({
      data: {
        title: `${originalForm.title} (Copia)`,
        description: originalForm.description,
        type: originalForm.type,
        isAnonymous: originalForm.isAnonymous,
        allowEdit: originalForm.allowEdit,
        showResults: originalForm.showResults,
        thankYouMessage: originalForm.thankYouMessage,
        theme: originalForm.theme || undefined,
        ownerId: session.user.id
      }
    });

    // Duplicate all questions
    for (const question of originalForm.questions) {
      await prisma.question.create({
        data: {
          text: question.text,
          type: question.type,
          required: question.required,
          order: question.order,
          options: question.options || undefined,
          formId: duplicatedForm.id
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      form: duplicatedForm,
      message: 'Form duplicato con successo'
    });

  } catch (error) {
    console.error('Error duplicating form:', error);
    return NextResponse.json({ error: 'Error duplicating form' }, { status: 500 });
  }
} 