import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/login - Custom login endpoint for credentials
// This endpoint validates credentials and creates a NextAuth session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono richieste' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log('🔍 Login attempt:', {
      email,
      userExists: !!user,
      hasPassword: !!user?.password,
      userRole: user?.role
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    if (!user.password) {
      console.log('❌ User has no password (possibly Azure AD only):', email);
      return NextResponse.json(
        { error: 'Account creato solo tramite Azure AD. Usa "Accedi con Microsoft" per effettuare il login.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log('🔐 Password verification:', {
      isValid: isPasswordValid,
      email
    });

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Return user data without password
    // Note: NextAuth session will be created by the frontend calling NextAuth signIn
    // The frontend should call: signIn('credentials', { email, password, redirect: false })
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      // Indicate that frontend should call NextAuth signIn
      requiresNextAuthSignIn: true,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}

