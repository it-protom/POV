import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { authenticatedFetch } from '@/lib/utils';

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TEXT' | 'RATING' | 'CHECKBOX' | 'DATE' | 'RANKING' | 'LIKERT' | 'FILE_UPLOAD' | 'NPS' | 'BRANCHING';
  required: boolean;
  options?: any;
  conditions?: {
    questionId: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number;
  }[];
  nextQuestionId?: string;
}

interface Theme {
  // Colori base
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  
  // Tipografia
  fontFamily: string;
  questionFontSize?: number;
  optionFontSize?: number;
  questionFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  counterFontSize?: number;
  
  // Stile domanda
  questionNumberBgColor?: string;
  questionNumberTextColor?: string;
  questionTextColor?: string;
  questionBorderColor?: string;
  questionBackgroundColor?: string;
  
  // Stile opzioni
  optionTextColor?: string;
  optionHoverColor?: string;
  optionSelectedColor?: string;
  optionBorderColor?: string;
  radioCheckColor?: string;
  
  // Bottoni
  buttonStyle: 'filled' | 'outlined';
  buttonTextColor?: string;
  buttonHoverColor?: string;
  navigationButtonBgColor?: string;
  navigationButtonTextColor?: string;
  navigationButtonBorderColor?: string;
  disabledButtonColor?: string;
  
  // Bordi e spacing
  borderRadius: number;
  cardPadding?: number;
  optionSpacing?: number;
  borderWidth?: number;
  
  // Immagini e layout
  headerImage?: string;
  logo?: string;
  backgroundImage?: string;
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundAttachment?: 'fixed' | 'scroll';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundOpacity?: number;
  headerImageHeight?: number;
  logoSize?: number;
  logoPosition?: 'left' | 'center' | 'right' | 'above-title' | 'below-title';
  layoutOrder?: string[];
  
  // Contatore domande
  counterTextColor?: string;
  counterBgColor?: string;
  
  // Effetti
  shadowIntensity?: number;
  hoverEffect?: boolean;
}

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  questions: Question[];
  thankYouMessage?: string;
  theme?: Theme;
  showResults?: boolean;
  slug?: string;
}

export default function FormClient({ form: initialForm }: { form: Form }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initialForm);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [rankingAnswers, setRankingAnswers] = useState<Record<string, string[]>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);
  const [submittedResponse, setSubmittedResponse] = useState<{ responseId: string; progressiveNumber: number } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});

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
      if (form.questions && form.questions.length > 0) {
        setVisibleQuestions([form.questions[0].id]);
      }
    }
  }, [form]);

  // Update visible questions when answers change
  useEffect(() => {
    if (!form || !form.questions || form.questions.length === 0) return;
    
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

  const handleChange = (qid: string, value: string | string[] | number | Date | null) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: options
    }));
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

    setSubmitting(true);
    setError(null);
    
    try {
      const res = await authenticatedFetch(`/api/forms/${form.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      if (res.ok) {
        const result = await res.json();
        setSubmittedAnswers({ ...answers });
        setSubmitted(true);
        setSubmittedResponse({
          responseId: result.responseId,
          progressiveNumber: result.progressiveNumber
        });
        
        const storageKey = `form_submitted_${form.id}`;
        localStorage.setItem(storageKey, JSON.stringify({
          responseId: result.responseId,
          progressiveNumber: result.progressiveNumber,
          submittedAt: new Date().toISOString()
        }));
        
        toast.success('Risposte inviate con successo! Grazie per il tuo contributo.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Errore nell\'invio della risposta');
        toast.error(errorData.error || 'Errore nell\'invio della risposta');
      }
    } catch (err) {
      setError('Errore di rete');
      toast.error('Errore di rete');
    }
    setSubmitting(false);
  };

  const nextStep = () => {
    if (!form) return;
    
    if (currentStep < form.questions.length - 1) {
      const currentQuestion = form.questions[currentStep];
      const currentQuestionIndex = form.questions.findIndex(q => q.id === currentQuestion.id);
      let nextQuestionIndex = currentQuestionIndex + 1;
      
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
      const currentQuestion = form.questions[currentStep];
      const currentQuestionIndex = form.questions.findIndex(q => q.id === currentQuestion.id);
      let prevQuestionIndex = currentQuestionIndex - 1;
      
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

  // Function to move an item in an array
  const moveItem = (array: string[], fromIndex: number, toIndex: number) => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  if (!form || !form.questions || form.questions.length === 0) {
    return <div className="p-4 text-center">Form non valido o senza domande</div>;
  }

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

  // Helper per ottenere lo stile del bottone
  const getButtonStyle = (variant: 'primary' | 'outline' | 'navigation' = 'primary', isDisabled: boolean = false) => {
    if (isDisabled && variant === 'navigation') {
      return {
        backgroundColor: theme.disabledButtonColor || '#e5e7eb',
        color: '#9ca3af',
        border: `${theme.borderWidth || 1}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
        borderRadius: `${theme.borderRadius}px`,
        cursor: 'not-allowed'
      };
    }
    
    if (isDisabled) {
      return {
        backgroundColor: theme.disabledButtonColor || '#e5e7eb',
        color: '#9ca3af',
        border: 'none',
        borderRadius: `${theme.borderRadius}px`,
        cursor: 'not-allowed',
        opacity: 0.6
      };
    }
    
    if (variant === 'navigation') {
      return {
        backgroundColor: theme.navigationButtonBgColor || 'transparent',
        color: theme.navigationButtonTextColor || theme.textColor,
        border: `${theme.borderWidth || 1}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
        borderRadius: `${theme.borderRadius}px`
      };
    }
    
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        color: theme.buttonTextColor || theme.primaryColor,
        border: `${theme.borderWidth || 2}px solid ${theme.primaryColor}`,
        borderRadius: `${theme.borderRadius}px`
      };
    }
    
    return {
      backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
      color: theme.buttonStyle === 'filled' ? (theme.buttonTextColor || '#ffffff') : (theme.buttonTextColor || theme.primaryColor),
      border: theme.buttonStyle === 'outlined' ? `${theme.borderWidth || 2}px solid ${theme.primaryColor}` : 'none',
      borderRadius: `${theme.borderRadius}px`
    };
  };

  // Mostra messaggio di ringraziamento se il form è stato già compilato
  if (submitted) {
    return (
      <div 
        className="min-h-screen w-full relative -mx-6 -my-8"
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
        <div className="relative z-10 max-w-4xl mx-auto p-6 py-12">
          <Card className="shadow-xl mb-6" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-4xl mb-3 font-bold" style={{ color: theme.primaryColor }}>
                Risposta Inviata con Successo!
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
                    Numero di riferimento: <strong className="text-xl" style={{ color: theme.primaryColor }}>#{submittedResponse.progressiveNumber}</strong>
                  </p>
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="shadow-xl mb-6" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2" style={{ color: theme.primaryColor }}>
                Le Tue Risposte
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

          <Card className="shadow-xl" style={{ backgroundColor: theme.backgroundColor, borderRadius: `${theme.borderRadius}px` }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {form.showResults && form.slug && (
                  <Button
                    onClick={() => {
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

  return (
    <div 
      className="min-h-screen w-full relative -mx-6 -my-8"
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
          <div className="flex justify-between mt-3" style={{ fontSize: `${theme.counterFontSize || 14}px` }}>
            <span style={{ color: theme.counterTextColor || theme.textColor }}>Domanda {currentStep + 1} di {form.questions.length}</span>
            <button 
              type="button" 
              onClick={toggleProgress}
              className="hover:underline"
              style={{ color: theme.primaryColor }}
            >
              {showProgress ? 'Nascondi progresso' : 'Mostra progresso'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col px-6 py-8">
          <form 
            onSubmit={handleSubmit} 
            onKeyDown={(e) => {
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
              <div 
                key={currentQuestion.id} 
                className="space-y-6 min-h-[400px] flex flex-col"
                style={{ 
                  padding: `${theme.cardPadding || 24}px`,
                  backgroundColor: theme.questionBackgroundColor || 'transparent',
                  borderRadius: `${theme.borderRadius}px`,
                  border: theme.questionBorderColor ? `${theme.borderWidth || 1}px solid ${theme.questionBorderColor}` : 'none',
                  boxShadow: `0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`
                }}
              >
                {/* Domanda corrente */}
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <span 
                      className="w-10 h-10 flex items-center justify-center rounded-full mr-4 font-semibold" 
                      style={{ 
                        backgroundColor: theme.questionNumberBgColor || theme.primaryColor,
                        color: theme.questionNumberTextColor || '#ffffff',
                        fontSize: `${theme.questionFontSize || 20}px`,
                        fontWeight: theme.questionFontWeight || 'semibold'
                      }}
                    >
                      {currentStep + 1}
                    </span>
                    <Label 
                      className="font-semibold flex-1"
                      style={{ 
                        color: theme.questionTextColor || theme.textColor,
                        fontSize: `${theme.questionFontSize || 20}px`,
                        fontWeight: theme.questionFontWeight || 'semibold'
                      }}
                    >
                      {currentQuestion.text}
                      {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>

                  <div className="pl-14" style={{ 
                    fontSize: `${theme.optionFontSize || 16}px`,
                    color: theme.optionTextColor || theme.textColor
                  }}>
                    {/* TEXT */}
                    {currentQuestion.type === 'TEXT' && (
                      <Input 
                        value={answers[currentQuestion.id] as string || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const lastVisibleQuestionIndex = visibleQuestions.length > 0 
                              ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
                              : -1;
                            if (currentStep !== lastVisibleQuestionIndex) {
                              nextStep();
                            }
                          }
                        }}
                        placeholder="Inserisci la tua risposta..." 
                        className="w-full" 
                        readOnly={false}
                      />
                    )}

                    {/* MULTIPLE_CHOICE */}
                    {currentQuestion.type === 'MULTIPLE_CHOICE' && (() => {
                      const choices = Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options 
                        : currentQuestion.options?.choices || [];
                      const isMultiple = currentQuestion.options?.multiple || false;
                      
                      if (isMultiple) {
                        return (
                          <div style={{ gap: `${theme.optionSpacing || 12}px`, display: 'flex', flexDirection: 'column' }}>
                            {choices.map((option: string, index: number) => (
                              <div 
                                key={index} 
                                className="flex items-center space-x-2 p-3 rounded-md transition-colors cursor-pointer"
                                style={{ 
                                  borderWidth: `${theme.borderWidth || 1}px`,
                                  borderStyle: 'solid',
                                  borderColor: theme.optionBorderColor || 'transparent',
                                  backgroundColor: (answers[currentQuestion.id] as string[] || []).includes(option) 
                                    ? theme.optionSelectedColor || `${theme.primaryColor}15` 
                                    : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (theme.hoverEffect && !(answers[currentQuestion.id] as string[] || []).includes(option)) {
                                    e.currentTarget.style.backgroundColor = theme.optionHoverColor || `${theme.primaryColor}10`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!(answers[currentQuestion.id] as string[] || []).includes(option)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
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
                                  style={{ 
                                    borderColor: theme.radioCheckColor || theme.primaryColor,
                                    accentColor: theme.radioCheckColor || theme.primaryColor
                                  }}
                                />
                                <Label 
                                  htmlFor={`${currentQuestion.id}-${index}`} 
                                  className="cursor-pointer flex-1" 
                                  style={{ 
                                    color: theme.optionTextColor || theme.textColor,
                                    fontSize: `${theme.optionFontSize || 16}px`
                                  }}
                                >
                                  {option}
                                </Label>
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
                            style={{ gap: `${theme.optionSpacing || 12}px`, display: 'flex', flexDirection: 'column' }}
                          >
                            {choices.map((option: string, index: number) => (
                              <div 
                                key={index} 
                                className="flex items-center space-x-2 p-3 rounded-md transition-colors cursor-pointer"
                                style={{ 
                                  borderWidth: `${theme.borderWidth || 1}px`,
                                  borderStyle: 'solid',
                                  borderColor: theme.optionBorderColor || 'transparent',
                                  backgroundColor: answers[currentQuestion.id] === option 
                                    ? theme.optionSelectedColor || `${theme.primaryColor}15` 
                                    : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  if (theme.hoverEffect && answers[currentQuestion.id] !== option) {
                                    e.currentTarget.style.backgroundColor = theme.optionHoverColor || `${theme.primaryColor}10`;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (answers[currentQuestion.id] !== option) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <RadioGroupItem 
                                  value={option} 
                                  id={`${currentQuestion.id}-${index}`}
                                  style={{ 
                                    borderColor: theme.radioCheckColor || theme.primaryColor,
                                    color: theme.radioCheckColor || theme.primaryColor
                                  }}
                                />
                                <Label 
                                  htmlFor={`${currentQuestion.id}-${index}`} 
                                  className="cursor-pointer flex-1" 
                                  style={{ 
                                    color: theme.optionTextColor || theme.textColor,
                                    fontSize: `${theme.optionFontSize || 16}px`
                                  }}
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        );
                      }
                    })()}

                    {/* CHECKBOX */}
                    {currentQuestion.type === 'CHECKBOX' && (
                      <div style={{ marginTop: `${theme.optionSpacing || 12}px` }}>
                        {(() => {
                          const choices = Array.isArray(currentQuestion.options) 
                            ? currentQuestion.options 
                            : currentQuestion.options?.choices || [];
                        
                          return choices.map((option: string, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center space-x-2 p-3 rounded-md transition-colors cursor-pointer"
                            style={{ 
                              borderWidth: `${theme.borderWidth || 1}px`,
                              borderStyle: 'solid',
                              borderColor: theme.optionBorderColor || 'transparent',
                              backgroundColor: (answers[currentQuestion.id] as string[] || []).includes(option) 
                                ? theme.optionSelectedColor || `${theme.primaryColor}15` 
                                : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (theme.hoverEffect && !(answers[currentQuestion.id] as string[] || []).includes(option)) {
                                e.currentTarget.style.backgroundColor = theme.optionHoverColor || `${theme.primaryColor}10`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(answers[currentQuestion.id] as string[] || []).includes(option)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
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
                              style={{ 
                                borderColor: theme.radioCheckColor || theme.primaryColor,
                                accentColor: theme.radioCheckColor || theme.primaryColor
                              }}
                            />
                            <Label 
                              htmlFor={`${currentQuestion.id}-${index}`} 
                              className="cursor-pointer flex-1" 
                              style={{ 
                                color: theme.optionTextColor || theme.textColor,
                                fontSize: `${theme.optionFontSize || 16}px`
                              }}
                            >
                              {option}
                            </Label>
                          </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* RATING */}
                    {currentQuestion.type === 'RATING' && (
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant="outline"
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-12 h-12"
                          style={{ 
                            borderRadius: `${theme.borderRadius}px`,
                            ...(answers[currentQuestion.id] === rating.toString() && {
                              backgroundColor: theme.primaryColor,
                              color: theme.buttonTextColor || '#ffffff',
                              borderColor: theme.primaryColor
                            })
                          }}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                    )}

                    {/* DATE */}
                    {currentQuestion.type === 'DATE' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !answers[currentQuestion.id] && "text-muted-foreground"
                          )}
                          style={getButtonStyle('outline')}
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
                    )}

                    {/* LIKERT */}
                    {currentQuestion.type === 'LIKERT' && (() => {
                      const scale = currentQuestion.options?.scale || 5;
                      const labels = currentQuestion.options?.labels || [];
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">{labels[0] || "Per niente d'accordo"}</span>
                            <span className="text-sm text-gray-500">{labels[scale - 1] || "Completamente d'accordo"}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: scale }, (_, index) => (
                              <Button 
                                key={index} 
                                type="button" 
                                variant="outline" 
                                className="h-12" 
                                onClick={() => handleAnswerChange(currentQuestion.id, (index + 1).toString())}
                                style={{ 
                                  borderRadius: `${theme.borderRadius}px`,
                                  ...(answers[currentQuestion.id] === (index + 1).toString() && {
                                    backgroundColor: theme.primaryColor,
                                    color: theme.buttonTextColor || '#ffffff',
                                    borderColor: theme.primaryColor
                                  })
                                }}
                              >
                                <span className="text-sm">{index + 1}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* NPS */}
                    {currentQuestion.type === 'NPS' && (
                      <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">0 - Non lo consiglierei</span>
                      <span className="text-sm text-gray-500">10 - Lo consiglierei sicuramente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant="outline"
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-10 h-10"
                          style={{ 
                            borderRadius: `${theme.borderRadius}px`,
                            ...(answers[currentQuestion.id] === rating.toString() && {
                              backgroundColor: theme.primaryColor,
                              color: theme.buttonTextColor || '#ffffff',
                              borderColor: theme.primaryColor
                            })
                          }}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                      </div>
                    )}

                    {/* FILE_UPLOAD */}
                    {currentQuestion.type === 'FILE_UPLOAD' && (
                    <div className="border-2 border-dashed rounded-md p-6 text-center" style={{ borderRadius: `${theme.borderRadius}px` }}>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Trascina un file qui</p>
                        <input
                        type="file"
                        className="hidden"
                        id={`file-${currentQuestion.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleAnswerChange(currentQuestion.id, file.name);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById(`file-${currentQuestion.id}`)?.click()}
                        style={{ borderRadius: `${theme.borderRadius}px` }}
                      >
                        Seleziona file
                      </Button>
                      {answers[currentQuestion.id] && (
                        <p className="mt-2 text-sm" style={{ color: theme.primaryColor }}>
                          File selezionato: {String(answers[currentQuestion.id])}
                        </p>
                      )}
                    </div>
                    )}

                    {/* RANKING */}
                    {currentQuestion.type === 'RANKING' && (
                    <p className="text-sm mb-2" style={{ color: theme.textColor }}>
                      Ordina le opzioni dal più importante al meno importante
                    </p>
                    <div className="space-y-2">
                      {(rankingAnswers[currentQuestion.id] || (currentQuestion.options as string[])).map((option, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-move"
                          style={{ borderColor: theme.primaryColor, borderRadius: `${theme.borderRadius}px` }}
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
                          <GripVertical className="h-4 w-4" style={{ color: theme.textColor }} />
                          <span 
                            className="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            {index + 1}
                          </span>
                          <span style={{ color: theme.textColor }}>{option}</span>
                        </div>
                    ))}
                  </div>
                )}

                    {/* BRANCHING */}
                    {currentQuestion.type === 'BRANCHING' && (
                      <p className="text-sm text-gray-500">Domanda condizionale basata sulle risposte precedenti</p>
                    )}
                  </div>
                </div>

                {/* Bottoni navigazione all'interno della card */}
                <div className="flex justify-between items-center pt-6 border-t mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    style={getButtonStyle('navigation', currentStep === 0)}
                    className="px-6 py-2 transition-all"
                  >
                    Precedente
                  </Button>
                  
                  <div 
                    className="px-4 py-2 rounded"
                    style={{
                      color: theme.counterTextColor || theme.textColor,
                      fontSize: `${theme.counterFontSize || 14}px`,
                      backgroundColor: theme.counterBgColor || 'transparent',
                      fontWeight: 'medium'
                    }}
                  >
                    Domanda {currentStep + 1} di {form.questions.length}
                  </div>
                  
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
                          className="px-6 py-2 transition-all"
                          style={{
                            ...getButtonStyle('primary', submitting),
                            fontWeight: '600'
                          }}
                        >
            {submitting ? 'Invio in corso...' : 'Invia Risposte'}
                        </Button>
                      );
                    } else {
                      const isDisabled = currentQuestion.required && !answers[currentQuestion.id];
                      return (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={isDisabled}
                          className="px-6 py-2 transition-all"
                          style={{
                            ...getButtonStyle('primary', isDisabled),
                            fontWeight: '600'
                          }}
                        >
                          Successiva
                        </Button>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
        </form>
        </CardContent>
        </Card>
      </div>
      </div>
  );
} 
