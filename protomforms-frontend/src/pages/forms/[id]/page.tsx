import React from 'react';
"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon, Upload, Star, ThumbsUp, ThumbsDown, GripVertical, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'CHECKBOX' | 'DATE' | 'RANKING' | 'LIKERT' | 'FILE_UPLOAD' | 'NPS' | 'BRANCHING';
  required: boolean;
  options?: any; // Can be string[], or object with choices, scale, labels, etc.
  conditions?: {
    questionId: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number;
  }[];
  nextQuestionId?: string;
}

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  questions: Question[];
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: number;
    buttonStyle: 'filled' | 'outlined';
    headerImage?: string;
    logo?: string;
    backgroundImage?: string;
    backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundOpacity?: number;
    headerImageHeight?: number;
    logoSize?: number;
  };
}

export default function FormPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedResponse, setSubmittedResponse] = useState<{ responseId: string; progressiveNumber: number } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [rankingAnswers, setRankingAnswers] = useState<Record<string, string[]>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);

  useEffect(() => {
    const checkSubmissionStatus = async () => {
      // Controlla se il form è già stato compilato
      const storageKey = `form_submitted_${params.id}`;
      const cookieName = `form_submitted_${params.id}`;
      
      // Prima controlla localStorage (per form anonimi e cache locale)
      const submittedData = localStorage.getItem(storageKey);
      if (submittedData) {
        try {
          const data = JSON.parse(submittedData);
          setSubmitted(true);
          setSubmittedResponse(data);
          return; // Se trovato in localStorage, non controllare altro
        } catch (e) {
          // Ignora errori di parsing
        }
      }
      
      // Se non trovato in localStorage, controlla cookie (per form anonimi)
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
      if (cookie) {
        try {
          const cookieValue = cookie.split('=')[1];
          const data = JSON.parse(decodeURIComponent(cookieValue));
          setSubmitted(true);
          setSubmittedResponse(data);
          // Sincronizza anche in localStorage
          localStorage.setItem(storageKey, JSON.stringify(data));
          return;
        } catch (e) {
          // Ignora errori di parsing
        }
      }
      
      // Per utenti autenticati, verifica anche sul server se hanno già compilato
      if (user?.id) {
        try {
          const response = await authenticatedFetch(`/api/forms/${params.id}/user-response`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.hasSubmitted) {
              setSubmitted(true);
              setSubmittedResponse({
                responseId: data.responseId,
                progressiveNumber: data.progressiveNumber
              });
              // Salva anche in localStorage per cache
              localStorage.setItem(storageKey, JSON.stringify({
                responseId: data.responseId,
                progressiveNumber: data.progressiveNumber,
                submittedAt: data.submittedAt || new Date().toISOString()
              }));
            }
          }
        } catch (e) {
          console.log('Impossibile verificare lo stato di invio sul server');
        }
      }
    };
    
    fetchForm();
    checkSubmissionStatus();
  }, [params.id, user]);

  // Carica il font se il form ha un tema personalizzato
  useEffect(() => {
    if (form?.theme?.fontFamily) {
      const fontFamilies = form.theme.fontFamily.replace(/ /g, '+');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [form?.theme?.fontFamily]);

  useEffect(() => {
    if (form) {
      // Initialize visible questions with the first question
      setVisibleQuestions([form.questions[0].id]);
    }
  }, [form]);
  
  // Update visible questions when answers change
  useEffect(() => {
    if (!form) return;
    
    const newVisibleQuestions: string[] = [];
    
    // Always include the first question
    newVisibleQuestions.push(form.questions[0].id);
    
    // Check each question's conditions
    form.questions.forEach((question, index) => {
      if (index === 0) return; // Skip the first question
      
      // If the question has conditions, check them
      if (question.conditions && question.conditions.length > 0) {
        const shouldShow = question.conditions.every(condition => {
          const answer = answers[condition.questionId];
          
          if (!answer) return false;
          
          switch (condition.operator) {
            case 'equals':
              return String(answer) === String(condition.value);
            case 'contains':
              return Array.isArray(answer) 
                ? answer.includes(String(condition.value))
                : String(answer).includes(String(condition.value));
            case 'greaterThan':
              return Number(answer) > Number(condition.value);
            case 'lessThan':
              return Number(answer) < Number(condition.value);
            default:
              return false;
          }
        });
        
        if (shouldShow) {
          newVisibleQuestions.push(question.id);
        }
      } else {
        // If no conditions, show the question
        newVisibleQuestions.push(question.id);
      }
    });
    
    setVisibleQuestions(newVisibleQuestions);
  }, [answers, form]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      // Usa sempre il percorso relativo /api/... per passare attraverso il proxy Vite
      const response = await fetch(`/api/forms/${params.id}/public`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Form non trovato');
      }
      
      const data = await response.json();
      console.log('📝 Form caricato:', data);
      console.log('🎨 Tema ricevuto:', data.theme);
      console.log('🖼️ Background image:', data.theme?.backgroundImage ? 'PRESENTE' : 'ASSENTE');
      if (data.theme?.backgroundImage) {
        console.log('📏 Background image length:', data.theme.backgroundImage.length);
        console.log('📸 Background image preview:', data.theme.backgroundImage.substring(0, 100));
        console.log('🎨 Tutte le proprietà background:', {
          backgroundPosition: data.theme.backgroundPosition,
          backgroundSize: data.theme.backgroundSize,
          backgroundOpacity: data.theme.backgroundOpacity,
          backgroundRepeat: data.theme.backgroundRepeat,
          backgroundAttachment: data.theme.backgroundAttachment
        });
      }
      setForm(data);
    } catch (error) {
      console.error('Errore nel recupero del form:', error);
      toast.error('Impossibile caricare il form');
      navigate('/user/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Verifica che l'utente sia all'ultima domanda visibile prima di permettere l'invio
    const lastVisibleQuestionIndex = visibleQuestions.length > 0 
      ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
      : -1;
    
    if (currentStep !== lastVisibleQuestionIndex) {
      toast.error('Per favore completa tutte le domande prima di inviare');
      return;
    }

    // Verifica domande obbligatorie solo per quelle visibili
    const missingRequired = visibleQuestions
      .map(qId => form.questions.find(q => q.id === qId))
      .filter(q => q && q.required)
      .some(q => {
        if (!q) return false;
        const answer = answers[q.id];
        if (!answer) return true;
        if (Array.isArray(answer) && answer.length === 0) return true;
        if (typeof answer === 'string' && answer.trim() === '') return true;
        return false;
      });

    if (missingRequired) {
      toast.error('Per favore rispondi a tutte le domande obbligatorie');
      return;
    }

    try {
      setSubmitting(true);
      // Usa authenticatedFetch per includere automaticamente le credenziali
      const response = await authenticatedFetch(`/api/forms/${params.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nell\'invio delle risposte');
      }

      const result = await response.json();
      
      // Salva le risposte prima di settare submitted=true
      setSubmittedAnswers({ ...answers });
      
      // Salva nello stato e in localStorage che il form è stato compilato
      setSubmitted(true);
      setSubmittedResponse({
        responseId: result.responseId,
        progressiveNumber: result.progressiveNumber
      });
      
      // Salva in localStorage per form anonimi (per prevenire doppi invii)
      const storageKey = `form_submitted_${params.id}`;
      localStorage.setItem(storageKey, JSON.stringify({
        responseId: result.responseId,
        progressiveNumber: result.progressiveNumber,
        submittedAt: new Date().toISOString()
      }));
      
      toast.success('Risposte inviate con successo! Grazie per il tuo contributo.');
    } catch (error: any) {
      console.error('Errore nell\'invio delle risposte:', error);
      toast.error(error.message || 'Impossibile inviare le risposte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | string[] | number | Date | null) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleRankingChange = (questionId: string, options: string[]) => {
    setRankingAnswers(prev => ({
      ...prev,
      [questionId]: options
    }));
    // Also update the main answers state
    setAnswers(prev => ({
      ...prev,
      [questionId]: options
    }));
  };

  const nextStep = () => {
    if (!form) return;
    
    if (currentStep < form.questions.length - 1) {
      // Find the next visible question
      const currentQuestionIndex = form.questions.findIndex(q => q.id === currentQuestion.id);
      let nextQuestionIndex = currentQuestionIndex + 1;
      
      // Skip questions that are not visible
      while (
        nextQuestionIndex < form.questions.length && 
        !visibleQuestions.includes(form.questions[nextQuestionIndex].id)
      ) {
        nextQuestionIndex++;
      }
      
      if (nextQuestionIndex < form.questions.length) {
        setCurrentStep(nextQuestionIndex);
      }
    }
  };
  
  const prevStep = () => {
    if (!form) return;
    
    if (currentStep > 0) {
      // Find the previous visible question
      const currentQuestionIndex = form.questions.findIndex(q => q.id === currentQuestion.id);
      let prevQuestionIndex = currentQuestionIndex - 1;
      
      // Skip questions that are not visible
      while (
        prevQuestionIndex >= 0 && 
        !visibleQuestions.includes(form.questions[prevQuestionIndex].id)
      ) {
        prevQuestionIndex--;
      }
      
      if (prevQuestionIndex >= 0) {
        setCurrentStep(prevQuestionIndex);
      }
    }
  };

  const toggleProgress = () => {
    setShowProgress(prev => !prev);
  };

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
    return null;
  }

  // Helper per formattare il valore della risposta
  const formatAnswerValue = (value: any, questionType: string): string => {
    if (value === null || value === undefined) return 'Non risposto';
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (questionType === 'DATE' && value instanceof Date) {
      return format(value, 'dd/MM/yyyy', { locale: it });
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Helper per ottenere lo stile del pattern (dichiarato prima del return)
  const getPatternStyleHelper = (pattern: string): string => {
    switch (pattern) {
      case 'dots':
        return `radial-gradient(circle, currentColor 1px, transparent 1px)`;
      case 'grid':
        return `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`;
      case 'waves':
        return `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)`;
      case 'diagonal':
        return `repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 10px)`;
      default:
        return 'none';
    }
  };

  // Mostra messaggio di ringraziamento se il form è stato già compilato
  if (submitted) {
    const theme = form.theme || {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#000000',
      fontFamily: 'Inter',
      borderRadius: 8,
      buttonStyle: 'filled' as const
    };

    return (
      <div 
        className="min-h-screen w-full relative"
        style={{
          fontFamily: `"${theme.fontFamily}", sans-serif`,
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
          backgroundPosition: theme.backgroundPosition || 'center',
          backgroundSize: theme.backgroundSize || 'cover',
          backgroundRepeat: theme.backgroundRepeat || 'no-repeat',
          backgroundAttachment: theme.backgroundAttachment || 'fixed'
        }}
      >
        {theme.backgroundImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
            }}
          />
        )}
        {/* Background Pattern */}
        {(theme as any).backgroundPattern && (theme as any).backgroundPattern !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-10"
            style={{
              backgroundImage: getPatternStyleHelper((theme as any).backgroundPattern),
              backgroundSize: '30px 30px',
              color: theme.textColor,
            }}
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto p-6 py-12">
          {/* Success Header */}
          <Card className="shadow-xl mb-6" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-4xl mb-3 font-bold" style={{ color: theme.primaryColor }}>
                ✅ Risposta Inviata con Successo!
              </CardTitle>
              {form.thankYouMessage ? (
                <CardDescription className="text-lg mb-2" style={{ color: theme.textColor }}>
                  {form.thankYouMessage}
                </CardDescription>
              ) : (
                <CardDescription className="text-lg mb-2" style={{ color: theme.textColor }}>
                  Grazie per aver completato il questionario. Le tue risposte sono state registrate.
                </CardDescription>
              )}
              {submittedResponse && (
                <div className="mt-4 inline-block bg-gradient-to-r from-green-50 to-blue-50 px-6 py-3 rounded-full">
                  <p className="text-sm font-medium text-gray-700">
                    🎯 Numero di riferimento: <strong className="text-xl" style={{ color: theme.primaryColor }}>#{submittedResponse.progressiveNumber}</strong>
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Answers Summary */}
          <Card className="shadow-xl mb-6" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2" style={{ color: theme.primaryColor }}>
                📋 Le Tue Risposte
              </CardTitle>
              <CardDescription style={{ color: theme.textColor }}>
                Ecco un riepilogo delle risposte che hai fornito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.questions.map((question, index) => {
                const answer = submittedAnswers[question.id];
                return (
                  <div 
                    key={question.id} 
                    className="p-4 rounded-lg border-l-4 hover:shadow-md transition-shadow"
                    style={{ 
                      backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                      borderLeftColor: theme.accentColor
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2" style={{ color: theme.textColor }}>
                          {question.text}
                        </h4>
                        <div 
                          className="p-3 rounded-md font-medium"
                          style={{ 
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            color: theme.textColor
                          }}
                        >
                          {formatAnswerValue(answer, question.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="shadow-xl" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user ? (
                  <Button
                    onClick={() => navigate('/user/forms')}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: '#ffffff',
                      borderRadius: `${theme.borderRadius}px`
                    }}
                  >
                    🏠 Torna alla Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/')}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: '#ffffff',
                      borderRadius: `${theme.borderRadius}px`
                    }}
                  >
                    🏠 Torna alla Home
                  </Button>
                )}
                {form.showResults && form.slug && user && (
                  <Button
                    onClick={() => {
                      // Naviga alla pagina dei dettagli della risposta
                      navigate(`/user/responses/${form.slug}/${submittedResponse?.progressiveNumber || ''}`);
                    }}
                    size="lg"
                    variant="outline"
                    className="w-full h-14 text-lg font-semibold"
                    style={{
                      borderColor: theme.primaryColor,
                      color: theme.primaryColor,
                      borderRadius: `${theme.borderRadius}px`
                    }}
                  >
                    📊 Visualizza Dettagli
                  </Button>
                )}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                💡 Conserva il numero di riferimento per eventuali comunicazioni future
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = form.questions[currentStep];
  const progress = ((currentStep + 1) / form.questions.length) * 100;

  // Function to move an item in an array
  const moveItem = (array: string[], fromIndex: number, toIndex: number) => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  const theme = form.theme || {
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#000000',
    fontFamily: 'Inter',
    borderRadius: 8,
    buttonStyle: 'filled' as const,
    backgroundImage: '',
    backgroundPosition: 'center' as const,
    backgroundSize: 'cover' as const,
    backgroundOpacity: 100
  };
  
  // Log del tema per debug
  if (form.theme?.backgroundImage) {
    console.log('🎨 Applicando sfondo al form durante la compilazione:', {
      backgroundImage: form.theme.backgroundImage.substring(0, 50) + '...',
      backgroundPosition: theme.backgroundPosition,
      backgroundSize: theme.backgroundSize,
      backgroundOpacity: theme.backgroundOpacity
    });
  }

  // Helper per ottenere lo stile del pattern
  const getPatternStyle = (pattern: string): string => {
    switch (pattern) {
      case 'dots':
        return `radial-gradient(circle, currentColor 1px, transparent 1px)`;
      case 'grid':
        return `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`;
      case 'waves':
        return `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)`;
      case 'diagonal':
        return `repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 10px)`;
      default:
        return 'none';
    }
  };

  // Helper per ottenere lo stile del bottone
  const getButtonStyle = (variant: 'primary' | 'outline' = 'primary') => {
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        color: theme.primaryColor,
        border: `2px solid ${theme.primaryColor}`,
        borderRadius: `${theme.borderRadius}px`
      };
    }
    return {
      backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
      color: theme.buttonStyle === 'filled' ? '#ffffff' : theme.primaryColor,
      border: theme.buttonStyle === 'outlined' ? `2px solid ${theme.primaryColor}` : 'none',
      borderRadius: `${theme.borderRadius}px`
    };
  };

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{
        fontFamily: `"${theme.fontFamily}", sans-serif`,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
        backgroundPosition: theme.backgroundPosition || 'center',
        backgroundSize: theme.backgroundSize || 'cover',
        backgroundRepeat: theme.backgroundRepeat || 'no-repeat',
        backgroundAttachment: theme.backgroundAttachment || 'fixed'
      }}
    >
      {/* Overlay per opacità background */}
      {theme.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
          }}
        />
      )}

      {/* Background Pattern */}
      {(theme as any).backgroundPattern && (theme as any).backgroundPattern !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-10"
          style={{
            backgroundImage: getPatternStyle((theme as any).backgroundPattern),
            backgroundSize: '30px 30px',
            color: theme.textColor,
          }}
        />
      )}
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <Card 
          className="flex-1 flex flex-col m-0 border-0 shadow-none rounded-none"
          style={{
            backgroundColor: theme.backgroundImage ? 'transparent' : theme.backgroundColor,
            borderRadius: '0',
          }}
        >
        <CardHeader className="px-6 py-8">
          {theme.headerImage && (
            <div className="mb-4 -mx-6 -mt-8">
              <img
                src={theme.headerImage}
                alt="Header"
                className="w-full object-cover"
                style={{ 
                  borderTopLeftRadius: `${theme.borderRadius}px`, 
                  borderTopRightRadius: `${theme.borderRadius}px`,
                  height: theme.headerImageHeight ? `${theme.headerImageHeight}px` : '256px'
                }}
              />
            </div>
          )}
          {theme.logo && (
            <div className="mb-4">
              <img
                src={theme.logo}
                alt="Logo"
                className="w-auto object-contain"
                style={{ 
                  height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                }}
              />
            </div>
          )}
          <CardTitle className="text-3xl mb-2" style={{ color: theme.primaryColor }}>{form.title}</CardTitle>
          <CardDescription className="text-lg mb-4" style={{ color: theme.textColor }}>{form.description}</CardDescription>
          <div 
            className="w-full rounded-full h-3 mt-4"
            style={{ backgroundColor: `${theme.accentColor}20` }}
          >
            <div 
              className="h-3 rounded-full transition-all duration-300" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: theme.primaryColor
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-3">
            <span>Domanda {currentStep + 1} di {form.questions.length}</span>
            <button 
              type="button" 
              onClick={toggleProgress}
              className="text-blue-600 hover:underline"
            >
              {showProgress ? 'Nascondi progresso' : 'Mostra progresso'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col px-6 py-8">
          <form 
            onSubmit={handleSubmit} 
            onKeyDown={(e) => {
              // Previeni submit accidentale premendo Enter nel form
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
            className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full"
          >
            {showProgress ? (
              <div className="space-y-4 mb-6">
                {form.questions.map((q, index) => (
                  <div 
                    key={q.id} 
                    className={cn(
                      "p-4 rounded-md cursor-pointer transition-colors",
                      index === currentStep ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50",
                      answers[q.id] ? "border-l-4 border-green-500" : "border-l-4 border-gray-200"
                    )}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-lg">{q.text}</span>
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                      {answers[q.id] && (
                        <span className="ml-auto text-green-500 text-sm">Risposto</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div key={currentQuestion.id} className="space-y-6 flex-1">
                <div className="flex items-center mb-6">
                  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-4 text-lg font-semibold">
                    {currentStep + 1}
                  </span>
                  <Label className="text-xl font-semibold">
                    {currentQuestion.text}
                    {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>

                {currentQuestion.type === 'TEXT' && (
                  <div className="pl-11">
                    <Input
                      value={answers[currentQuestion.id] as string || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      onKeyDown={(e) => {
                        // Previeni submit accidentale premendo Enter
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Se siamo all'ultima domanda visibile, non fare nulla (l'utente deve cliccare il bottone)
                          const lastVisibleQuestionIndex = visibleQuestions.length > 0 
                            ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
                            : -1;
                          if (currentStep !== lastVisibleQuestionIndex) {
                            // Se non siamo all'ultima domanda, vai alla successiva
                            nextStep();
                          }
                          // Se siamo all'ultima, non fare nulla - l'utente deve cliccare il bottone
                        }
                      }}
                      required={currentQuestion.required}
                      placeholder="Inserisci la tua risposta..."
                      className="w-full"
                    />
                  </div>
                )}

                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="pl-11">
                    {(() => {
                      // Handle both old format (string[]) and new format ({choices: string[], multiple?: boolean})
                      const choices = Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options 
                        : currentQuestion.options?.choices || [];
                      const isMultiple = currentQuestion.options?.multiple || false;
                      
                      if (isMultiple) {
                        return (
                          <div className="space-y-3">
                            {choices.map((option: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${currentQuestion.id}-${index}`}
                                  checked={(answers[currentQuestion.id] as string[] || []).includes(option)}
                                  onCheckedChange={(checked) => {
                                    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                                    handleAnswerChange(
                                      currentQuestion.id,
                                      checked
                                        ? [...currentAnswers, option]
                                        : currentAnswers.filter(a => a !== option)
                                    );
                                  }}
                                />
                                <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer">{option}</Label>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <RadioGroup
                            value={answers[currentQuestion.id] as string || ''}
                            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                            required={currentQuestion.required}
                            className="space-y-3"
                          >
                            {choices.map((option: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} />
                                <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer">{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        );
                      }
                    })()}
                  </div>
                )}

                {currentQuestion.type === 'CHECKBOX' && (
                  <div className="pl-11 space-y-3">
                    {(() => {
                      const checkboxOptions = Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options 
                        : currentQuestion.options?.choices || [];
                      
                      return checkboxOptions.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${currentQuestion.id}-${index}`}
                            checked={(answers[currentQuestion.id] as string[] || []).includes(option)}
                            onCheckedChange={(checked) => {
                              const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                              handleAnswerChange(
                                currentQuestion.id,
                                checked
                                  ? [...currentAnswers, option]
                                  : currentAnswers.filter(a => a !== option)
                              );
                            }}
                          />
                          <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer">{option}</Label>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {currentQuestion.type === 'RATING' && (
                  <div className="pl-11">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant={answers[currentQuestion.id] === rating.toString() ? 'default' : 'outline'}
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-12 h-12"
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'DATE' && (
                  <div className="pl-11">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !answers[currentQuestion.id] && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {answers[currentQuestion.id] ? (
                            format(answers[currentQuestion.id] as Date, "PPP", { locale: it })
                          ) : (
                            <span>Seleziona una data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
                        <Calendar
                          mode="single"
                          selected={answers[currentQuestion.id] as Date || undefined}
                          onSelect={(date) => date && handleAnswerChange(currentQuestion.id, date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {currentQuestion.type === 'LIKERT' && (
                  <div className="pl-11">
                    {(() => {
                      const scale = currentQuestion.options?.scale || 5;
                      const labels = currentQuestion.options?.labels || [];
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">{labels[0] || 'Per niente d\'accordo'}</span>
                            <span className="text-sm text-gray-500">{labels[scale - 1] || 'Completamente d\'accordo'}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: scale }, (_, index) => (
                              <div key={index} className="text-center">
                                <Button
                                  type="button"
                                  variant={answers[currentQuestion.id] === (labels[index] || (index + 1).toString()) ? 'default' : 'outline'}
                                  onClick={() => handleAnswerChange(currentQuestion.id, labels[index] || (index + 1).toString())}
                                  className="w-full h-12 flex flex-col items-center justify-center"
                                >
                                  <span className="text-sm font-medium">{index + 1}</span>
                                  {labels[index] && (
                                    <span className="text-xs mt-1">{labels[index]}</span>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {currentQuestion.type === 'NPS' && (
                  <div className="pl-11">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">0 - Non lo consiglierei</span>
                      <span className="text-sm text-gray-500">10 - Lo consiglierei sicuramente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant={answers[currentQuestion.id] === rating.toString() ? 'default' : 'outline'}
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-10 h-10"
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'FILE_UPLOAD' && (
                  <div className="pl-11">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Trascina un file qui o clicca per selezionare
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        id={`file-${currentQuestion.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // In un'applicazione reale, dovresti caricare il file su un server
                            // Per ora, memorizziamo solo il nome del file
                            handleAnswerChange(currentQuestion.id, file.name);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById(`file-${currentQuestion.id}`)?.click()}
                      >
                        Seleziona file
                      </Button>
                      {answers[currentQuestion.id] && (
                        <p className="mt-2 text-sm text-green-600">
                          File selezionato: {String(answers[currentQuestion.id])}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'RANKING' && currentQuestion.options && (
                  <div className="pl-11">
                    <p className="text-sm text-gray-500 mb-2">
                      Ordina le opzioni dal più importante al meno importante
                    </p>
                    <div className="space-y-2">
                      {(rankingAnswers[currentQuestion.id] || (currentQuestion.options as string[])).map((option, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-move"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', index.toString());
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            const toIndex = index;
                            
                            if (fromIndex !== toIndex) {
                              const currentOptions = rankingAnswers[currentQuestion.id] || [...(currentQuestion.options as string[])];
                              const newOptions = moveItem(currentOptions, fromIndex, toIndex);
                              handleRankingChange(currentQuestion.id, newOptions);
                            }
                          }}
                        >
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200">
                            {index + 1}
                          </span>
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'BRANCHING' && (
                  <div className="pl-11">
                    <p className="text-sm text-gray-500 mb-2">
                      Questa domanda determina il flusso del questionario in base alle tue risposte precedenti.
                    </p>
                    <p className="text-sm font-medium">
                      Rispondi alle domande precedenti per vedere le domande successive.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between space-x-4 mt-auto pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                style={getButtonStyle('outline')}
                className="px-6 py-2 min-w-[120px]"
              >
                Precedente
              </Button>
              
              {(() => {
                const lastVisibleQuestionIndex = visibleQuestions.length > 0 
                  ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
                  : -1;
                const isLastVisibleQuestion = currentStep === lastVisibleQuestionIndex && lastVisibleQuestionIndex !== -1;
                
                if (isLastVisibleQuestion) {
                  return (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }}
                      disabled={submitting}
                      style={getButtonStyle('primary')}
                      className="px-6 py-2"
                    >
                      {submitting ? 'Invio in corso...' : 'Invia Risposte'}
                    </Button>
                  );
                } else {
                  return (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={currentQuestion.required && !answers[currentQuestion.id]}
                      style={getButtonStyle('primary')}
                      className="px-6 py-2"
                    >
                      Successiva
                    </Button>
                  );
                }
              })()}
            </div>
          </form>
        </CardContent>
        <CardFooter className="px-6 py-6 border-t flex justify-end max-w-4xl mx-auto w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/user/forms')}
            style={getButtonStyle('outline')}
            className="px-6 py-2 min-w-[120px]"
          >
            Annulla
          </Button>
        </CardFooter>
        </Card>
      </div>
    </div>
  );
} 