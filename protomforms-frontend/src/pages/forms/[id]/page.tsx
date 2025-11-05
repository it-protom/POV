"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import FormUser from '@/pages/user/forms/[id]/FormUser';

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  questions: any[];
  theme?: any;
  thankYouMessage?: string;
  showResults?: boolean;
  slug?: string;
}

export default function PublicFormPage() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.id}/public`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Impossibile caricare il form");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600">Form non trovato</p>
        </div>
      </div>
    );
  }

  return <FormUser form={form} />;
}
