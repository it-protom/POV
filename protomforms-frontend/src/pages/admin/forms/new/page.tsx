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
import { PlusCircle, Save, ArrowLeft, Type, Check, FileText, Settings, Users, Upload, FileText as FileTextIcon, Palette, CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuestionBuilder } from '@/components/form-builder/QuestionBuilder';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuestionFormData, QuestionType } from "@/types/question";
import { v4 as uuidv4 } from 'uuid';
import { FormCustomization, Theme } from '@/components/form-builder/FormCustomization';
import { FormCustomizationV2 } from '@/components/form-builder/customization';
import { authenticatedFetch } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const steps = [
  { id: 'details', title: 'Dettagli Base', icon: FileText, description: 'Informazioni principali' },
  { id: 'questions', title: 'Domande', icon: Type, description: 'Aggiungi le domande' },
  { id: 'customization', title: 'Personalizzazione', icon: Palette, description: 'Personalizza l\'aspetto' },
  { id: 'settings', title: 'Impostazioni', icon: Settings, description: 'Configura il comportamento' }
];

export default function NewFormPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('details');
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
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<QuestionFormData[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
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

  const handleImportDocx = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('Nessun file selezionato');
      return;
    }

    console.log('File selezionato:', file.name, file.size, file.type);
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Invio richiesta al server...');
      const response = await authenticatedFetch('/api/forms/parse-docx', {
        method: 'POST',
        body: formData,
      });

      console.log('Risposta ricevuta:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Errore server:', errorText);
        throw new Error(`Error parsing document: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dati ricevuti:', data);
      
      if (data.success && data.questions) {
        // Convert parsed questions to QuestionFormData format
        const importedQuestions: QuestionFormData[] = data.questions.map((q: any, index: number) => {
          let options = q.options;
          
          // Handle boolean questions (Yes/No) that might not have options
          if (q.type === QuestionType.MULTIPLE_CHOICE && (!options || options.length === 0)) {
            const text = q.text.toLowerCase();
            if (text.includes('sì/no') || text.includes('si/no') || text.includes('yes/no') ||
                text.includes('vero/falso') || text.includes('true/false') ||
                text.includes('raccomanderesti') || text.includes('would you recommend')) {
              options = ['Sì', 'No'];
            }
          }
          
          return {
            id: uuidv4(),
            type: q.type,
            text: q.text,
            required: q.required,
            options: options || undefined,
            order: index
          };
        });

        console.log('Domande processate:', importedQuestions);

        // Show preview instead of directly adding
        setImportPreview(importedQuestions);
        setShowImportPreview(true);
        toast.success(`✅ Trovate ${importedQuestions.length} domande nel documento! Apri l'anteprima per rivedere e modificare le domande prima di importarle.`, {
          duration: 5000,
          action: {
            label: 'Apri Anteprima',
            onClick: () => setShowImportPreview(true)
          }
        });
      } else {
        console.log('Nessuna domanda trovata nei dati:', data);
        toast.error('❌ Nessuna domanda trovata nel documento. Verifica che il file contenga domande nel formato corretto.');
      }
    } catch (error) {
      console.error('Error importing DOCX:', error);
      toast.error('Errore durante l importazione del documento');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
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
                      {/* Import Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <FileTextIcon className="h-6 w-6 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Importa da Documento</h4>
                        </div>
                        <p className="text-blue-700 text-sm mb-4">
                          Carica un file DOCX per importare automaticamente domande e risposte. 
                          Il sistema riconoscerà automaticamente il tipo di domanda e le opzioni di risposta.
                        </p>
                        <details className="text-blue-700 text-xs">
                          <summary className="cursor-pointer hover:text-blue-800 font-medium">
                            📋 Formato supportato per il documento
                          </summary>
                          <div className="mt-2 space-y-2 text-blue-600">
                            <p><strong>Domande:</strong> Inizia con numeri (1., 2.), lettere (A., B.) o parole chiave (Question, Domanda)</p>
                            <p><strong>Opzioni:</strong> Inizia con lettere (a., b., c.) o simboli (-, •, *)</p>
                            <p><strong>Tipi riconosciuti:</strong></p>
                            <ul className="ml-4 space-y-1">
                              <li>• <strong>Testo libero:</strong> Domande senza opzioni</li>
                              <li>• <strong>Scelta multipla:</strong> Domande con opzioni (a., b., c.)</li>
                              <li>• <strong>Rating:</strong> Contiene parole come "valuta", "1-5", "punteggio"</li>
                              <li>• <strong>Sì/No:</strong> Contiene "sì/no", "vero/falso"</li>
                            </ul>
                          </div>
                        </details>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept=".docx"
                              onChange={handleImportDocx}
                              className="hidden"
                              id="docx-import-main"
                              disabled={isImporting}
                            />
                            <label htmlFor="docx-import-main">
                              <Button
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                                disabled={isImporting}
                                onClick={() => {
                                  const fileInput = document.getElementById('docx-import-main') as HTMLInputElement;
                                  if (fileInput) {
                                    fileInput.click();
                                  }
                                }}
                              >
                                {isImporting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    Analizzando documento...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Carica DOCX
                                  </>
                                )}
                              </Button>
                            </label>
                            <div className="flex flex-col">
                              <span className="text-xs text-blue-600">
                                Supporta: .docx
                              </span>
                              {isImporting && (
                                <span className="text-xs text-blue-500 animate-pulse">
                                  ⏳ Elaborazione in corso...
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Show preview button if there are imported questions */}
                          {importPreview.length > 0 && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <p className="text-green-700 text-sm font-medium">
                                    ✅ {importPreview.length} domande pronte per l'importazione
                                  </p>
                                </div>
                                <Button
                                  onClick={() => setShowImportPreview(true)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  <FileTextIcon className="mr-2 h-4 w-4" />
                                  Rivedi e Modifica
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {questions.length === 0 ? (
                        <div className="text-center py-12">
                          <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nessuna domanda ancora
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Inizia aggiungendo la tua prima domanda o importa da un documento
                          </p>
                          <div className="flex gap-3 justify-center">
                            <input
                              type="file"
                              accept=".docx"
                              onChange={handleImportDocx}
                              className="hidden"
                              id="docx-import-empty"
                              disabled={isImporting}
                            />
                            <Button
                              onClick={() => handleAddQuestion(QuestionType.TEXT)}
                              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Aggiungi Prima Domanda
                            </Button>
                            <label htmlFor="docx-import-empty">
                              <Button
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                                disabled={isImporting}
                                onClick={() => {
                                  const fileInput = document.getElementById('docx-import-empty') as HTMLInputElement;
                                  if (fileInput) {
                                    fileInput.click();
                                  }
                                }}
                              >
                                {isImporting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    Analizzando documento...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importa da DOCX
                                  </>
                                )}
                              </Button>
                            </label>
                          </div>
                          
                          {/* Show preview button if there are imported questions */}
                          {importPreview.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-blue-700 text-sm mb-3">
                                ✅ Hai {importPreview.length} domande pronte per l'importazione!
                              </p>
                              <Button
                                onClick={() => setShowImportPreview(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                Rivedi e Modifica Domande
                              </Button>
                            </div>
                          )}
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
                onThemeChange={setTheme}
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

        {/* Import Preview Modal */}
        <Dialog open={showImportPreview} onOpenChange={setShowImportPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-blue-600" />
                Anteprima e Modifica Domande Importate
              </DialogTitle>
              <DialogDescription>
                Rivedi e modifica le domande trovate nel documento prima di importarle nel form
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {importPreview.map((question, index) => (
                <div key={index} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {question.type}
                      </Badge>
                      {question.required && (
                        <Badge variant="destructive" className="text-xs">
                          Obbligatoria
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Domanda #{index + 1}</span>
                  </div>
                  
                  {/* Question Text Editor */}
                  <div className="space-y-3 mb-4">
                    <Label htmlFor={`question-text-${index}`} className="text-sm font-medium text-gray-700">
                      Testo della domanda:
                    </Label>
                    <Textarea
                      id={`question-text-${index}`}
                      value={question.text}
                      onChange={(e) => {
                        const updatedPreview = [...importPreview];
                        updatedPreview[index].text = e.target.value;
                        setImportPreview(updatedPreview);
                      }}
                      placeholder="Inserisci il testo della domanda..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  {/* Question Type Selector */}
                  <div className="space-y-3 mb-4">
                    <Label htmlFor={`question-type-${index}`} className="text-sm font-medium text-gray-700">
                      Tipo di domanda:
                    </Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => {
                        const updatedPreview = [...importPreview];
                        updatedPreview[index].type = value as QuestionType;
                        // Reset options if changing to TEXT type
                        if (value === QuestionType.TEXT) {
                          updatedPreview[index].options = undefined;
                        } else if (value === QuestionType.MULTIPLE_CHOICE && !updatedPreview[index].options) {
                          updatedPreview[index].options = ['Opzione 1'];
                        }
                        setImportPreview(updatedPreview);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={QuestionType.TEXT}>Testo libero</SelectItem>
                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Scelta multipla</SelectItem>
                        <SelectItem value={QuestionType.RATING}>Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options Editor for Multiple Choice */}
                  {question.type === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-3 mb-4">
                      <Label className="text-sm font-medium text-gray-700">
                        Opzioni di risposta:
                      </Label>
                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const updatedPreview = [...importPreview];
                                if (updatedPreview[index].options) {
                                  updatedPreview[index].options![optIndex] = e.target.value;
                                  setImportPreview(updatedPreview);
                                }
                              }}
                              placeholder={`Opzione ${optIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedPreview = [...importPreview];
                                if (updatedPreview[index].options && updatedPreview[index].options!.length > 1) {
                                  updatedPreview[index].options!.splice(optIndex, 1);
                                  setImportPreview(updatedPreview);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedPreview = [...importPreview];
                            if (!updatedPreview[index].options) {
                              updatedPreview[index].options = [];
                            }
                            updatedPreview[index].options!.push(`Opzione ${(updatedPreview[index].options?.length || 0) + 1}`);
                            setImportPreview(updatedPreview);
                          }}
                          className="w-full"
                        >
                          + Aggiungi Opzione
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`required-${index}`} className="text-sm font-medium text-gray-700">
                        Domanda obbligatoria
                      </Label>
                      <p className="text-xs text-gray-500">
                        I rispondenti dovranno rispondere a questa domanda
                      </p>
                    </div>
                    <Switch
                      id={`required-${index}`}
                      checked={question.required}
                      onCheckedChange={(checked) => {
                        const updatedPreview = [...importPreview];
                        updatedPreview[index].required = checked;
                        setImportPreview(updatedPreview);
                      }}
                    />
                  </div>

                  {/* Delete Question Button */}
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedPreview = importPreview.filter((_, i) => i !== index);
                        setImportPreview(updatedPreview);
                        if (updatedPreview.length === 0) {
                          setShowImportPreview(false);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 w-full"
                    >
                      Elimina questa domanda
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex gap-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportPreview(false);
                  setImportPreview([]);
                }}
              >
                Annulla
              </Button>
              <Button
                onClick={() => {
                  setQuestions(prev => [...prev, ...importPreview]);
                  setShowImportPreview(false);
                  setImportPreview([]);
                  toast.success(`Importate ${importPreview.length} domande nel form`);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={importPreview.length === 0}
              >
                Importa {importPreview.length} Domande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
    </div>
  );
}