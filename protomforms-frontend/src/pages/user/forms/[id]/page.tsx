import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '@/lib/utils';
import FormClient from './FormClient';
import { toast } from 'sonner';

interface Form {
  id: string;
  title: string;
  description: string;
  questions: any[];
  theme?: any;
  thankYouMessage?: string;
  showResults?: boolean;
  slug?: string;
  isAnonymous?: boolean;
  allowEdit?: boolean;
}

export default function UserFormDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        
        // Carica il form tramite API pubblica (che funziona anche per utenti autenticati)
        const response = await authenticatedFetch(`/api/forms/${params.id}/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Form non trovato');
        }
        
        const data = await response.json();
        setForm(data);
        
        // Verifica se l'utente ha già risposto
        const userResponseCheck = await authenticatedFetch(`/api/forms/${params.id}/user-response`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (userResponseCheck.ok) {
          const userData = await userResponseCheck.json();
          if (userData.hasSubmitted && !data.allowEdit) {
            setHasSubmitted(true);
          }
        }
      } catch (error: any) {
        console.error('Errore nel recupero del form:', error);
        toast.error(error.message || 'Impossibile caricare il form');
        navigate('/user/forms');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Form non trovato</h1>
            <p className="text-gray-500">Il form che stai cercando non esiste o non è più disponibile.</p>
            <button 
              onClick={() => navigate('/user/forms')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hai già risposto a questo form</h2>
          <p className="text-gray-600 mb-4">Puoi consultare le tue risposte nella sezione <b>Le mie Risposte</b>.</p>
          <button 
            onClick={() => navigate('/user/forms')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna alla Dashboard
          </button>
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
