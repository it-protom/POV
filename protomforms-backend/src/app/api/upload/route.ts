import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Verifica il tipo di file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 });
    }

    // Verifica la dimensione del file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'immagine deve essere più piccola di 5MB' }, { status: 400 });
    }

    // Genera un nome file univoco
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uniqueId}.${fileExtension}`;
    const path = join(process.cwd(), 'public', 'uploads', fileName);

    // Salva il file
    await writeFile(path, buffer);

    // Restituisci l'URL dell'immagine
    const imageUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Errore durante il caricamento dell\'immagine:', error);
    return NextResponse.json(
      { error: 'Errore durante il caricamento dell\'immagine' },
      { status: 500 }
    );
  }
} 