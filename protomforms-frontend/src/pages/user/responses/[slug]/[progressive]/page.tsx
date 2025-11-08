import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Calendar, FileText } from 'lucide-react';
import { useParams } from "react-router-dom";
import { authenticatedFetch } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface Answer {
  id: string;
  questionId: string;
  value: string | number | string[] | Date | null | any;
  question: {
    text: string;
    type: string;
  };
}

interface Response {
  id: string;
  formId: string;
  createdAt: string;
  progressiveNumber: number;
  form: {
    title: string;
    isAnonymous: boolean;
    slug: string;
  };
  answers: Answer[];
}

export default function UserResponseDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponse();
  }, [params.slug, params.progressive]);

  const fetchResponse = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add userId header if user is authenticated but no NextAuth session
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const res = await authenticatedFetch(`/api/responses/${params.slug}/${params.progressive}`, {
        headers,
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('Non hai permesso di visualizzare questa risposta');
          setTimeout(() => navigate('/user/forms'), 2000);
          return;
        }
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      setResponse(data);
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

  const formatAnswerValue = (value: any, questionType: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Nessuna risposta fornita';
    }
    
    // Se è un array, mostra i valori separati da virgola
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Nessuna risposta fornita';
    }
    
    // Se è un oggetto, prova a estrarre valori utili
    if (typeof value === 'object') {
      const values = Object.values(value).filter(v => v !== null && v !== undefined && v !== '');
      return values.length > 0 ? values.join(', ') : 'Nessuna risposta fornita';
    }
    
    // Formatta numeri per scale (1-5, ecc.)
    if (questionType === 'SCALE' && typeof value === 'number') {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFCD00]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">{error || 'Risposta non trovata'}</div>
              <Link 
                to="/user/responses"
                className="text-[#FFCD00] hover:underline inline-flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Torna alle Mie Risposte
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            to="/user/responses"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Torna alle Mie Risposte
          </Link>
        </div>

        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                  {response.form.title}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#FFCD00]" />
                    <span>Risposta #{response.progressiveNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#FFCD00]" />
                    <span>{formatDate(response.createdAt)}</span>
                  </div>
                  {response.form.isAnonymous && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      Anonimo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="h-1.5 w-20 bg-[#FFCD00] rounded mt-4"></div>
          </CardHeader>
        </Card>

        {response.answers.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessuna risposta disponibile per questa risposta.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {response.answers.map((answer, index) => (
              <Card key={answer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-[#FFCD00]/10 text-[#FFCD00] border-[#FFCD00]">
                      Domanda {index + 1}
                    </Badge>
                    {answer.question.type && (
                      <Badge variant="secondary" className="text-xs">
                        {answer.question.type}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {answer.question.text || 'Domanda senza testo'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Risposta:</div>
                    <div className="text-base text-gray-900 font-medium whitespace-pre-wrap break-words">
                      {formatAnswerValue(answer.value, answer.question.type)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}







