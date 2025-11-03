import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/reset-user-password - Reset password for test user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email è richiesta' },
        { status: 400 }
      );
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Hash della nuova password (o usa quella fornita o Password123!)
    const newPassword = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password resettata con successo',
      credentials: {
        email: user.email,
        password: newPassword,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Errore durante il reset della password' },
      { status: 500 }
    );
  }
}


