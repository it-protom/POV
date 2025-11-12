import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon, Upload, GripVertical, CheckCircle, ArrowLeft, Star } from 'lucide-react';
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
  headingFontFamily?: string;
  questionFontSize?: number;
  optionFontSize?: number;
  questionFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  counterFontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  
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
  questionSpacing?: number;
  sectionSpacing?: number;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  containerMaxWidth?: number;
  
  // Immagini e layout
  headerImage?: string;
  logo?: string;
  backgroundImage?: string;
  backgroundType?: 'color' | 'image' | 'gradient' | 'pattern';
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundAttachment?: 'fixed' | 'scroll';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundOpacity?: number;
  backgroundGradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    colors: string[];
  };
  backgroundPattern?: 'dots' | 'grid' | 'waves' | 'diagonal' | 'none';
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
  hoverScale?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  enableTransitions?: boolean;
  glowEffect?: {
    enabled: boolean;
    color: string;
    intensity: number;
  };
  backgroundBlur?: number; // Effetto sfocatura (0-50px)
  backgroundOverlay?: {
    color: string; // Colore sovrapposizione
    opacity: number; // Opacità (0-1)
  };
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

export default function FormUser({ form: initialForm }: { form: Form }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initialForm);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rankingAnswers, setRankingAnswers] = useState<Record<string, string[]>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);
  const [submittedResponse, setSubmittedResponse] = useState<{ responseId: string; progressiveNumber: number } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
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

  // Carica il font per le intestazioni se diverso
  useEffect(() => {
    if (form?.theme?.headingFontFamily && form.theme.headingFontFamily !== form.theme.fontFamily) {
      const fontFamilies = form.theme.headingFontFamily.replace(/ /g, '+');
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
  }, [form?.theme?.headingFontFamily, form?.theme?.fontFamily]);

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

  // Helper per ottenere il background gradient
  const getGradientBackground = (gradient: Theme['backgroundGradient']): string => {
    if (!gradient || !gradient.colors || gradient.colors.length === 0) return '';
    
    if (gradient.type === 'linear') {
      const angle = gradient.angle || 135;
      return `linear-gradient(${angle}deg, ${gradient.colors.join(', ')})`;
    } else {
      return `radial-gradient(circle, ${gradient.colors.join(', ')})`;
    }
  };

  // Helper per ottenere la velocità dell'animazione
  const getAnimationDuration = (speed?: 'slow' | 'normal' | 'fast'): string => {
    switch (speed) {
      case 'slow': return '500ms';
      case 'fast': return '150ms';
      default: return '300ms';
    }
  };

  useEffect(() => {
    if (form) {
      if (form.questions && form.questions.length > 0) {
        setVisibleQuestions([form.questions[0].id]);
      }
    }
  }, [form]);

  useEffect(() => {
    if (!form || !form.questions || form.questions.length === 0) return;
    
    const newVisibleQuestions: string[] = [];
    newVisibleQuestions.push(form.questions[0].id);
    
    form.questions.forEach((question, index) => {
      if (index === 0) return;
      
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
        newVisibleQuestions.push(question.id);
      }
    });
    
    setVisibleQuestions(newVisibleQuestions);
  }, [answers, form]);

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

  const moveItem = (array: string[], fromIndex: number, toIndex: number) => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    const lastVisibleQuestionIndex = visibleQuestions.length > 0 
      ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
      : -1;
    
    if (currentStep !== lastVisibleQuestionIndex) {
      toast.error('Per favore completa tutte le domande prima di inviare');
      return;
    }

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
        toast.error(errorData.error || 'Errore nell\'invio della risposta');
      }
    } catch (err) {
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
        setSlideDirection('right');
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
        setSlideDirection('left');
        setCurrentStep(prevQuestionIndex);
      }
    }
  };

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

  // Determina il tipo di background per la pagina di thank you
  const thankYouBackgroundType = theme.backgroundType || (theme.backgroundImage ? 'image' : theme.backgroundGradient ? 'gradient' : theme.backgroundPattern && theme.backgroundPattern !== 'none' ? 'pattern' : 'color');

  // Pagina di ringraziamento dopo submit
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
          className="min-h-screen w-full relative"
          style={{
            fontFamily: `"${theme.fontFamily}", sans-serif`,
            lineHeight: theme.lineHeight || undefined,
            letterSpacing: theme.letterSpacing !== undefined ? `${theme.letterSpacing}px` : undefined,
            backgroundColor: thankYouBackgroundType === 'color' ? theme.backgroundColor : undefined,
            backgroundImage: thankYouBackgroundType === 'gradient' ? getGradientBackground(theme.backgroundGradient) :
              thankYouBackgroundType === 'pattern' ? getPatternStyle(theme.backgroundPattern || 'none') : undefined,
            backgroundSize: thankYouBackgroundType === 'pattern' ? '20px 20px' : undefined,
            backgroundPosition: thankYouBackgroundType === 'pattern' ? '0 0' : undefined,
            color: theme.textColor,
            transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
          }}
        >
          {/* Background color fallback */}
          {thankYouBackgroundType === 'color' && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: theme.backgroundColor,
              }}
            />
          )}

          {/* Background gradient */}
          {thankYouBackgroundType === 'gradient' && theme.backgroundGradient && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: getGradientBackground(theme.backgroundGradient),
                filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
              }}
            />
          )}

          {/* Background pattern */}
          {thankYouBackgroundType === 'pattern' && theme.backgroundPattern && theme.backgroundPattern !== 'none' && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: getPatternStyle(theme.backgroundPattern),
                backgroundSize: '20px 20px',
                opacity: 0.1,
                filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
              }}
            />
          )}

          {/* Background image con blur */}
          {thankYouBackgroundType === 'image' && theme.backgroundImage && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                backgroundPosition: theme.backgroundPosition || 'center',
                backgroundSize: theme.backgroundSize || 'cover',
                backgroundRepeat: theme.backgroundRepeat || 'no-repeat',
                backgroundAttachment: theme.backgroundAttachment || 'fixed',
                filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
              }}
            />
          )}

          {/* Overlay per opacità background */}
          {(thankYouBackgroundType === 'image' || thankYouBackgroundType === 'gradient' || thankYouBackgroundType === 'pattern') && (
            <>
              {/* Overlay opacità backgroundImage */}
              {thankYouBackgroundType === 'image' && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
                  }}
                />
              )}
              {/* Overlay colorato personalizzato */}
              {theme.backgroundOverlay && theme.backgroundOverlay.opacity > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundColor: theme.backgroundOverlay.color,
                    opacity: theme.backgroundOverlay.opacity,
                  }}
                />
              )}
            </>
          )}

          {/* Compact Response Summary */}
          <div
            className="relative z-10 mx-auto p-6 py-8"
            style={{
              maxWidth: theme.containerMaxWidth ? `${theme.containerMaxWidth}px` : '768px',
            }}
          >
            {/* Back Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/user/forms')}
              className="mb-4 hover:bg-white/10 transition-colors"
              style={{
                fontFamily: `"${theme.fontFamily}", sans-serif`,
                color: theme.textColor,
                fontSize: `${theme.optionFontSize || 16}px`,
                borderRadius: `${theme.borderRadius}px`,
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Dashboard
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
                transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
              }}
            >
              {/* Header */}
              <CardHeader className="pb-4 space-y-1">
                <CardTitle
                  className="text-xl font-bold flex items-center gap-2"
                  style={{
                    color: theme.primaryColor,
                    fontFamily: theme.headingFontFamily ? `"${theme.headingFontFamily}", sans-serif` : undefined,
                  }}
                >
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
                          transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
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
                              style={{
                                color: theme.textColor,
                                fontFamily: theme.headingFontFamily ? `"${theme.headingFontFamily}", sans-serif` : undefined,
                              }}
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
              {form.showResults && form.slug && (
                <div className="p-6 pt-4 border-t flex flex-col gap-3" style={{ borderColor: `${theme.primaryColor}15` }}>
                  <Button
                    onClick={() => {
                      navigate(`/user/responses/${form.slug}/${submittedResponse?.progressiveNumber || ''}`);
                    }}
                    size="lg"
                    className="w-full"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.buttonTextColor || '#ffffff',
                      borderRadius: `${theme.borderRadius}px`,
                      transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
                    }}
                  >
                    Visualizza Dettagli Completi
                  </Button>
                  <p className="text-center text-xs opacity-60" style={{ color: theme.textColor }}>
                    Conserva il numero di riferimento per eventuali comunicazioni future
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = form.questions[currentStep];
  const validQuestions = form.questions.filter(q => q.text && q.text.trim() !== '');
  
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

  // Determina il tipo di background
  const backgroundType = theme.backgroundType || (theme.backgroundImage ? 'image' : theme.backgroundGradient ? 'gradient' : theme.backgroundPattern && theme.backgroundPattern !== 'none' ? 'pattern' : 'color');

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center"
      style={{
        fontFamily: `"${theme.fontFamily}", sans-serif`,
        lineHeight: theme.lineHeight || undefined,
        letterSpacing: theme.letterSpacing !== undefined ? `${theme.letterSpacing}px` : undefined,
        backgroundColor: backgroundType === 'color' ? theme.backgroundColor : undefined,
        backgroundImage: backgroundType === 'gradient' ? getGradientBackground(theme.backgroundGradient) : 
                        backgroundType === 'pattern' ? getPatternStyle(theme.backgroundPattern || 'none') : undefined,
        backgroundSize: backgroundType === 'pattern' ? '20px 20px' : undefined,
        backgroundPosition: backgroundType === 'pattern' ? '0 0' : undefined,
        color: theme.textColor,
        transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
      }}
    >
      {/* Background color fallback */}
      {backgroundType === 'color' && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: theme.backgroundColor,
          }}
        />
      )}

      {/* Background gradient */}
      {backgroundType === 'gradient' && theme.backgroundGradient && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: getGradientBackground(theme.backgroundGradient),
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}

      {/* Background pattern */}
      {backgroundType === 'pattern' && theme.backgroundPattern && theme.backgroundPattern !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: getPatternStyle(theme.backgroundPattern),
            backgroundSize: '20px 20px',
            opacity: 0.1,
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}

      {/* Background image con blur */}
      {backgroundType === 'image' && theme.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url(${theme.backgroundImage})`,
            backgroundPosition: theme.backgroundPosition || 'center',
            backgroundSize: theme.backgroundSize || 'cover',
            backgroundRepeat: theme.backgroundRepeat || 'no-repeat',
            backgroundAttachment: theme.backgroundAttachment || 'fixed',
            filter: theme.backgroundBlur && theme.backgroundBlur > 0 ? `blur(${theme.backgroundBlur}px)` : undefined,
          }}
        />
      )}
      
      {/* Overlay per opacità background */}
      {(backgroundType === 'image' || backgroundType === 'gradient' || backgroundType === 'pattern') && (
        <>
          {/* Overlay opacità backgroundImage */}
          {backgroundType === 'image' && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
              }}
            />
          )}
          {/* Overlay colorato personalizzato */}
          {theme.backgroundOverlay && theme.backgroundOverlay.opacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: theme.backgroundOverlay.color,
                opacity: theme.backgroundOverlay.opacity,
              }}
            />
          )}
        </>
      )}
      
      {/* Header minimale integrato - Torna indietro + Progress */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
        {/* Link Torna indietro - angolo superiore sinistro, centrato verticalmente */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          style={{
            color: theme.textColor || '#1f2937',
          }}
        >
          &lt; indietro
        </button>
        
        {/* Contatore e Progress Bar centrati */}
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex flex-col items-center gap-2">
            {/* Contatore centrato */}
            <div 
              className="text-sm font-normal"
              style={{
                color: theme.textColor || '#1f2937',
              }}
            >
              {currentStep + 1} / {form.questions.length}
            </div>
            
            {/* Progress Bar semplice con glow */}
            <div className="relative h-[7px] w-full max-w-2xl rounded-full overflow-hidden"
              style={{
                backgroundColor: 'rgba(229, 231, 235, 0.6)',
              }}>
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  backgroundColor: theme.primaryColor || '#3b82f6',
                  boxShadow: `0 0 6px ${theme.primaryColor || '#3b82f6'}60`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / form.questions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative z-10 w-full mx-auto px-8 py-4 sm:px-10 sm:py-6 lg:px-16 lg:py-8 pt-24"
        style={{
          maxWidth: theme.containerMaxWidth ? `${theme.containerMaxWidth}px` : undefined,
        }}
      >
        {/* Header con logo e titolo - ESATTAMENTE COME FormCustomization.tsx */}
        <div 
          className="space-y-4" 
          style={{ 
            marginBottom: theme.sectionSpacing ? `${theme.sectionSpacing}px` : undefined,
          }}
        >
          {theme.logo && (
            <div className="mb-4 text-center sm:text-left">
              <img
                src={theme.logo}
                alt="Logo"
                className="w-auto object-contain mx-auto sm:mx-0"
                style={{ 
                  height: theme.logoSize ? `${(theme.logoSize / 100) * 64}px` : '64px'
                }}
              />
            </div>
          )}
        </div>

        {/* Domanda corrente - Layout ottimizzato e moderno */}
        {validQuestions.length > 0 && currentQuestion ? (
          <motion.div
            className="rounded-xl border w-full max-w-3xl mx-auto min-h-[280px] lg:min-h-[320px] flex flex-col"
            style={{
              padding: `${theme.cardPadding || 32}px`,
              backgroundColor: theme.questionBackgroundColor || '#ffffff',
              borderColor: theme.questionBorderColor || '#e5e7eb',
              borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '12px',
              borderWidth: theme.borderWidth ? `${theme.borderWidth}px` : '1px',
              borderStyle: theme.borderStyle || 'solid',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: theme.enableTransitions !== false ? 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={theme.hoverEffect ? {
              y: -2,
            } : {}}
          >
            {/* Domanda corrente con animazione */}
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentStep}
                custom={slideDirection}
                initial={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? '20%' : '-20%'
                }}
                animate={{ 
                  opacity: 1,
                  x: 0
                }}
                exit={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? '-20%' : '20%'
                }}
                transition={{ 
                  duration: theme.enableTransitions !== false ? (theme.animationSpeed === 'slow' ? 0.5 : theme.animationSpeed === 'fast' ? 0.15 : 0.3) : 0, 
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="flex-1 flex flex-col gap-6 justify-center"
              >
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
                    lineHeight: theme.lineHeight || 1.4,
                    letterSpacing: theme.letterSpacing ? `${theme.letterSpacing}px` : '-0.02em',
                    textShadow: theme.textShadow || 'none',
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
                  />
                )}

                {/* MULTIPLE_CHOICE */}
                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div style={{ marginTop: `${theme.optionSpacing || 12}px` }}>
                    {(() => {
                      const choices = Array.isArray(currentQuestion.options) ? currentQuestion.options : currentQuestion.options?.choices || [];
                      const isMultiple = currentQuestion.options?.multiple || false;
                      const maxSelections = currentQuestion.options && !Array.isArray(currentQuestion.options) 
                        ? currentQuestion.options.maxSelections 
                        : undefined;
                      
                      if (isMultiple) {
                        return (
                          <div className="flex flex-col gap-3 w-full">
                            {maxSelections && (
                              <div className="text-sm text-gray-500 mb-2">
                                Seleziona al massimo {maxSelections} {maxSelections === 1 ? 'opzione' : 'opzioni'}
                              </div>
                            )}
                            {choices.map((option: string, index: number) => {
                              const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                              const isSelected = currentAnswers.includes(option);
                              const isDisabled = !isSelected && maxSelections && currentAnswers.length >= maxSelections;
                              
                              return (
                                <motion.label
                                  key={index}
                                  htmlFor={`${currentQuestion.id}-${index}`}
                                  className={`flex items-center gap-4 p-4 rounded-lg transition-all border hover:shadow-sm ${
                                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                  }`}
                                  style={{
                                    borderWidth: `${theme.borderWidth || 1}px`,
                                    borderStyle: 'solid',
                                    borderColor: isSelected
                                      ? theme.primaryColor || '#3b82f6'
                                      : (theme.optionBorderColor || '#e5e7eb'),
                                    backgroundColor: isSelected
                                      ? theme.optionSelectedColor || `${theme.primaryColor || '#3b82f6'}15`
                                      : 'transparent',
                                    borderRadius: `${theme.borderRadius || 8}px`,
                                  }}
                                  whileHover={!isDisabled ? { 
                                    backgroundColor: isSelected
                                      ? theme.optionSelectedColor || `${theme.primaryColor || '#3b82f6'}20`
                                      : (theme.optionHoverColor || '#f9fafb'),
                                    borderColor: theme.primaryColor || '#3b82f6',
                                  } : {}}
                                  whileTap={!isDisabled ? { scale: 0.99 } : {}}
                                  onClick={(e) => {
                                    e.preventDefault();
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
                                      borderColor: theme.radioCheckColor || theme.primaryColor || '#3b82f6',
                                      accentColor: theme.radioCheckColor || theme.primaryColor || '#3b82f6',
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
                              );
                            })}
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
                  </div>
                )}

                {/* CHECKBOX */}
                {currentQuestion.type === 'CHECKBOX' && (
                  <div style={{ marginTop: `${theme.optionSpacing || 12}px` }}>
                    {(() => {
                      const choices = Array.isArray(currentQuestion.options) ? currentQuestion.options : currentQuestion.options?.choices || [];
                      return choices.map((option: string, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2 p-3 rounded transition-colors cursor-pointer"
                          style={{ 
                            marginBottom: `${theme.optionSpacing || 12}px`,
                            border: `${theme.borderWidth || 1}px solid ${theme.optionBorderColor || theme.accentColor}`,
                            borderRadius: `${theme.borderRadius}px`,
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
                        className="w-14 h-14 transition-all hover:scale-110 p-0"
                        onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
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
                          className="w-12 h-12 text-base font-semibold transition-all hover:scale-105"
                          onClick={() => handleAnswerChange(currentQuestion.id, rating.toString())}
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
                        style={{ borderRadius: `${theme.borderRadius}px` }}
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

                {/* RANKING */}
                {currentQuestion.type === 'RANKING' && (
                  <div>
                    <p className="text-sm mb-2" style={{ color: theme.textColor }}>
                      Ordina le opzioni dal più importante al meno importante
                    </p>
                    <div className="space-y-2">
                      {(rankingAnswers[currentQuestion.id] || (currentQuestion.options as string[])).map((option, index) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-3 p-3 bg-white border rounded-md hover:bg-gray-50 cursor-move"
                          style={{ borderRadius: `${theme.borderRadius}px` }}
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

                {/* BRANCHING */}
                {currentQuestion.type === 'BRANCHING' && (
                  <p className="text-sm text-gray-500">Domanda condizionale basata sulle risposte precedenti</p>
                )}
              </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottoni navigazione */}
            <div className="pt-5 mt-auto">
              <AnimatePresence mode="wait">
                {currentStep === 0 ? (
                  // Vista con solo Successiva
                  <motion.div
                    key="solo-successiva"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center items-center"
                  >
                    {(() => {
                      const lastVisibleQuestionIndex = visibleQuestions.length > 0 
                        ? form.questions.findIndex(q => q.id === visibleQuestions[visibleQuestions.length - 1])
                        : -1;
                      const isLastVisibleQuestion = currentStep === lastVisibleQuestionIndex && lastVisibleQuestionIndex !== -1;
                      
                      if (isLastVisibleQuestion) {
                        return (
                          <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-5 py-2.5 text-sm sm:text-base font-semibold transition-all"
                            style={{
                              fontFamily: `"${theme.fontFamily}", sans-serif`,
                              backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                              color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                              border: theme.buttonStyle === 'outlined' ? `${Math.min(theme.borderWidth || 2, 2)}px solid ${theme.primaryColor}` : 'none',
                              borderRadius: `${theme.borderRadius}px`,
                              fontWeight: '600',
                              fontSize: `${theme.optionFontSize || 16}px`,
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
                              fontFamily: `"${theme.fontFamily}", sans-serif`,
                              backgroundColor: isDisabled
                                ? (theme.disabledButtonColor || '#e5e7eb')
                                : (theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent'),
                              color: isDisabled
                                ? '#9ca3af'
                                : (theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor)),
                              border: theme.buttonStyle === 'outlined' ? `${Math.min(theme.borderWidth || 2, 2)}px solid ${theme.primaryColor}` : 'none',
                              borderRadius: `${theme.borderRadius}px`,
                              fontWeight: '600',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              fontSize: `${theme.optionFontSize || 16}px`,
                            }}
                          >
                            Successiva
                          </Button>
                        );
                      }
                    })()}
                  </motion.div>
                ) : (
                  // Vista con Precedente e Successiva
                  <motion.div
                    key="entrambi-bottoni"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center items-center gap-3"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="px-5 py-2.5 text-sm sm:text-base font-medium transition-all"
                      style={{
                        fontFamily: `"${theme.fontFamily}", sans-serif`,
                        backgroundColor: theme.navigationButtonBgColor || 'transparent',
                        color: theme.navigationButtonTextColor || theme.textColor,
                        border: `${Math.min(theme.borderWidth || 1, 2)}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
                        borderRadius: `${theme.borderRadius}px`,
                        cursor: 'pointer',
                        fontSize: `${theme.optionFontSize || 16}px`,
                      }}
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
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-5 py-2.5 text-sm sm:text-base font-semibold transition-all"
                            style={{
                              fontFamily: `"${theme.fontFamily}", sans-serif`,
                              backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                              color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                              border: theme.buttonStyle === 'outlined' ? `${Math.min(theme.borderWidth || 2, 2)}px solid ${theme.primaryColor}` : 'none',
                              borderRadius: `${theme.borderRadius}px`,
                              fontWeight: '600',
                              fontSize: `${theme.optionFontSize || 16}px`,
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
                              fontFamily: `"${theme.fontFamily}", sans-serif`,
                              backgroundColor: isDisabled
                                ? (theme.disabledButtonColor || '#e5e7eb')
                                : (theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent'),
                              color: isDisabled
                                ? '#9ca3af'
                                : (theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor)),
                              border: theme.buttonStyle === 'outlined' ? `${Math.min(theme.borderWidth || 2, 2)}px solid ${theme.primaryColor}` : 'none',
                              borderRadius: `${theme.borderRadius}px`,
                              fontWeight: '600',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              fontSize: `${theme.optionFontSize || 16}px`,
                            }}
                          >
                            Successiva
                          </Button>
                        );
                      }
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <div className="p-6 rounded-md border-2 border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-500 font-medium">Nessuna domanda disponibile</p>
          </div>
        )}
      </div>
    </div>
  );
}

