import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Crea l'utente admin con credenziali fisse e ID fisso
    const email = 'admin@protom.com';
    const password = 'Password123!';
    const fixedId = 'admin-user-id';
    
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

    // Crea l'utente admin con ID fisso
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Usa una query SQL diretta per creare l'utente con ID fisso
    await prisma.$executeRaw`
      INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
      VALUES (${fixedId}, ${email}, ${hashedPassword}, 'ADMIN', 'Admin User', NOW(), NOW())
    `;

    return NextResponse.json(
      { 
        message: 'Admin user created successfully with fixed ID',
        id: fixedId,
        email: email,
        role: 'ADMIN'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating admin user with fixed ID:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 