import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CalendarIcon, Upload, GripVertical, CheckCircle } from 'lucide-react';
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

export default function FormPreview({ form: initialForm }: { form: Form }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(initialForm);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | Date | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);
  const [submittedResponse, setSubmittedResponse] = useState<{ responseId: string; progressiveNumber: number } | null>(null);

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
        setSubmitted(true);
        setSubmittedResponse({
          responseId: result.responseId,
          progressiveNumber: result.progressiveNumber
        });
        toast.success('Risposte inviate con successo!');
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

  if (submitted) {
    return (
      <div 
        className="min-h-screen w-full relative"
        style={{
          fontFamily: `"${theme.fontFamily}", sans-serif`,
          backgroundColor: theme.backgroundColor,
          color: theme.textColor
        }}
      >
        <div className="max-w-4xl mx-auto p-6 py-12">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-4xl mb-3 font-bold" style={{ color: theme.primaryColor }}>
                ✅ Risposta Inviata con Successo!
              </CardTitle>
              <CardDescription className="text-lg">
                {form.thankYouMessage || 'Grazie per aver completato il questionario.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = form.questions[currentStep];
  const validQuestions = form.questions.filter(q => q.text && q.text.trim() !== '');

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
      
      <div 
        className="relative z-10 w-full mx-auto p-4 sm:p-6"
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
          <h2 
            className="text-xl sm:text-2xl font-bold text-center sm:text-left" 
            style={{ 
              color: theme.primaryColor,
              fontFamily: theme.headingFontFamily ? `"${theme.headingFontFamily}", sans-serif` : undefined,
              lineHeight: theme.lineHeight || undefined,
              letterSpacing: theme.letterSpacing !== undefined ? `${theme.letterSpacing}px` : undefined,
            }}
          >
            {form.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center sm:text-left" style={{ color: theme.textColor }}>
            {form.description}
          </p>
        </div>

        {/* Domanda corrente - STRUTTURA IDENTICA A FormCustomization.tsx righe 1633-1928 */}
        {validQuestions.length > 0 && currentQuestion ? (
          <div 
            className="min-h-[400px] flex flex-col"
            style={{ 
              gap: theme.questionSpacing ? `${theme.questionSpacing}px` : undefined,
              padding: `${theme.cardPadding || 24}px`,
              backgroundColor: theme.questionBackgroundColor || 'transparent',
              borderRadius: `${theme.borderRadius}px`,
              border: theme.questionBorderColor ? `${theme.borderWidth || 1}px ${theme.borderStyle || 'solid'} ${theme.questionBorderColor}` : 'none',
              borderStyle: theme.questionBorderColor ? (theme.borderStyle || 'solid') : undefined,
              boxShadow: theme.glowEffect?.enabled 
                ? `0 0 ${(theme.glowEffect.intensity || 50) / 5}px ${theme.glowEffect.color || theme.primaryColor}, 0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`
                : `0 ${theme.shadowIntensity || 2}px ${(theme.shadowIntensity || 2) * 4}px rgba(0,0,0,0.1)`,
              transition: theme.enableTransitions !== false ? `all ${getAnimationDuration(theme.animationSpeed)}` : undefined,
              transform: theme.hoverEffect && theme.hoverScale ? `scale(${theme.hoverScale})` : undefined,
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
                  <Input placeholder="Inserisci la tua risposta..." className="w-full" readOnly />
                )}

                {/* MULTIPLE_CHOICE */}
                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div style={{ marginTop: `${theme.optionSpacing || 12}px` }}>
                    {(() => {
                      const choices = Array.isArray(currentQuestion.options) ? currentQuestion.options : currentQuestion.options?.choices || [];
                      return choices.map((option: string, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center space-x-2 p-3 rounded transition-colors" 
                          style={{ 
                            marginBottom: `${theme.optionSpacing || 12}px`,
                            border: `${theme.borderWidth || 1}px solid ${theme.optionBorderColor || theme.accentColor}`,
                            borderRadius: `${theme.borderRadius}px`,
                            cursor: 'pointer'
                          }}
                        >
                          <input 
                            type="radio" 
                            name={`preview-${currentQuestion.id}`} 
                            className="w-5 h-5" 
                            style={{ accentColor: theme.radioCheckColor || theme.primaryColor }} 
                            readOnly 
                          />
                          <Label style={{ color: theme.optionTextColor || theme.textColor, fontSize: `${theme.optionFontSize || 16}px` }}>{option}</Label>
                        </div>
                      ));
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
                          className="flex items-center space-x-2 p-3 rounded transition-colors"
                          style={{ 
                            marginBottom: `${theme.optionSpacing || 12}px`,
                            border: `${theme.borderWidth || 1}px solid ${theme.optionBorderColor || theme.accentColor}`,
                            borderRadius: `${theme.borderRadius}px`,
                            cursor: 'pointer'
                          }}
                        >
                          <Checkbox disabled style={{ accentColor: theme.radioCheckColor || theme.primaryColor } as any} />
                          <Label style={{ color: theme.optionTextColor || theme.textColor, fontSize: `${theme.optionFontSize || 16}px` }}>{option}</Label>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* RATING */}
                {currentQuestion.type === 'RATING' && (
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button key={rating} type="button" variant="outline" className="w-12 h-12" style={{ borderRadius: `${theme.borderRadius}px` }}>
                        {rating}
                      </Button>
                    ))}
                  </div>
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
                          <Button key={index} type="button" variant="outline" className="h-12" style={{ borderRadius: `${theme.borderRadius}px` }}>
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
                        <Button key={rating} type="button" variant="outline" className="w-10 h-10" style={{ borderRadius: `${theme.borderRadius}px` }}>
                          {rating}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* DATE */}
                {currentQuestion.type === 'DATE' && (
                  <Input type="text" placeholder="Seleziona una data..." className="w-full" readOnly />
                )}

                {/* RANKING */}
                {currentQuestion.type === 'RANKING' && (
                  <div className="space-y-2">
                    {(currentQuestion.options as string[] || []).map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white border rounded-md" style={{ borderRadius: `${theme.borderRadius}px` }}>
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-sm">{index + 1}</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* FILE_UPLOAD */}
                {currentQuestion.type === 'FILE_UPLOAD' && (
                  <div className="border-2 border-dashed rounded-md p-6 text-center" style={{ borderRadius: `${theme.borderRadius}px` }}>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Trascina un file qui</p>
                    <Button type="button" variant="outline" className="mt-4" style={{ borderRadius: `${theme.borderRadius}px` }}>Seleziona file</Button>
                  </div>
                )}

                {/* BRANCHING */}
                {currentQuestion.type === 'BRANCHING' && (
                  <p className="text-sm text-gray-500">Domanda condizionale basata sulle risposte precedenti</p>
                )}
              </div>
            </div>

            {/* Bottoni navigazione */}
            <div className="flex justify-between items-center pt-6 border-t mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-2 transition-all"
                style={{
                  backgroundColor: currentStep === 0 
                    ? (theme.disabledButtonColor || '#e5e7eb')
                    : (theme.navigationButtonBgColor || 'transparent'),
                  color: currentStep === 0
                    ? '#9ca3af'
                    : (theme.navigationButtonTextColor || theme.textColor),
                  border: `${theme.borderWidth || 1}px solid ${theme.navigationButtonBorderColor || theme.primaryColor}`,
                  borderRadius: `${theme.borderRadius}px`,
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                }}
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
                Domanda {currentStep + 1} di {validQuestions.length}
              </div>
              {currentStep === validQuestions.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 transition-all" 
                  style={{ 
                    backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                    color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                    border: theme.buttonStyle === 'outlined' ? `${theme.borderWidth || 2}px solid ${theme.primaryColor}` : 'none',
                    borderRadius: `${theme.borderRadius}px`,
                    fontWeight: '600'
                  }}
                >
                  {submitting ? 'Invio in corso...' : 'Invia Risposte'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 transition-all"
                  style={{ 
                    backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                    color: theme.buttonTextColor || (theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor),
                    border: theme.buttonStyle === 'outlined' ? `${theme.borderWidth || 2}px solid ${theme.primaryColor}` : 'none',
                    borderRadius: `${theme.borderRadius}px`,
                    fontWeight: '600'
                  }}
                >
                  Successiva
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-md border-2 border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-500 font-medium">Nessuna domanda disponibile</p>
          </div>
        )}
      </div>
    </div>
  );
}

