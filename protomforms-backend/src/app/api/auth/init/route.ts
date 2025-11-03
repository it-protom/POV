import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const users = [];
    const adminPassword = 'Password123!';
    const userPassword = 'Password123!';

    // Verifica se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@protom.com' }
    });

    if (!existingAdmin) {
      // Crea l'utente admin
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@protom.com',
          name: 'Admin User',
          password: hashedAdminPassword,
          role: 'ADMIN'
        }
      });
      const { password: _, ...adminWithoutPassword } = admin;
      users.push({ 
        ...adminWithoutPassword, 
        type: 'admin',
        password: adminPassword,
        message: 'created successfully'
      });
    } else {
      const { password: _, ...adminWithoutPassword } = existingAdmin;
      users.push({ 
        ...adminWithoutPassword, 
        type: 'admin', 
        password: adminPassword,
        message: 'already exists' 
      });
    }

    // Verifica se l'utente normale esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email: 'user@protom.com' }
    });

    if (!existingUser) {
      // Crea l'utente normale
      const hashedUserPassword = await bcrypt.hash(userPassword, 10);
      const user = await prisma.user.create({
        data: {
          email: 'user@protom.com',
          name: 'Test User',
          password: hashedUserPassword,
          role: 'USER'
        }
      });
      const { password: _, ...userWithoutPassword } = user;
      users.push({ 
        ...userWithoutPassword, 
        type: 'user',
        password: userPassword,
        message: 'created successfully'
      });
    } else {
      const { password: _, ...userWithoutPassword } = existingUser;
      users.push({ 
        ...userWithoutPassword, 
        type: 'user',
        password: userPassword,
        message: 'already exists' 
      });
    }

    return NextResponse.json({
      message: 'Inizializzazione completata',
      credentials: {
        admin: {
          email: 'admin@protom.com',
          password: adminPassword,
          role: 'ADMIN'
        },
        user: {
          email: 'user@protom.com',
          password: userPassword,
          role: 'USER'
        }
      },
      users
    });
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error);
    return NextResponse.json(
      { 
        error: 'Errore durante l\'inizializzazione degli utenti',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 