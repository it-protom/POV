"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, List, Eye } from "lucide-react";
import { authenticatedFetch } from '@/lib/utils';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  questions: Question[];
}

interface Response {
  id: string;
  formId: string;
  submittedAt: string;
  createdAt: string;
  progressiveNumber: number;
  completionTime?: number; // in seconds
  answers: {
    id: string;
    questionId: string;
    value: any;
  }[];
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export default function FormResultsPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list"); // list o detail

  // Carica i dati del form e le risposte
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formResponse, responsesResponse] = await Promise.all([
          authenticatedFetch(`/api/forms/${params.id}`),
          authenticatedFetch(`/api/forms/${params.id}/responses`)
        ]);

        if (!formResponse.ok || !responsesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [formData, responsesData] = await Promise.all([
          formResponse.json(),
          responsesResponse.json()
        ]);

        setForm(formData);
        setResponses(responsesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Errore nel caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Risposta corrente
  const currentResponse = useMemo(() => {
    return responses[currentIndex] || null;
  }, [responses, currentIndex]);

  // Navigazione
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < responses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Visualizza dettaglio risposta
  const viewResponseDetail = (index: number) => {
    setCurrentIndex(index);
    setViewMode("detail");
  };

  // Formatta il tempo di completamento
  const formatCompletionTime = (seconds?: number) => {
    if (!seconds) return "00.00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}.${secs.toString().padStart(2, '0')}`;
  };

  // Formatta il valore della risposta
  const formatAnswerValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Sì' : 'No';
    }
    return String(value);
  };

  // Calcola il tempo di completamento stimato (differenza tra createdAt e submittedAt)
  const calculateCompletionTime = (response: Response) => {
    if (response.completionTime) {
      return response.completionTime;
    }
    // Stima basata sulla differenza tra createdAt e submittedAt
    const created = new Date(response.createdAt);
    const submitted = new Date(response.submittedAt || response.createdAt);
    const diffInSeconds = Math.floor((submitted.getTime() - created.getTime()) / 1000);
    return Math.max(diffInSeconds, 13); // Minimo 13 secondi per esempio
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-lg">Caricamento risultati...</p>
        </div>
      </div>
    );
  }

  if (!form || responses.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        <div className="mt-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <p className="text-lg text-gray-500">
                {!form ? "Form non trovato" : "Nessuna risposta disponibile"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completionTime = currentResponse ? calculateCompletionTime(currentResponse) : 0;

  // Formatta la data in italiano
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Visualizza Tutti
              </Button>
              {viewMode === "detail" && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Vista Dettaglio
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Vista Lista */}
        {viewMode === "list" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualizza risultati</CardTitle>
                <CardDescription>
                  {responses.length} rispost{responses.length === 1 ? 'a' : 'e'} totali per {form?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response, index) => {
                    const completionTime = calculateCompletionTime(response);
                    const answersCount = response.answers?.length || 0;
                    const isComplete = answersCount >= form!.questions.length;
                    
                    // Trova le prime 3 risposte per l'anteprima
                    const previewAnswers = response.answers.slice(0, 3);
                    const remainingAnswers = answersCount - previewAnswers.length;

                    return (
                      <Card
                        key={response.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="font-semibold text-lg">
                                  {form?.isAnonymous 
                                    ? `Anonimo`
                                    : (response.user?.name || `Risposta #${response.progressiveNumber}`)}
                                </div>
                                <Badge variant={isComplete ? "default" : "secondary"}>
                                  Punteggio: {answersCount}/{form?.questions.length}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(response.createdAt)}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewResponseDetail(index)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Dettagli
                            </Button>
                          </div>

                          {/* Anteprima Risposte */}
                          <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Anteprima:</div>
                            {previewAnswers.length > 0 ? (
                              <div className="space-y-3">
                                {previewAnswers.map((answer) => {
                                  const question = form?.questions.find(q => q.id === answer.questionId);
                                  if (!question) return null;
                                  
                                  // Formatta la risposta in base al tipo di domanda
                                  let answerDisplay = '';
                                  if (question.type === "MULTIPLE_CHOICE" || question.type === "CHECKBOX") {
                                    if (Array.isArray(answer.value)) {
                                      answerDisplay = answer.value.join(', ');
                                    } else {
                                      answerDisplay = String(answer.value);
                                    }
                                  } else if (question.type === "RATING") {
                                    answerDisplay = `${answer.value}/5`;
                                  } else if (question.type === "DATE") {
                                    answerDisplay = answer.value ? new Date(answer.value).toLocaleDateString('it-IT') : 'N/A';
                                  } else {
                                    answerDisplay = formatAnswerValue(answer.value);
                                  }
                                  
                                  return (
                                    <div key={answer.id} className="bg-gray-50 rounded-md p-3 border-l-2 border-blue-400">
                                      <div className="text-xs font-medium text-gray-700 mb-1">
                                        {question.text}
                                      </div>
                                      <div className="text-sm text-gray-800 font-medium">
                                        {answerDisplay || <span className="text-gray-400 italic">Nessuna risposta</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                                {remainingAnswers > 0 && (
                                  <div className="text-sm text-blue-600 font-medium pt-2">
                                    +{remainingAnswers} altra{remainingAnswers === 1 ? '' : 'e'} risposta{remainingAnswers === 1 ? '' : 'e'}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic">
                                Nessuna risposta disponibile
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vista Dettaglio */}
        {viewMode === "detail" && (
          <div className="space-y-6">
            {/* Header con navigazione */}
            <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                onClick={() => navigate(-1)}
                className="text-gray-600"
              >
                ← Torna alle Risposte
              </Button>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                  >
                  ←
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                    onClick={goToNext}
                    disabled={currentIndex === responses.length - 1}
                  >
                  →
                  </Button>
                </div>
              </div>

            {/* Titolo Form e Risposta */}
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{form.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Risposta #{currentResponse?.progressiveNumber}</span>
                <span>•</span>
                <span>{formatDate(currentResponse?.createdAt || '')}</span>
              </div>
            </div>

            {/* Card Intervistato */}
            <Card className="border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Intervistato</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{currentResponse?.progressiveNumber}</span>
                      <span className="text-base font-medium">
                      {form.isAnonymous 
                          ? 'Anonimo'
                        : (currentResponse?.user?.name || `Risposta #${currentResponse?.progressiveNumber}`)}
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
            <div className="space-y-6">
            {form.questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => {
                const answer = currentResponse?.answers.find(
                  (a) => a.questionId === question.id
                );

                  // Formatta il tipo di domanda
                  const questionTypeLabel = question.type === "MULTIPLE_CHOICE" ? "MULTIPLE_CHOICE" :
                                           question.type === "CHECKBOX" ? "CHECKBOX" :
                                           question.type === "RATING" ? "LIKERT" :
                                           question.type === "TEXT" ? "TEXT" :
                                           question.type === "TEXTAREA" ? "TEXTAREA" :
                                           question.type === "DATE" ? "DATE" :
                                           question.type === "TIME" ? "TIME" :
                                           question.type === "NUMBER" ? "NUMBER" :
                                           question.type === "EMAIL" ? "EMAIL" :
                                           question.type;

                  // Formatta la risposta
                  let answerDisplay = '';
                  if (question.type === "MULTIPLE_CHOICE") {
                    answerDisplay = answer?.value || 'Nessuna risposta';
                  } else if (question.type === "CHECKBOX") {
                    if (Array.isArray(answer?.value)) {
                      answerDisplay = answer.value.join(', ');
                    } else {
                      answerDisplay = answer?.value ? String(answer.value) : 'Nessuna risposta';
                    }
                  } else if (question.type === "RATING" || question.type === "LIKERT") {
                    answerDisplay = answer?.value ? String(answer.value) : 'Nessuna risposta';
                  } else if (question.type === "DATE") {
                    answerDisplay = answer?.value ? new Date(answer.value).toLocaleDateString('it-IT') : 'Nessuna risposta';
                  } else {
                    answerDisplay = answer?.value ? String(answer.value) : 'Nessuna risposta';
                  }

                return (
                    <Card key={question.id} className="border">
                      <CardContent className="p-6">
                              <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Domanda {index + 1}</span>
                            <span className="text-sm text-gray-500">{questionTypeLabel}</span>
                                  </div>
                          <div className="text-base font-medium text-gray-900">
                            {question.text}
                              </div>
                          <div className="pt-2 border-t">
                            <div className="text-sm text-gray-600 mb-1">Risposta:</div>
                            <div className="text-base text-gray-900 font-medium">
                              {answerDisplay}
                            </div>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                );
              })}
          </div>

            {/* Indicatore progresso */}
            <div className="text-center text-sm text-gray-500">
              Risposta {currentIndex + 1} di {responses.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
