import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { authenticatedFetch } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Answer {
  id: string;
  questionId: string;
  value: string | number | string[] | Date | null | any;
  question: {
    id: string;
    text: string;
    type: string;
    order?: number;
  };
}

interface Response {
  id: string;
  formId: string;
  createdAt: string;
  submittedAt?: string;
  progressiveNumber: number;
  completionTime?: number;
  form: {
    title: string;
    isAnonymous: boolean;
    slug: string;
  };
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  answers: Answer[];
}

export default function ResponseDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState<Response | null>(null);
  const [allResponses, setAllResponses] = useState<Response[]>([]);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.slug, params.progressive]);

  const currentIndex = useMemo(() => {
    if (!response || allResponses.length === 0) return -1;
    return allResponses.findIndex(r => r.progressiveNumber === response.progressiveNumber);
  }, [response, allResponses]);

  const goToPrevious = () => {
    if (currentIndex > 0 && allResponses[currentIndex - 1]) {
      navigate(`/admin/responses/${params.slug}/${allResponses[currentIndex - 1].progressiveNumber}`);
    }
  };

  const goToNext = () => {
    if (currentIndex < allResponses.length - 1 && allResponses[currentIndex + 1]) {
      navigate(`/admin/responses/${params.slug}/${allResponses[currentIndex + 1].progressiveNumber}`);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Trova il form tramite slug
      const formRes = await authenticatedFetch(`/api/forms/by-slug/${params.slug}`);
      if (!formRes.ok) throw new Error('Form non trovato');
      const formData = await formRes.json();
      setForm(formData);
      
      // 2. Carica tutte le risposte per navigazione
      const responsesRes = await authenticatedFetch(`/api/forms/${formData.id}/responses`);
      if (!responsesRes.ok) throw new Error('Errore nel recupero risposte');
      const responsesData = await responsesRes.json();
      // Ordina per progressiveNumber per navigazione corretta
      const sortedResponses = responsesData.sort((a: Response, b: Response) => 
        a.progressiveNumber - b.progressiveNumber
      );
      setAllResponses(sortedResponses);
      
      // 3. Trova la risposta corrente
      const currentResponse = sortedResponses.find(
        (r: Response) => r.progressiveNumber === parseInt(params.progressive || '0')
      );
      
      if (!currentResponse) {
        // Se non trovata nella lista, prova a caricarla direttamente
      const res = await authenticatedFetch(`/api/responses/${params.slug}/${params.progressive}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
        if (!res.ok) throw new Error('Risposta non trovata');
      const data = await res.json();
      setResponse(data);
      } else {
        setResponse(currentResponse);
      }
      
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento della risposta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatta il tempo di completamento
  const formatCompletionTime = (seconds?: number) => {
    if (!seconds) {
      // Calcola dalla differenza tra createdAt e submittedAt
      if (response?.createdAt && response?.submittedAt) {
        const created = new Date(response.createdAt);
        const submitted = new Date(response.submittedAt);
        const diffInSeconds = Math.floor((submitted.getTime() - created.getTime()) / 1000);
        seconds = Math.max(diffInSeconds, 13);
      } else {
        return "00.00";
      }
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}.${secs.toString().padStart(2, '0')}`;
  };

  const completionTime = response?.completionTime || (response?.createdAt && response?.submittedAt 
    ? Math.floor((new Date(response.submittedAt).getTime() - new Date(response.createdAt).getTime()) / 1000)
    : 13);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-protom-yellow"></div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-red-600">{error || 'Response not found'}</div>
      </div>
    );
  }

  const formatAnswerValue = (value: any, questionType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Nessuna risposta';
    }
    
    // Se è un array, mostra i valori separati da virgola
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Nessuna risposta';
    }
    
    // Se è un oggetto, prova a estrarre valori utili
    if (typeof value === 'object') {
      const values = Object.values(value).filter(v => v !== null && v !== undefined && v !== '');
      return values.length > 0 ? values.join(', ') : 'Nessuna risposta';
    }
    
    // Formatta numeri per scale (1-5, ecc.) o LIKERT
    if ((questionType === 'SCALE' || questionType === 'RATING' || questionType === 'LIKERT') && typeof value === 'number') {
      return value.toString();
    }
    
    // Per date
    if (questionType === 'DATE' && (typeof value === 'string' || value instanceof Date)) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return String(value);
      }
    }
    
    return String(value);
  };

  // Formatta il tipo di domanda
  const getQuestionTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'MULTIPLE_CHOICE': 'MULTIPLE_CHOICE',
      'CHECKBOX': 'CHECKBOX',
      'RATING': 'LIKERT',
      'LIKERT': 'LIKERT',
      'SCALE': 'LIKERT',
      'TEXT': 'TEXT',
      'TEXTAREA': 'TEXTAREA',
      'DATE': 'DATE',
      'TIME': 'TIME',
      'NUMBER': 'NUMBER',
      'EMAIL': 'EMAIL'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con navigazione */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/responses')}
            className="text-gray-600"
          >
            ← Torna alle Risposte
          </Button>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex <= 0}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex >= allResponses.length - 1}
            >
              →
            </Button>
          </div>
        </div>

        {/* Titolo Form e Risposta */}
        {response && (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{response.form.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Risposta #{response.progressiveNumber}</span>
                <span>•</span>
                <span>{formatDate(response.createdAt)}</span>
              </div>
            </div>

            {/* Card Intervistato */}
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Intervistato</div>
                  <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{response.progressiveNumber}</span>
                      <span className="text-base font-medium">
                        {response.form.isAnonymous 
                          ? 'Anonimo'
                          : (response.user?.name || `Risposta #${response.progressiveNumber}`)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-medium">{formatCompletionTime(completionTime)}</div>
                    <div className="text-xs text-gray-500">Tempo per il completamento</div>
                  </div>
                </div>
              </CardContent>
        </Card>

            {/* Domande e Risposte */}
        {response.answers.length === 0 ? (
              <Card className="border">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Nessuna risposta disponibile per questa risposta.</p>
            </CardContent>
          </Card>
        ) : (
              <div className="space-y-6">
                {response.answers
                  .sort((a, b) => (a.question.order || 0) - (b.question.order || 0))
                  .map((answer, index) => (
                    <Card key={answer.id} className="border">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Domanda {index + 1}</span>
                            <span className="text-sm text-gray-500">{getQuestionTypeLabel(answer.question.type)}</span>
                          </div>
                          <div className="text-base font-medium text-gray-900">
                            {answer.question.text}
                  </div>
                          <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-1">Risposta:</div>
                            <div className="text-base text-gray-900 font-medium">
                      {formatAnswerValue(answer.value, answer.question.type)}
                            </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}

            {/* Indicatore progresso */}
            {allResponses.length > 0 && (
              <div className="text-center text-sm text-gray-500">
                Risposta {currentIndex + 1} di {allResponses.length}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 