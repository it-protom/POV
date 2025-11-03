import React from 'react';
import { prisma } from "@/lib/db";
import { useAuth } from '../../../contexts/AuthContext';
import { authOptions } from "@/lib/auth";
import FormClient from './FormClient';

export default async function UserFormDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return <div className="container mx-auto py-8">Devi essere autenticato.</div>;
  }

  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      },
    },
  });

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Form non trovato</h1>
        <p className="text-gray-500">Il form che stai cercando non esiste o non è più disponibile.</p>
      </div>
    );
  }

  // Controlla se l'utente ha già risposto
  const existingResponse = await prisma.response.findFirst({
    where: {
      formId: params.id,
      userId: session.user.id,
    },
  });

  if (existingResponse) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-[#868789] mb-2">Hai già risposto a questo form</h2>
          <p className="text-gray-600 mb-4">Puoi consultare le tue risposte nella sezione <b>Le mie Risposte</b>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <FormClient form={form} />
      </div>
    </div>
  );
} 