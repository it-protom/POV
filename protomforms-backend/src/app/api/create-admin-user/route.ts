import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Crea l'utente admin Giuseppe Mursia
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'giuseppe.mursia@protom.com',
        name: 'Giuseppe Mursia',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}
