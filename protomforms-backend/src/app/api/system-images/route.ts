import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const systemImagesDir = join(process.cwd(), 'public', 'images', 'system');
    const files = await readdir(systemImagesDir);

    const imageFiles = files.filter(file => {
      const ext = file.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif') || ext.endsWith('.webp');
    });

    const images = imageFiles.map(file => ({
      url: `/images/system/${file}`,
      name: file,
      path: join('images', 'system', file)
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading system images:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 