import React from 'react';
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Eye, EyeOff, Smartphone, Monitor, Tablet, X, CalendarIcon, Upload, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Tipi per le domande
type QuestionType = "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "DATE" | "RANKING" | "LIKERT" | "FILE_UPLOAD" | "NPS" | "BRANCHING" | "CHECKBOX";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: any;
  order: number;
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
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
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

export default function PreviewFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showAnswers, setShowAnswers] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buttonPosition, setButtonPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState<string[]>([]);

  // Carica i dati del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${params.id}/public?preview=true`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [params.id]);

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

  // Initialize visible questions
  useEffect(() => {
    if (form && form.questions.length > 0) {
      setVisibleQuestions([form.questions[0].id]);
    }
  }, [form]);

  // Update visible questions when responses change
  useEffect(() => {
    if (!form) return;
    
    const newVisibleQuestions: string[] = [];
    
    // Always include the first question
    if (form.questions.length > 0) {
      newVisibleQuestions.push(form.questions[0].id);
    }
    
    // Check each question's conditions
    form.questions.forEach((question, index) => {
      if (index === 0) return; // Skip the first question
      
      // If the question has conditions, check them
      if (question.conditions && question.conditions.length > 0) {
        const shouldShow = question.conditions.every(condition => {
          const answer = responses[condition.questionId];
          
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
  }, [responses, form]);

  // Gestione del drag del bottone
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Controlla se il mouse si è mosso abbastanza per considerarlo un drag
        const moved = Math.abs(e.clientX - startPosition.x) > 3 || Math.abs(e.clientY - startPosition.y) > 3;
        if (moved) {
          setHasMoved(true);
        }
        
        setButtonPosition({
          x: Math.max(0, Math.min(newX, window.innerWidth - 40)),
          y: Math.max(0, Math.min(newY, window.innerHeight - 40)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset hasMoved dopo un piccolo delay per permettere al click di verificare
      setTimeout(() => setHasMoved(false), 0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, startPosition]);

  // Aggiorna la posizione quando la finestra viene ridimensionata
  useEffect(() => {
    const handleResize = () => {
      setButtonPosition(prev => ({
        ...prev,
        y: Math.min(prev.y, window.innerHeight - 80),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartPosition({ x: e.clientX, y: e.clientY });
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  // Gestisce il cambio di risposta
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Function to move an item in an array
  const moveItem = (array: string[], fromIndex: number, toIndex: number) => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  const nextStep = () => {
    if (!form) return;
    
    if (currentStep < form.questions.length - 1) {
      let nextQuestionIndex = currentStep + 1;
      
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
      let prevQuestionIndex = currentStep - 1;
      
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

  const handleRankingChange = (questionId: string, options: string[]) => {
    handleResponseChange(questionId, options);
  };

  // Renderizza il componente appropriato per il tipo di domanda - identico alla pagina pubblica
  const renderQuestionInput = (question: Question, onEnter?: () => void) => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        const choices = Array.isArray(question.options) 
          ? question.options 
          : question.options?.choices || [];
        const isMultiple = question.options?.multiple || false;
        
        if (isMultiple) {
          return (
            <div className="space-y-3">
              {choices.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={(responses[question.id] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentAnswers = (responses[question.id] || []) || [];
                      handleResponseChange(
                        question.id,
                        checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter((a: string) => a !== option)
                      );
                    }}
                  />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => handleResponseChange(question.id, value)}
              required={question.required}
              className="space-y-3"
            >
              {choices.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        }
      case "LIKERT":
        const scale = question.options?.scale || 5;
        const labels = question.options?.labels || [];
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
                    variant={responses[question.id] === (labels[index] || (index + 1).toString()) ? 'default' : 'outline'}
                    onClick={() => handleResponseChange(question.id, labels[index] || (index + 1).toString())}
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
      case "TEXT":
        return (
          <Input
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault();
                onEnter();
              }
            }}
            required={question.required}
            placeholder="Inserisci la tua risposta..."
            className="w-full"
          />
        );
      case "RATING":
        return (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant={responses[question.id] === rating.toString() ? 'default' : 'outline'}
                onClick={() => handleResponseChange(question.id, rating.toString())}
                className="w-12 h-12"
              >
                {rating}
              </Button>
            ))}
          </div>
        );
      case "CHECKBOX":
        const checkboxOptions = Array.isArray(question.options) 
          ? question.options 
          : question.options?.choices || [];
        return (
          <div className="space-y-3">
            {checkboxOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(responses[question.id] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentAnswers = (responses[question.id] || []) || [];
                    handleResponseChange(
                      question.id,
                      checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter((a: string) => a !== option)
                    );
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </div>
        );
      case "DATE":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !responses[question.id] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {responses[question.id] ? (
                  format(responses[question.id] as Date, "PPP", { locale: it })
                ) : (
                  <span>Seleziona una data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
              <Calendar
                mode="single"
                selected={responses[question.id] as Date || undefined}
                onSelect={(date) => date && handleResponseChange(question.id, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case "RANKING":
        if (!question.options) return null;
        const rankingOptions = Array.isArray(question.options) ? question.options : question.options.choices || [];
        return (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Ordina le opzioni dal più importante al meno importante
            </p>
            <div className="space-y-2">
              {(responses[question.id] || rankingOptions).map((option: string, index: number) => (
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
                      const currentOptions = (responses[question.id] as string[]) || [...rankingOptions];
                      const newOptions = moveItem(currentOptions, fromIndex, toIndex);
                      handleRankingChange(question.id, newOptions);
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
        );
      case "NPS":
        return (
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
                  variant={responses[question.id] === rating.toString() ? 'default' : 'outline'}
                  onClick={() => handleResponseChange(question.id, rating.toString())}
                  className="w-10 h-10"
                >
                  {rating}
                </Button>
              ))}
            </div>
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Trascina un file qui o clicca per selezionare
            </p>
            <input
              type="file"
              className="hidden"
              id={`file-${question.id}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleResponseChange(question.id, file.name);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById(`file-${question.id}`)?.click()}
            >
              Seleziona file
            </Button>
            {responses[question.id] && (
              <p className="mt-2 text-sm text-green-600">
                File selezionato: {String(responses[question.id])}
              </p>
            )}
          </div>
        );
      case "BRANCHING":
        return (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Questa domanda determina il flusso del questionario in base alle tue risposte precedenti.
            </p>
            <p className="text-sm font-medium">
              Rispondi alle domande precedenti per vedere le domande successive.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper per ottenere lo stile del bottone - identico alla pagina pubblica
  const getButtonStyle = (variant: 'primary' | 'outline' = 'primary') => {
    const theme = form?.theme || {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: '#000000',
      fontFamily: 'Inter',
      borderRadius: 8,
      buttonStyle: 'filled' as const
    };

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
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600">Form not found</p>
        </div>
      </div>
    );
  }

  const theme = form.theme || {
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#000000',
    fontFamily: 'Inter',
    borderRadius: 8,
    buttonStyle: 'filled' as const
  };

  if (!form || form.questions.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-red-600">Form senza domande</p>
        </div>
      </div>
    );
  }

  const currentQuestion = form.questions[currentStep] || form.questions[0];
  const progress = ((currentStep + 1) / form.questions.length) * 100;

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
      {/* Controlli Preview - Overlay fisso */}
      {showControls && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Preview Controls</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowControls(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
                className="h-8 text-xs"
              >
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </Button>
              <Button
                variant={previewMode === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("tablet")}
                className="h-8 text-xs"
              >
                <Tablet className="h-3 w-3 mr-1" />
                Tablet
              </Button>
              <Button
                variant={previewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
                className="h-8 text-xs"
              >
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className="h-8 text-xs"
            >
              {showAnswers ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </Button>
            <Link to={`/admin/forms/${params.id}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs w-full">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to Form
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottone per mostrare controlli se nascosti - draggable */}
      {!showControls && (
        <Button
          variant="default"
          size="icon"
          className="fixed z-50 h-10 w-10 rounded-full shadow-lg cursor-move"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            // Previene il click quando si è fatto drag
            setTimeout(() => {
              if (!hasMoved && !isDragging) {
                setShowControls(true);
              }
            }, 0);
          }}
        >
          <Eye className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay per opacità background - identico alla pagina pubblica */}
      {theme.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${1 - ((theme.backgroundOpacity || 100) / 100)})`,
          }}
        />
      )}
      
      {/* Container principale */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className={`relative z-10 min-h-screen flex flex-col mx-auto transition-all duration-300 ${
          previewMode === "desktop" ? "w-full max-w-7xl" :
          previewMode === "tablet" ? "w-full max-w-4xl" :
          "w-full max-w-md"
        }`}>
          <Card 
            className="flex-1 flex flex-col m-0 border-0 shadow-none rounded-none"
            style={{
              backgroundColor: theme.backgroundColor,
              borderRadius: '0',
              backdropFilter: theme.backgroundImage ? 'blur(0.5px)' : undefined,
            }}
          >
            <CardHeader className="px-6 py-8">
              {/* Header Image - identico alla pagina pubblica */}
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
              {/* Logo - identico alla pagina pubblica */}
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
                className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                  }
                }}
              >
                {showProgress ? (
                  <div className="space-y-4 mb-6">
                    {form.questions.map((q, index) => (
                      <div 
                        key={q.id} 
                        className={cn(
                          "p-4 rounded-md cursor-pointer transition-colors",
                          index === currentStep ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50",
                          responses[q.id] ? "border-l-4 border-green-500" : "border-l-4 border-gray-200"
                        )}
                        onClick={() => setCurrentStep(index)}
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 mr-3">
                            {index + 1}
                          </span>
                          <span className="font-medium text-lg">{q.text}</span>
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                          {responses[q.id] && (
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
                        {showAnswers && (
                          <span className={cn(
                            "ml-4 text-sm font-normal",
                            responses[currentQuestion.id] ? "text-green-600" : "text-gray-400"
                          )}>
                            {responses[currentQuestion.id] ? "✓ Risposto" : "Non risposto"}
                          </span>
                        )}
                      </Label>
                    </div>

                    <div className="pl-11">
                      {renderQuestionInput(currentQuestion, () => {
                        if (currentStep < form.questions.length - 1) {
                          nextStep();
                        }
                      })}
                    </div>
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
                  
                  {currentStep < form.questions.length - 1 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={currentQuestion.required && !responses[currentQuestion.id]}
                      style={getButtonStyle('primary')}
                      className="px-6 py-2"
                    >
                      Successiva
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      style={getButtonStyle('primary')}
                      className="px-6 py-2"
                    >
                      Ultima domanda
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
