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
import { ProgressBarWithCheckpoints } from '@/components/survey/ProgressBarWithCheckpoints';
import ThankYouModal from '@/components/survey/ThankYouModal';

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
  const [rankingAnswers, setRankingAnswers] = useState<Record<string, string[]>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);
  const [submittedResponse, setSubmittedResponse] = useState<{ responseId: string; progressiveNumber: number } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // Mostra il modal di ringraziamento quando il form viene inviato
  useEffect(() => {
    if (submitted) {
      setShowThankYouModal(true);
    }
  }, [submitted]);

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
        border: `${Math.min(theme.borderWidth || 1, 2)}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
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
        border: `${Math.min(theme.borderWidth || 1, 2)}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
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
      <>
        {/* Thank You Modal */}
        <ThankYouModal
          isOpen={showThankYouModal}
          onClose={() => setShowThankYouModal(false)}
          message={form.thankYouMessage}
          progressiveNumber={submittedResponse?.progressiveNumber}
        />

        {/* Success Screen */}
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

          {/* Compact Response Summary */}
          <div className="relative z-10 max-w-3xl mx-auto p-6 py-8">
            {/* Back Button */}
            <Button
              onClick={() => navigate('/user/forms')}
              variant="ghost"
              className="mb-4 hover:bg-white/10"
              style={{ color: theme.textColor }}
            >
              ← Torna alla Dashboard
            </Button>

            <Card
              className="shadow-xl overflow-hidden"
              style={{
                backgroundColor: theme.backgroundColor,
                borderRadius: `${theme.borderRadius}px`,
                borderStyle: theme.borderStyle || 'solid',
                boxShadow: theme.glowEffect?.enabled
                  ? `0 0 ${(theme.glowEffect.intensity || 50) / 5}px ${theme.glowEffect.color || theme.primaryColor}, 0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`
                  : `0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`,
              }}
            >
              {/* Header */}
              <CardHeader className="pb-4 space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: theme.primaryColor }}>
                  <CheckCircle className="w-5 h-5" />
                  Riepilogo Risposte
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
                  Riferimento #{submittedResponse?.progressiveNumber}
                </CardDescription>
              </CardHeader>

              {/* Responses Grid */}
              <CardContent className="p-6 pt-2">
                <div className="space-y-3">
                  {form.questions.map((question, index) => {
                    const answer = submittedAnswers[question.id];
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: `${theme.primaryColor}05`,
                          borderColor: `${theme.primaryColor}15`,
                        }}
                      >
                        <div className="flex gap-3">
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs"
                            style={{
                              backgroundColor: theme.primaryColor,
                              color: theme.buttonTextColor || '#ffffff',
                            }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium text-sm mb-2 leading-snug"
                              style={{ color: theme.textColor }}
                            >
                              {question.text}
                            </h4>
                            <div
                              className="text-sm font-medium px-3 py-2 rounded-md"
                              style={{
                                backgroundColor: theme.backgroundColor,
                                color: theme.textColor,
                              }}
                            >
                              {formatAnswerValue(answer, question.type)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>

              {/* Footer Actions */}
              <CardFooter className="flex flex-col gap-3 p-6 pt-4 border-t" style={{ borderColor: `${theme.primaryColor}15` }}>
                {form.showResults && form.slug && (
                  <Button
                    onClick={() => {
                      navigate(`/user/responses/${form.slug}/${submittedResponse?.progressiveNumber || ''}`);
                    }}
                    size="lg"
                    className="w-full"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.buttonTextColor || '#ffffff',
                      borderRadius: `${theme.borderRadius}px`
                    }}
                  >
                    Visualizza Dettagli Completi
                  </Button>
                )}
                <p className="text-center text-xs opacity-60" style={{ color: theme.textColor }}>
                  Conserva il numero di riferimento per eventuali comunicazioni future
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = form.questions[currentStep];
  const progress = ((currentStep + 1) / form.questions.length) * 100;
  
  // Calcola le domande completate per la progress bar
  const completedQuestions = form.questions
    .map((q, index) => {
      const answer = answers[q.id];
      if (!answer) return null;
      if (Array.isArray(answer) && answer.length === 0) return null;
      if (typeof answer === 'string' && answer.trim() === '') return null;
      return index;
    })
    .filter((index): index is number => index !== null);

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
          
          {/* Progress Bar con Checkpoint */}
          <div className="mt-6">
            <ProgressBarWithCheckpoints
              totalQuestions={form.questions.length}
              currentQuestion={currentStep}
              completedQuestions={completedQuestions}
              theme={theme}
              onCheckpointClick={(index) => {
                if (visibleQuestions.includes(form.questions[index].id)) {
                  setCurrentStep(index);
                }
              }}
            />
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
            className="flex-1 flex flex-col space-y-4 max-w-3xl mx-auto w-full"
          >
            <motion.div
              key={currentQuestion.id}
              className="min-h-[280px] flex flex-col"
              style={{
                padding: `${theme.cardPadding || 32}px`,
                backgroundColor: theme.questionBackgroundColor || '#ffffff',
                borderRadius: `${theme.borderRadius || 12}px`,
                border: theme.questionBorderColor ? `${theme.borderWidth || 1}px solid ${theme.questionBorderColor}` : '1px solid #e5e7eb',
                borderStyle: theme.borderStyle || 'solid',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: theme.enableTransitions !== false ? 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                {/* Domanda corrente */}
                <div className="flex-1 flex flex-col gap-6 justify-center">
                  {/* Titolo domanda centrato */}
                  <motion.div
                    className="w-full text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label
                      className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center block leading-tight"
                      style={{
                        fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
                        color: theme.questionTextColor || theme.textColor,
                        fontSize: `${(theme.questionFontSize || 22) * 1.15}px`,
                        fontWeight: theme.questionFontWeight || '600',
                        lineHeight: (theme as any).lineHeight || 1.4,
                        letterSpacing: (theme as any).letterSpacing ? `${(theme as any).letterSpacing}px` : '-0.02em',
                        textShadow: (theme as any).textShadow || 'none',
                      }}
                    >
                      {currentQuestion.text}
                    </Label>
                  </motion.div>

                  {/* Opzioni centrate e ottimizzate */}
                  <div className="w-full max-w-2xl mx-auto" style={{
                    fontSize: `${theme.optionFontSize || 18}px`,
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
                        className="w-full text-base sm:text-lg px-4 py-3"
                        readOnly={false}
                      />
                    )}

                    {/* MULTIPLE_CHOICE */}
                    {currentQuestion.type === 'MULTIPLE_CHOICE' && (() => {
                      const choices = Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options 
                        : currentQuestion.options?.choices || [];
                      const isMultiple = currentQuestion.options?.multiple || false;
                      const maxSelections = currentQuestion.options && !Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options.maxSelections 
                        : undefined;
                      
                      if (isMultiple) {
                        return (
                          <div className="flex flex-col gap-4 w-full">
                            {maxSelections && (
                              <div className="text-sm text-gray-500 text-center mb-2">
                                Seleziona al massimo {maxSelections} {maxSelections === 1 ? 'opzione' : 'opzioni'}
                              </div>
                            )}
                            <div className="flex flex-wrap justify-center gap-4 w-full">
                              {choices.map((option: string, index: number) => {
                                const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                                const isSelected = currentAnswers.includes(option);
                                const isDisabled = !isSelected && maxSelections && currentAnswers.length >= maxSelections;
                                
                                return (
                                  <motion.div
                                    key={index}
                                    className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all min-w-[140px] flex-1 ${
                                      isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    }`}
                                    style={{
                                      borderWidth: `${theme.borderWidth || 2}px`,
                                      borderStyle: 'solid',
                                      borderColor: isSelected
                                        ? theme.primaryColor
                                        : (theme.optionBorderColor || '#e5e7eb'),
                                      backgroundColor: isSelected
                                        ? theme.optionSelectedColor || `${theme.primaryColor}18`
                                        : 'transparent',
                                      borderRadius: `${theme.borderRadius || 12}px`,
                                      maxWidth: '180px',
                                    }}
                                    whileHover={!isDisabled ? { scale: 1.03, y: -2 } : {}}
                                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                    onClick={() => {
                                      if (isDisabled) return;
                                      
                                      handleAnswerChange(
                                        currentQuestion.id,
                                        isSelected
                                          ? currentAnswers.filter(a => a !== option)
                                          : [...currentAnswers, option]
                                      );
                                    }}
                                  >
                                    <Checkbox
                                      id={`${currentQuestion.id}-${index}`}
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onCheckedChange={(checked) => {
                                        if (isDisabled && checked) return;
                                        
                                        handleAnswerChange(
                                          currentQuestion.id,
                                          checked
                                            ? [...currentAnswers, option]
                                            : currentAnswers.filter(a => a !== option)
                                        );
                                      }}
                                      style={{
                                        borderColor: theme.radioCheckColor || theme.primaryColor,
                                        accentColor: theme.radioCheckColor || theme.primaryColor,
                                        width: '20px',
                                        height: '20px',
                                      }}
                                      className="mb-3"
                                    />
                                    <Label
                                      htmlFor={`${currentQuestion.id}-${index}`}
                                      className={`text-center font-medium leading-tight ${
                                        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                                      }`}
                                      style={{
                                        color: theme.optionTextColor || theme.textColor,
                                        fontSize: `${(theme.optionFontSize || 16) * 1.05}px`
                                      }}
                                    >
                                      {option}
                                    </Label>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <RadioGroup
                            value={answers[currentQuestion.id] as string || ''}
                            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                            required={currentQuestion.required}
                            className="flex flex-col gap-3 w-full"
                          >
                            {choices.map((option: string, index: number) => (
                              <motion.label
                                key={index}
                                htmlFor={`${currentQuestion.id}-${index}`}
                                className="flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer border hover:shadow-sm"
                                style={{
                                  borderWidth: `${theme.borderWidth || 1}px`,
                                  borderStyle: 'solid',
                                  borderColor: answers[currentQuestion.id] === option
                                    ? theme.primaryColor || '#3b82f6'
                                    : (theme.optionBorderColor || '#e5e7eb'),
                                  backgroundColor: answers[currentQuestion.id] === option
                                    ? theme.optionSelectedColor || `${theme.primaryColor || '#3b82f6'}15`
                                    : 'transparent',
                                  borderRadius: `${theme.borderRadius || 8}px`,
                                }}
                                whileHover={{ 
                                  backgroundColor: answers[currentQuestion.id] === option
                                    ? theme.optionSelectedColor || `${theme.primaryColor || '#3b82f6'}20`
                                    : (theme.optionHoverColor || '#f9fafb'),
                                  borderColor: theme.primaryColor || '#3b82f6',
                                }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <RadioGroupItem
                                  value={option}
                                  id={`${currentQuestion.id}-${index}`}
                                  style={{
                                    borderColor: theme.radioCheckColor || theme.primaryColor || '#3b82f6',
                                    color: theme.radioCheckColor || theme.primaryColor || '#3b82f6',
                                  }}
                                  className="flex-shrink-0"
                                />
                                <span
                                  className="flex-1 font-normal leading-relaxed"
                                  style={{
                                    color: theme.optionTextColor || theme.textColor || '#1f2937',
                                    fontSize: `${theme.optionFontSize || 16}px`
                                  }}
                                >
                                  {option}
                                </span>
                              </motion.label>
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
                    <div className="flex items-center justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant="ghost"
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-14 h-14 transition-all hover:scale-110 p-0"
                        >
                          <Star
                            className="w-10 h-10"
                            style={{
                              fill: answers[currentQuestion.id] && parseInt(answers[currentQuestion.id]) >= rating 
                                ? theme.primaryColor || '#FFCD00'
                                : 'none',
                              color: answers[currentQuestion.id] && parseInt(answers[currentQuestion.id]) >= rating 
                                ? theme.primaryColor || '#FFCD00'
                                : '#d1d5db',
                              transition: 'all 0.2s'
                            }}
                          />
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
                        <div className="space-y-4 w-full">
                          <div className="flex items-center justify-between mb-3 px-2">
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">{labels[0] || "Per niente d'accordo"}</span>
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">{labels[scale - 1] || "Completamente d'accordo"}</span>
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            {Array.from({ length: scale }, (_, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant="outline"
                                className="w-14 h-14 text-lg font-semibold transition-all hover:scale-105"
                                onClick={() => handleAnswerChange(currentQuestion.id, (index + 1).toString())}
                                style={{
                                  borderRadius: `${theme.borderRadius}px`,
                                  borderWidth: '2px',
                                  ...(answers[currentQuestion.id] === (index + 1).toString() && {
                                    backgroundColor: theme.primaryColor,
                                    color: theme.buttonTextColor || '#ffffff',
                                    borderColor: theme.primaryColor
                                  })
                                }}
                              >
                                <span>{index + 1}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* NPS */}
                    {currentQuestion.type === 'NPS' && (
                      <div className="w-full space-y-3">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">0 - Non lo consiglierei</span>
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">10 - Lo consiglierei sicuramente</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <Button
                          key={rating}
                          type="button"
                          variant="outline"
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
                          className="w-12 h-12 text-base font-semibold transition-all hover:scale-105"
                          style={{
                            borderRadius: `${theme.borderRadius}px`,
                            borderWidth: '2px',
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
                <div className="flex justify-between items-center pt-5 mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    style={getButtonStyle('navigation', currentStep === 0)}
                    className="px-5 py-2.5 text-sm sm:text-base font-medium transition-all"
                  >
                    Precedente
                  </Button>

                  <div
                    className="px-3 py-1.5 rounded text-center"
                    style={{
                      color: theme.counterTextColor || theme.textColor,
                      fontSize: `${theme.counterFontSize || 13}px`,
                      backgroundColor: theme.counterBgColor || 'transparent',
                      fontWeight: '500'
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
                          className="px-5 py-2.5 text-sm sm:text-base font-semibold transition-all"
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
                          className="px-5 py-2.5 text-sm sm:text-base font-semibold transition-all"
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
