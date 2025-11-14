import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, ArrowLeft, Type, Check, FileText, Settings, Users, Palette, CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuestionBuilder } from '@/components/form-builder/QuestionBuilder';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QuestionFormData, QuestionType } from "@/types/question";
import { FormCustomizationV2 } from '@/components/form-builder/customization';
import { Theme } from '@/components/form-builder/FormCustomization';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn, authenticatedFetch } from '@/lib/utils';

const steps = [
  { id: 'details', title: 'Dettagli Base', icon: FileText, description: 'Informazioni principali' },
  { id: 'questions', title: 'Domande', icon: Type, description: 'Aggiungi le domande' },
  { id: 'customization', title: 'Personalizzazione', icon: Palette, description: 'Personalizza l\'aspetto' },
  { id: 'settings', title: 'Impostazioni', icon: Settings, description: 'Configura il comportamento' }
];

interface FormData {
  id: string;
  title: string;
  description?: string;
  type: 'SURVEY' | 'QUIZ';
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  opensAt?: string;
  closesAt?: string;
  theme?: Theme | null;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    required: boolean;
    options?: any;
    order: number;
  }>;
}

export default function EditFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'SURVEY' | 'QUIZ'>('SURVEY');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('Grazie per la tua risposta!');
  const [opensAt, setOpensAt] = useState<Date | undefined>(undefined);
  const [closesAt, setClosesAt] = useState<Date | undefined>(undefined);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme>({
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: 8,
    buttonStyle: 'filled',
    textColor: '#000000',
    accentColor: '#000000',
    headerImage: '',
    logo: '',
    backgroundImage: '',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    backgroundOpacity: 100
  });

  // Carica il form esistente
  useEffect(() => {
    const fetchForm = async () => {
      if (!params.id) return;
      
      try {
        setIsLoading(true);
        const response = await authenticatedFetch(`/api/forms/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Errore durante il caricamento del form');
        }
        
        const data: FormData = await response.json();
        
        // Mappa i dati del form agli stati locali
        setTitle(data.title || '');
        setDescription(data.description || '');
        setType(data.type || 'SURVEY');
        setIsAnonymous(data.isAnonymous || false);
        setAllowEdit(data.allowEdit || false);
        setShowResults(data.showResults || false);
        setThankYouMessage(data.thankYouMessage || 'Grazie per la tua risposta!');
        
        // Converti le date
        if (data.opensAt) {
          setOpensAt(new Date(data.opensAt));
        }
        if (data.closesAt) {
          setClosesAt(new Date(data.closesAt));
        }
        
        // Mappa il tema
        if (data.theme) {
          setTheme({
            primaryColor: data.theme.primaryColor || '#000000',
            backgroundColor: data.theme.backgroundColor || '#ffffff',
            fontFamily: data.theme.fontFamily || 'Inter',
            borderRadius: data.theme.borderRadius || 8,
            buttonStyle: data.theme.buttonStyle || 'filled',
            textColor: data.theme.textColor || '#000000',
            accentColor: data.theme.accentColor || '#000000',
            headerImage: data.theme.headerImage || '',
            logo: data.theme.logo || '',
            backgroundImage: data.theme.backgroundImage || '',
            backgroundPosition: data.theme.backgroundPosition || 'center',
            backgroundSize: data.theme.backgroundSize || 'cover',
            backgroundAttachment: data.theme.backgroundAttachment || 'fixed',
            backgroundRepeat: data.theme.backgroundRepeat || 'no-repeat',
            backgroundOpacity: data.theme.backgroundOpacity || 100
          });
        }
        
        // Mappa le domande mantenendo gli ID esistenti
        if (data.questions && Array.isArray(data.questions)) {
          const mappedQuestions: QuestionFormData[] = data.questions
            .sort((a, b) => a.order - b.order) // Ordina per order
            .map((q) => {
              // Gestisci le options in base al tipo
              let options: any = undefined;
              
              if (q.options) {
                // Se options è una stringa JSON, parsala
                if (typeof q.options === 'string') {
                  try {
                    options = JSON.parse(q.options);
                  } catch (e) {
                    options = q.options;
                  }
                } else {
                  options = q.options;
                }
                
                // Per MULTIPLE_CHOICE, assicurati che sia un array
                if (q.type === 'MULTIPLE_CHOICE' && !Array.isArray(options)) {
                  options = undefined;
                }
              }
              
              return {
                id: q.id, // Mantieni l'ID originale
                type: q.type as QuestionType,
                text: q.text || '',
                required: q.required || false,
                options: options
              } as QuestionFormData;
            });
          
          setQuestions(mappedQuestions);
        }
      } catch (error) {
        console.error('Errore durante il caricamento del form:', error);
        toast.error('Impossibile caricare il form. Riprova.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Il titolo del form è obbligatorio');
      return;
    }
    
    if (questions.length === 0) {
      toast.error('Aggiungi almeno una domanda');
      return;
    }
    
    // Validazione date
    if (opensAt && closesAt && opensAt > closesAt) {
      toast.error('La data di apertura deve essere precedente alla data di chiusura');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch(`/api/forms/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          type,
          isAnonymous,
          allowEdit,
          showResults,
          thankYouMessage,
          opensAt: opensAt?.toISOString(),
          closesAt: closesAt?.toISOString(),
          questions: questions.map(q => ({
            id: q.id, // Includi l'ID per aggiornare le domande esistenti
            text: q.text,
            type: q.type,
            required: q.required,
            options: q.options
          })),
          theme
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update form');
      }

      toast.success('Form aggiornato con successo!');
      navigate(`/admin/forms/${params.id}`);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del form:', error);
      toast.error('Impossibile aggiornare il form. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'details':
        return title.trim().length > 0;
      case 'questions':
        return questions.length > 0 && questions.every(q => q.text.trim().length > 0);
      case 'customization':
        return true; // La personalizzazione è opzionale
      case 'settings':
        return true;
      default:
        return false;
    }
  };

  const getStepStatus = (stepId: string) => {
    if (stepId === currentStep) return 'current';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#868789] mb-2">
                  Modifica Form
                </h1>
                <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-4"></div>
                <p className="text-gray-600">
                  Modifica il form in pochi semplici passaggi
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Salvando...' : 'Salva Modifiche'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  const isCurrent = step.id === currentStep;
                  
                  return (
                    <div key={step.id} className="flex-1 flex">
                      <div 
                        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 w-full h-full min-h-[100px] ${
                          isCurrent 
                            ? 'bg-[#FFCD00]/10 border-2 border-[#FFCD00]' 
                            : status === 'completed'
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setCurrentStep(step.id)}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-[#FFCD00] text-black' 
                            : status === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {status === 'completed' ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <step.icon className="h-5 w-5" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium text-sm ${
                              isCurrent ? 'text-[#868789]' : 'text-gray-600'
                            }`}>
                              {step.title}
                            </h3>
                            {status === 'completed' && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                Completato
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#FFCD00]" />
                      Dettagli del Form
                    </CardTitle>
                    <CardDescription>
                      Modifica le informazioni di base del form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          Titolo del Form *
                        </Label>
                        <Input 
                          id="title" 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          placeholder="Es: Sondaggio Soddisfazione Cliente" 
                          className="h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium">
                          Tipo di Form
                        </Label>
                        <Select 
                          value={type} 
                          onValueChange={(value) => setType(value as 'SURVEY' | 'QUIZ')}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SURVEY">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Sondaggio
                              </div>
                            </SelectItem>
                            <SelectItem value="QUIZ">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                Quiz
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                      
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Descrizione
                      </Label>
                      <Textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Descrivi brevemente lo scopo del form..." 
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="thankYouMessage" className="text-sm font-medium">
                        Messaggio di Ringraziamento
                      </Label>
                      <Textarea 
                        id="thankYouMessage" 
                        value={thankYouMessage} 
                        onChange={(e) => setThankYouMessage(e.target.value)} 
                        placeholder="Messaggio mostrato dopo l'invio del form" 
                        rows={2}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="opensAt" className="text-sm font-medium">
                          Data di Apertura
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-12",
                                !opensAt && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {opensAt ? format(opensAt, "PPP", { locale: it }) : "Seleziona data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
                            <Calendar
                              mode="single"
                              selected={opensAt}
                              onSelect={setOpensAt}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const dateToCheck = new Date(date);
                                dateToCheck.setHours(0, 0, 0, 0);
                                return dateToCheck < today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500">
                          Data e ora di apertura del form
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="closesAt" className="text-sm font-medium">
                          Data di Chiusura
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-12",
                                !closesAt && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {closesAt ? format(closesAt, "PPP", { locale: it }) : "Seleziona data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
                            <Calendar
                              mode="single"
                              selected={closesAt}
                              onSelect={setClosesAt}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500">
                          Data e ora di chiusura del form
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5 text-[#FFCD00]" />
                      Domande del Form
                      {questions.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                          {questions.length} domande
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {questions.length > 0 
                        ? `Gestisci le ${questions.length} domande del tuo form`
                        : 'Aggiungi e gestisci le domande del tuo form'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {questions.length === 0 ? (
                        <div className="text-center py-12">
                          <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nessuna domanda ancora
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Inizia aggiungendo la tua prima domanda
                          </p>
                        </div>
                      ) : (
                        <>
                          <QuestionBuilder
                            questions={questions}
                            onQuestionsChange={setQuestions}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 'customization' && (
              <FormCustomizationV2
                initialTheme={theme}
                onThemeChange={(newTheme) => {
                  const updatedTheme: Partial<Theme> = { ...theme };
                  
                  Object.keys(newTheme).forEach((key) => {
                    const value = (newTheme as any)[key];
                    if (value === undefined || value === null || (key === 'backgroundImage' && value === '')) {
                      delete updatedTheme[key as keyof Theme];
                    } else {
                      (updatedTheme as any)[key] = value;
                    }
                  });
                  
                  setTheme(updatedTheme as Theme);
                }}
                formTitle={title}
                formDescription={description}
                questions={questions}
              />
            )}

            {currentStep === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-[#FFCD00]" />
                      Impostazioni del Form
                    </CardTitle>
                    <CardDescription>
                      Configura il comportamento e le opzioni del form
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Privacy e Anonimato</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label htmlFor="isAnonymous" className="font-medium">
                                  Risposte Anonime
                                </Label>
                                <p className="text-sm text-gray-500">
                                  I rispondenti non dovranno identificarsi
                                </p>
                              </div>
                              <Switch 
                                id="isAnonymous" 
                                checked={isAnonymous} 
                                onCheckedChange={setIsAnonymous} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Opzioni di Risposta</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label htmlFor="allowEdit" className="font-medium">
                                  Modifica Risposte
                                </Label>
                                <p className="text-sm text-gray-500">
                                  I rispondenti possono modificare le loro risposte
                                </p>
                              </div>
                              <Switch 
                                id="allowEdit" 
                                checked={allowEdit} 
                                onCheckedChange={setAllowEdit} 
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label htmlFor="showResults" className="font-medium">
                                  Mostra Risultati
                                </Label>
                                <p className="text-sm text-gray-500">
                                  I rispondenti vedono i risultati dopo l'invio
                                </p>
                              </div>
                              <Switch 
                                id="showResults" 
                                checked={showResults} 
                                onCheckedChange={setShowResults} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-between"
        >
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1].id);
              }
            }}
            disabled={currentStep === 'details'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Precedente
          </Button>
          
          {(() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            const isLastStep = currentIndex === steps.length - 1;
            
            if (isLastStep) {
              return (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                >
                  {isSubmitting ? 'Salvando...' : 'Salva Modifiche'}
                </Button>
              );
            } else {
              return (
                <Button
                  onClick={() => {
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1].id);
                    }
                  }}
                  disabled={!canProceed()}
                  className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                >
                  Successivo
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              );
            }
          })()}
        </motion.div>
      </div>
    </div>
  );
}
