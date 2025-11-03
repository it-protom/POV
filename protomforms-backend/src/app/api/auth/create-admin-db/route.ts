import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Crea l'utente admin con credenziali fisse
    const email = 'admin@protom.com';
    const password = 'Password123!';
    
    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Admin user already exists', id: existingUser.id },
        { status: 200 }
      );
    }

    // Crea l'utente admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        name: 'Admin User'
      }
    });

    return NextResponse.json(
      { 
        message: 'Admin user created successfully',
        id: user.id,
        email: user.email,
        role: user.role
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 