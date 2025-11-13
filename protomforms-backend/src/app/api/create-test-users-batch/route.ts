import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const testUsers = [
      {
        email: 'lulu@test.com',
        password: 'lulu123!',
        name: 'Lulu'
      },
      {
        email: 'robi@test.com',
        password: 'robi123!',
        name: 'Robi'
      },
      {
        email: 'peppi@test.com',
        password: 'peppi123!',
        name: 'Peppi'
      }
    ];

    const results = [];

    for (const userData of testUsers) {
      try {
        // Verifica se l'utente esiste già
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          // Aggiorna la password e il nome
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          await prisma.user.update({
            where: { email: userData.email },
            data: {
              password: hashedPassword,
              name: userData.name,
              role: 'USER'
            }
          });
          results.push({
            email: userData.email,
            status: 'updated',
            message: 'Utente aggiornato con successo'
          });
        } else {
          // Crea nuovo utente
          const hashedPassword = await bcrypt.hash(userData.password, 10);
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              role: 'USER'
            }
          });
          results.push({
            email: user.email,
            status: 'created',
            message: 'Utente creato con successo'
          });
        }
      } catch (error: any) {
        results.push({
          email: userData.email,
          status: 'error',
          message: error.message || 'Errore sconosciuto'
        });
      }
    }

    return NextResponse.json({
      message: 'Operazione completata',
      results
    });
  } catch (error: any) {
    console.error('Errore durante la creazione degli utenti:', error);
    return NextResponse.json(
      { error: 'Errore durante la creazione degli utenti', details: error.message },
      { status: 500 }
    );
  }
}

