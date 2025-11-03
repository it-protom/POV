import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica il ruolo admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const files = await readdir(uploadsDir);
    
    // Filtra solo i file immagine
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    // Crea un array di oggetti con le informazioni delle immagini
    const images = imageFiles.map(file => ({
      url: `/uploads/${file}`,
      name: file,
      path: join(uploadsDir, file)
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Errore durante il recupero delle immagini:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero delle immagini' },
      { status: 500 }
    );
  }
} 