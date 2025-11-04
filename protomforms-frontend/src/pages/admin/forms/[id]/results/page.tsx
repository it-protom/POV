"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, User, MoreVertical, List, Eye } from "lucide-react";
import { authenticatedFetch } from '@/lib/utils';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

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
          <>
          <div className="bg-white rounded-lg shadow-sm border">
          {/* Title */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-semibold">Visualizza risultati</h1>
          </div>

          {/* Navigation Bar */}
          <div className="border-b p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Risposta precedente</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentIndex === responses.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* User Info */}
                <div className="text-center">
                  <div className="text-blue-600 font-medium text-sm">Intervistato</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-semibold">{currentIndex + 1}</span>
                    <span className="font-medium">
                      {form.isAnonymous 
                        ? `Anonimo #${currentResponse?.progressiveNumber}`
                        : (currentResponse?.user?.name || `Risposta #${currentResponse?.progressiveNumber}`)}
                    </span>
                  </div>
                </div>

                {/* Completion Time */}
                <div className="text-right">
                  <div className="text-5xl font-light text-gray-900">
                    {formatCompletionTime(completionTime)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Tempo per il<br />completamento
                  </div>
                </div>

                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="p-8 space-y-8">
            {form.questions
              .sort((a, b) => a.order - b.order)
              .map((question, index) => {
                const answer = currentResponse?.answers.find(
                  (a) => a.questionId === question.id
                );

                return (
                  <div key={question.id} className="space-y-4">
                    <div className="flex gap-2">
                      <span className="text-gray-500 font-medium">{index + 1}.</span>
                      <div className="flex-1">
                        <h3 className="text-base font-medium mb-1">
                          {question.text}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>

                        {/* Display answer based on question type */}
                        <div className="mt-4">
                          {question.type === "TEXT" && (
                            <div className="text-gray-700">
                              {answer?.value || <span className="text-gray-400 italic">Nessuna risposta</span>}
                            </div>
                          )}

                          {question.type === "TEXTAREA" && (
                            <div className="text-gray-700 whitespace-pre-wrap">
                              {answer?.value || <span className="text-gray-400 italic">Nessuna risposta</span>}
                            </div>
                          )}

                          {question.type === "MULTIPLE_CHOICE" && (
                            <RadioGroup value={answer?.value} disabled>
                              <div className="space-y-3">
                                {question.options?.map((option) => (
                                  <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value={option}
                                      id={`${question.id}-${option}`}
                                      checked={answer?.value === option}
                                      className="pointer-events-none"
                                    />
                                    <Label
                                      htmlFor={`${question.id}-${option}`}
                                      className={answer?.value === option ? "font-medium" : ""}
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </RadioGroup>
                          )}

                          {question.type === "CHECKBOX" && (
                            <div className="space-y-3">
                              {question.options?.map((option) => {
                                const isChecked = Array.isArray(answer?.value) && answer.value.includes(option);
                                return (
                                  <div key={option} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${question.id}-${option}`}
                                      checked={isChecked}
                                      disabled
                                    />
                                    <Label
                                      htmlFor={`${question.id}-${option}`}
                                      className={isChecked ? "font-medium" : ""}
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {question.type === "RATING" && (
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  disabled
                                  className={`text-2xl ${
                                    answer?.value >= star
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                              {answer?.value && (
                                <span className="ml-2 text-sm text-gray-600">
                                  {answer.value}/5
                                </span>
                              )}
                            </div>
                          )}

                          {question.type === "DATE" && (
                            <div className="text-gray-700">
                              {answer?.value ? new Date(answer.value).toLocaleDateString('it-IT') : (
                                <span className="text-gray-400 italic">Nessuna risposta</span>
                              )}
                            </div>
                          )}

                          {question.type === "TIME" && (
                            <div className="text-gray-700">
                              {answer?.value || <span className="text-gray-400 italic">Nessuna risposta</span>}
                            </div>
                          )}

                          {question.type === "NUMBER" && (
                            <div className="text-gray-700">
                              {answer?.value !== undefined ? answer.value : (
                                <span className="text-gray-400 italic">Nessuna risposta</span>
                              )}
                            </div>
                          )}

                          {question.type === "EMAIL" && (
                            <div className="text-gray-700">
                              {answer?.value || <span className="text-gray-400 italic">Nessuna risposta</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Risposta {currentIndex + 1} di {responses.length}
            </p>
            <Progress value={((currentIndex + 1) / responses.length) * 100} className="mt-2 max-w-md mx-auto" />
          </div>
          </>
        )}
      </div>
    </div>
  );
}
