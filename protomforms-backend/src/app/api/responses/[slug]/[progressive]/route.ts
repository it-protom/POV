import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { slug: string; progressive: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Trova il form tramite slug
    const form = await prisma.form.findFirst({
      where: {
        slug: params.slug,
      },
      select: {
        id: true,
        title: true,
        isAnonymous: true
      }
    });

    if (!form) {
      return new NextResponse('Form not found', { status: 404 });
    }

    // Trova la risposta tramite formId e numero progressivo
    const response = await prisma.response.findFirst({
      where: {
        formId: form.id,
        progressiveNumber: parseInt(params.progressive),
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            isAnonymous: true
          }
        },
        user: false, // Non includiamo mai informazioni utente per sicurezza
        answers: {
          include: {
            question: {
              select: {
                text: true,
                type: true
              }
            }
          }
        }
      },
    });

    if (!response) {
      return new NextResponse('Response not found', { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 