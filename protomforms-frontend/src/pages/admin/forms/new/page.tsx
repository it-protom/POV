import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Save, ArrowLeft, Type, Check, FileText, Settings, Users, FileText as FileTextIcon, Palette, CalendarIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuestionBuilder } from '@/components/form-builder/QuestionBuilder';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QuestionFormData, QuestionType } from "@/types/question";
import { v4 as uuidv4 } from 'uuid';
import { FormCustomization, Theme } from '@/components/form-builder/FormCustomization';
import { FormCustomizationV2 } from '@/components/form-builder/customization';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn, authenticatedFetch } from '@/lib/utils';
import { FlowiseChat } from '@/components/FlowiseChat';

const steps = [
  { id: 'ai', title: 'Utilizza AI', icon: Sparkles, description: 'Genera con intelligenza artificiale' },
  { id: 'details', title: 'Dettagli Base', icon: FileText, description: 'Informazioni principali' },
  { id: 'questions', title: 'Domande', icon: Type, description: 'Aggiungi le domande' },
  { id: 'customization', title: 'Personalizzazione', icon: Palette, description: 'Personalizza l\'aspetto' },
  { id: 'settings', title: 'Impostazioni', icon: Settings, description: 'Configura il comportamento' }
];

export default function NewFormPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('ai');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'SURVEY' | 'QUIZ'>('SURVEY');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('Grazie per la tua risposta!');
  const [opensAt, setOpensAt] = useState<Date | undefined>(undefined);
  const [closesAt, setClosesAt] = useState<Date | undefined>(undefined);
  const [maxRepeats, setMaxRepeats] = useState<number | null>(1); // null = infinito, numero = quante volte può essere ripetuto
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

  const createNewQuestion = (type: QuestionType): QuestionFormData => {
    return {
      id: uuidv4(),
      type,
      text: '',
      required: false,
      options: type === QuestionType.MULTIPLE_CHOICE ? [''] : undefined
    };
  };

  const handleAddQuestion = (type: QuestionType) => {
    setQuestions(prev => [...prev, createNewQuestion(type)]);
  };

  // Gestisce i dati generati dall'AI e popola i campi del form
  const handleFormGenerated = (formData: any) => {
    console.log('Form generato dall\'AI:', formData);
    
    // Popola i campi base
    if (formData.title) {
      setTitle(formData.title);
    }
    
    if (formData.description) {
      setDescription(formData.description);
    }
    
    if (formData.type) {
      setType(formData.type as 'SURVEY' | 'QUIZ');
    }
    
    // Popola le impostazioni
    if (formData.isAnonymous !== undefined) {
      setIsAnonymous(formData.isAnonymous);
    }
    
    if (formData.allowEdit !== undefined) {
      setAllowEdit(formData.allowEdit);
    }
    
    if (formData.showResults !== undefined) {
      setShowResults(formData.showResults);
    }
    
    if (formData.thankYouMessage) {
      setThankYouMessage(formData.thankYouMessage);
    }
    
    // Converti e popola le domande
    if (formData.questions && Array.isArray(formData.questions)) {
      const convertedQuestions: QuestionFormData[] = formData.questions.map((q: any) => {
        // Converti le options in base al tipo
        let options: any = undefined;
        
        if (q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options)) {
          // MULTIPLE_CHOICE: options è un array di stringhe
          options = q.options;
        } else if ((q.type === 'RATING' || q.type === 'LIKERT' || q.type === 'NPS') && q.options) {
          // RATING/LIKERT/NPS: options è un oggetto con scale e labels
          options = q.options;
        } else if (q.type === 'TEXT') {
          // TEXT: options è null
          options = undefined;
        } else if (q.options) {
          // Fallback: mantieni le options come sono
          options = q.options;
        }
        
        return {
          id: uuidv4(),
          type: q.type as QuestionType,
          text: q.text || '',
          required: q.required || false,
          options: options,
        } as QuestionFormData;
      });
      
      setQuestions(convertedQuestions);
    }
    
    // Mostra un toast di successo
    toast.success('Form generato con successo! I campi sono stati popolati automaticamente.');
    
    // Passa automaticamente allo step "Dettagli Base" per mostrare i dati
    setCurrentStep('details');
  };

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
      const response = await authenticatedFetch('/api/forms', {
        method: 'POST',
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
          maxRepeats: maxRepeats === null || maxRepeats === 0 ? null : maxRepeats,
          questions: questions.map(q => ({
            text: q.text,
            type: q.type,
            required: q.required,
            options: q.options
          })),
          theme // Includi il tema nel submit
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const data = await response.json();
      toast.success('Form creato con successo!');
      navigate(`/admin/forms/${data.id}`);
    } catch (error) {
      console.error('Errore durante la creazione del form:', error);
      toast.error('Impossibile creare il form. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'ai':
        return true; // L'AI è opzionale
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
          <Link to="/admin/forms">
              <Button variant="ghost" size="sm" className="text-[#868789] hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Forms
            </Button>
          </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#868789] mb-2">
                  Crea Nuovo Form
                </h1>
                <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-4"></div>
                <p className="text-gray-600">
                  Crea un nuovo form in pochi semplici passaggi
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creando...' : 'Crea Form'}
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
                {steps.map((step, index) => {
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
            {currentStep === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#FFCD00]" />
                      Genera Form con AI
                    </CardTitle>
                    <CardDescription>
                      Utilizza l'intelligenza artificiale per generare automaticamente il tuo form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <Sparkles className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            Generazione Intelligente
                          </h3>
                          <p className="text-gray-600">
                            Chatta con l'AI per generare automaticamente il tuo form. Descrivi il tipo di form che vuoi creare e l'AI ti aiuterà a creare titolo, descrizione e domande pertinenti.
                          </p>
                        </div>
                      </div>
                      
                      <FlowiseChat 
                        chatflowid="b1d6d758-d8c4-4ac9-b023-5791c4939217"
                        onFormGenerated={handleFormGenerated}
                      />
                    </div>
                    
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Oppure continua con la creazione manuale
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

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
                      Inserisci le informazioni di base per il tuo nuovo form
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
                                // Permetti di selezionare anche oggi
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
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={() => handleAddQuestion(QuestionType.TEXT)}
                              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Aggiungi Prima Domanda
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>

                          
                          <QuestionBuilder
                            questions={questions}
                            onQuestionsChange={setQuestions}
                          />
                          
                          <Separator />
                          
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              onClick={() => handleAddQuestion(QuestionType.TEXT)}
                              variant="outline"
                              className="border-[#FFCD00] text-[#868789] hover:bg-[#FFCD00] hover:text-black"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Aggiungi Altra Domanda
                            </Button>
                          </div>
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
                  // Crea un nuovo tema partendo da quello corrente
                  const updatedTheme: Partial<Theme> = { ...theme };
                  
                  // Applica gli aggiornamenti, rimuovendo le proprietà esplicitamente settate a undefined
                  Object.keys(newTheme).forEach((key) => {
                    const value = (newTheme as any)[key];
                    if (value === undefined || value === null || (key === 'backgroundImage' && value === '')) {
                      // Rimuovi la proprietà se è undefined, null o stringa vuota (per backgroundImage)
                      delete updatedTheme[key as keyof Theme];
                    } else {
                      // Altrimenti aggiorna normalmente
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
                      
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-gray-900">Ripetibilità del Form</h4>
                        <div className="space-y-3">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <Label htmlFor="maxRepeats" className="font-medium mb-2 block">
                              Numero massimo di ripetizioni
                            </Label>
                            <p className="text-sm text-gray-500 mb-3">
                              Quante volte un utente può compilare questo form. Lascia vuoto o imposta 0 per permettere ripetizioni infinite.
                            </p>
                            <div className="flex items-center gap-3">
                              <Input
                                id="maxRepeats"
                                type="number"
                                min="0"
                                value={maxRepeats === null ? '' : maxRepeats}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || value === '0') {
                                    setMaxRepeats(null);
                                  } else {
                                    const num = parseInt(value, 10);
                                    if (!isNaN(num) && num > 0) {
                                      setMaxRepeats(num);
                                    }
                                  }
                                }}
                                placeholder="Infinito (0 o vuoto)"
                                className="max-w-xs"
                              />
                              <span className="text-sm text-gray-500">
                                {maxRepeats === null ? '(Infinito)' : `(Massimo ${maxRepeats} ${maxRepeats === 1 ? 'volta' : 'volte'})`}
                              </span>
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
            disabled={currentStep === 'ai'}
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
                  {isSubmitting ? 'Creando...' : 'Crea Form'}
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