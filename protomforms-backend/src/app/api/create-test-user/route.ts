import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Crea un utente di test
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'test@protom.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' },
      { status: 500 }
    );
  }
}
