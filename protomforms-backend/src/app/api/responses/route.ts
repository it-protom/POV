import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const responses = await prisma.response.findMany({
      include: {
        form: {
          select: {
            title: true,
            description: true,
            isAnonymous: true,
            slug: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 