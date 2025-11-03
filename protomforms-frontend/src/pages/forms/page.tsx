import React from 'react';
"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  createdAt: string;
  _count?: {
    responses: number;
  };
}

export default function FormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms/public');
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei form');
      }
      
      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error('Errore nel recupero dei form:', error);
      toast.error('Impossibile caricare i form');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Form Disponibili</h1>
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Caricamento in corso...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">Non ci sono form disponibili al momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{form.title}</CardTitle>
                <CardDescription>{form.description || 'Nessuna descrizione'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Creato: {formatDate(form.createdAt)}</span>
                  <span>Tipo: {form.type === 'SURVEY' ? 'Sondaggio' : 'Quiz'}</span>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/forms/${form.id}`)}
                >
                  Compila Form
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 