import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'giuseppe.mursia@protom.com' },
    });

    return NextResponse.json({
      message: 'User check completed',
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exists: true,
      } : {
        exists: false,
        message: 'User not found'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User check error:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
