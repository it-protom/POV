import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@protom.com' }
    });
    
    // Check if example form already exists
    const existingForm = await prisma.form.findFirst({
      where: { title: 'Form di esempio' }
    });
    
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@protom.com',
          name: 'Admin User',
          role: 'ADMIN',
          password: hashedPassword
        }
      });
      
      if (!existingForm) {
        // Create example form
        const form = await prisma.form.create({
          data: {
            title: 'Form di esempio',
            description: 'Questo è un form di esempio creato automaticamente',
            type: 'SURVEY',
            ownerId: adminUser.id,
            questions: {
              create: [
                {
                  text: 'Come ti chiami?',
                  type: 'TEXT',
                  required: true,
                  order: 0
                },
                {
                  text: 'Quanti anni hai?',
                  type: 'TEXT',
                  required: true,
                  order: 1
                }
              ]
            }
          }
        });
        
        return NextResponse.json(
          { 
            message: 'Admin user and example form created successfully',
            adminId: adminUser.id,
            formId: form.id
          },
          { status: 201 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        message: 'Admin user already exists',
        adminId: adminUser?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting up admin and form:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 