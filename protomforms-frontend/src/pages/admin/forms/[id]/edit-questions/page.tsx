import React from 'react';
"use client";

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Type, Save, Separator as SeparatorIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuestionBuilder } from '@/components/form-builder/QuestionBuilder';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { QuestionFormData, QuestionType } from "@/types/question";
import { v4 as uuidv4 } from 'uuid';
import { authenticatedFetch } from '@/lib/utils';

export default function EditQuestionsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formData, setFormData] = useState<any>(null);

  // Carica le domande esistenti del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${params.id}`);
        if (!response.ok) {
          throw new Error('Errore durante il caricamento del form');
        }
        const data = await response.json();
        
        setFormTitle(data.title || '');
        setFormData(data); // Salva tutti i dati del form
        
        // Converti le domande dal formato del backend al formato QuestionFormData
        if (data.questions && Array.isArray(data.questions)) {
          const convertedQuestions: QuestionFormData[] = data.questions.map((q: any) => ({
            id: q.id,
            type: q.type as QuestionType,
            text: q.text,
            required: q.required || false,
            options: q.options 
              ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
              : undefined,
            order: q.order || 0
          }));
          
          // Ordina per order
          convertedQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          setQuestions(convertedQuestions);
        }
      } catch (error) {
        console.error('Errore durante il caricamento del form:', error);
        toast.error('Impossibile caricare il form. Riprova.');
        navigate(`/admin/forms/${params.id}/edit`);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id, navigate]);

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: QuestionFormData = {
      id: uuidv4(),
      type,
      text: '',
      required: false,
      options: type === QuestionType.MULTIPLE_CHOICE ? [''] : undefined
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleUpdateForm = async () => {
    if (!params.id || !formData) return;

    setSaving(true);
    
    try {
      // Prepara le domande per il salvataggio
      const questionsToSave = questions.map((q, index) => ({
        text: q.text,
        type: q.type,
        required: q.required || false,
        options: q.options,
        order: index
      }));

      // Aggiorna il form con le nuove domande, mantenendo tutti gli altri dati esistenti
      const response = await authenticatedFetch(`/api/forms/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          isAnonymous: formData.isAnonymous || false,
          allowEdit: formData.allowEdit || false,
          showResults: formData.showResults || false,
          thankYouMessage: formData.thankYouMessage,
          theme: formData.theme,
          opensAt: formData.opensAt ? new Date(formData.opensAt).toISOString() : undefined,
          closesAt: formData.closesAt ? new Date(formData.closesAt).toISOString() : undefined,
          questions: questionsToSave
        }),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento del form");
      }

      toast.success("Form aggiornato con successo");
      navigate(`/admin/forms/${params.id}/edit`);
    } catch (error) {
      console.error("Errore nell'aggiornamento del form:", error);
      toast.error("Impossibile aggiornare il form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 lg:p-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${params.id}/edit`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifica Domande</h1>
            <p className="text-gray-500 mt-1">{formTitle}</p>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-[#FFCD00]" />
            Domande del Form
          </CardTitle>
          <CardDescription>
            Modifica, aggiungi o rimuovi le domande del form. Puoi trascinare le domande per riordinarle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna domanda ancora
                </h3>
                <p className="text-gray-500 mb-6">
                  Inizia aggiungendo la tua prima domanda
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => handleAddQuestion(QuestionType.TEXT)}
                    className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                  >
                    <Type className="mr-2 h-4 w-4" />
                    Aggiungi Prima Domanda
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <QuestionBuilder
                  questions={questions}
                  onQuestionsChange={setQuestions}
                  hideHeader={true}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between items-center"
      >
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/forms/${params.id}/edit`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Annulla
        </Button>
        
        <Button
          onClick={handleUpdateForm}
          disabled={saving}
          className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Aggiornando...' : 'Aggiorna Form'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

