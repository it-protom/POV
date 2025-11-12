import React from 'react';
"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Save, Eye, Copy, Palette, Type, Layout, FileText, CheckCircle, Clock, AlertCircle, CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { FormCustomization, Theme } from '@/components/form-builder/FormCustomization';
import { FormCustomizationV2 } from '@/components/form-builder/customization';
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { authenticatedFetch } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Tipi per le domande
type QuestionType = "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "DATE" | "RANKING" | "LIKERT" | "FILE_UPLOAD" | "NPS" | "BRANCHING";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
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
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  questions: Question[];
  opensAt?: Date | null;
  closesAt?: Date | null;
  theme?: Theme;
  status: string;
}

const statusConfig = {
  published: { label: "Pubblicato", color: "bg-green-100 text-green-800", icon: CheckCircle },
  draft: { label: "Bozza", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  archived: { label: "Archiviato", color: "bg-gray-100 text-gray-800", icon: AlertCircle }
};

export default function EditFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SURVEY' as 'SURVEY' | 'QUIZ'
  });
  
  // Stati per la modifica delle domande
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(0);
  const [newOption, setNewOption] = useState('');
  
  // Stati per l'aggiunta di nuove domande
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    text: '',
    type: 'TEXT' as QuestionType,
    required: false,
    options: undefined
  });

  // Stato per il tema del form
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

  // Carica i dati del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${params.id}`);
        if (!response.ok) {
          throw new Error('Errore durante il caricamento del form');
        }
        const data = await response.json();
        
        // Parse options per ogni domanda se sono stringhe JSON
        if (data.questions && Array.isArray(data.questions)) {
          data.questions = data.questions.map((q: any) => ({
            ...q,
            options: q.options 
              ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
              : undefined
          }));
        }
        
        setForm(data);
        
        // Imposta il tema dal form se esiste, altrimenti usa i valori predefiniti
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

        setFormData({
          title: data.title,
          description: data.description,
          type: data.type
        });
        
        // Carica le date se presenti
        if (data.opensAt) {
          const opensAtDate = new Date(data.opensAt);
          setForm(prev => prev ? { ...prev, opensAt: opensAtDate } : null);
        }
        if (data.closesAt) {
          const closesAtDate = new Date(data.closesAt);
          setForm(prev => prev ? { ...prev, closesAt: closesAtDate } : null);
        }
      } catch (error) {
        console.error('Errore durante il caricamento del form:', error);
        toast.error('Impossibile caricare il form. Riprova.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id]);

  // Aggiungo un effetto per caricare i font dinamicamente
  useEffect(() => {
    // Carica il font selezionato
    if (theme.fontFamily) {
      // Rimuovi eventuali link esistenti per evitare duplicati
      const existingLinks = document.querySelectorAll('link[data-font-loader]');
      existingLinks.forEach(link => link.remove());
      
      // Crea un nuovo link per il font
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      link.setAttribute('data-font-loader', 'true');
      document.head.appendChild(link);
      
      // Forza un reflow per applicare il font
      document.body.style.fontFamily = `"${theme.fontFamily}", sans-serif`;
      setTimeout(() => {
        document.body.style.fontFamily = '';
      }, 100);
      
      return () => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [theme.fontFamily]);

  // Aggiungo un effetto per aggiornare l'iframe quando cambia il tema
  useEffect(() => {
    // Aggiorna l'iframe con il nuovo tema
    const iframe = document.getElementById('form-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument;
      
      // Aggiorna il contenuto dell'iframe
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <link to="https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body {
                margin: 0;
                padding: 16px;
                font-family: "${theme.fontFamily}", sans-serif;
                background-color: ${theme.backgroundColor};
                color: ${theme.textColor};
                border-radius: ${theme.borderRadius}px;
              }
              h2 {
                color: ${theme.primaryColor};
                font-size: 1.25rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
              }
              p {
                font-size: 0.875rem;
                margin-top: 0.25rem;
              }
              .question {
                background-color: ${theme.backgroundColor}dd;
                border-radius: ${theme.borderRadius}px;
                padding: 12px;
                margin-bottom: 16px;
              }
              .question p {
                font-weight: 500;
                margin-top: 0;
              }
              .option {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
              }
              .option-circle {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 1px solid ${theme.primaryColor};
              }
              .button {
                display: inline-block;
                padding: 8px 16px;
                border-radius: ${theme.buttonStyle === 'filled' ? '9999px' : `${theme.borderRadius}px`};
                background-color: ${theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent'};
                color: ${theme.buttonStyle === 'filled' ? '#FFFFFF' : theme.primaryColor};
                border: ${theme.buttonStyle !== 'filled' ? `1px solid ${theme.primaryColor}` : 'none'};
                font-family: "${theme.fontFamily}", sans-serif;
                text-align: center;
                cursor: pointer;
                float: right;
              }
            </style>
          </head>
          <body>
            <h2>${form?.title || 'Titolo Form'}</h2>
            <p>${form?.description || 'Descrizione del form'}</p>
            
            <div class="question">
              <p>Domanda di esempio</p>
              <div class="option">
                <div class="option-circle"></div>
                <span>Opzione 1</span>
              </div>
              <div class="option">
                <div class="option-circle"></div>
                <span>Opzione 2</span>
              </div>
            </div>
            
            <div class="button">Invia</div>
          </body>
        </html>
      `);
      doc.close();
    }
  }, [theme, form?.title, form?.description]);

  // Aggiungo un effetto per sincronizzare il tema locale con il form
  useEffect(() => {
    if (form?.theme) {
      setTheme({
        primaryColor: form.theme.primaryColor || '#000000',
        backgroundColor: form.theme.backgroundColor || '#ffffff',
        fontFamily: form.theme.fontFamily || 'Inter',
        borderRadius: form.theme.borderRadius || 8,
        buttonStyle: form.theme.buttonStyle || 'filled',
        textColor: form.theme.textColor || '#000000',
        accentColor: form.theme.accentColor || '#000000',
        headerImage: form.theme.headerImage || '',
        logo: form.theme.logo || '',
        backgroundImage: form.theme.backgroundImage || '',
        backgroundPosition: form.theme.backgroundPosition || 'center',
        backgroundSize: form.theme.backgroundSize || 'cover',
        backgroundOpacity: form.theme.backgroundOpacity || 100
      });
    }
  }, [form?.theme]);

  // Validazione delle date
  const validateDates = () => {
    if (!form) return true;
    
    const now = new Date();
    const opensAt = form.opensAt ? new Date(form.opensAt) : null;
    const closesAt = form.closesAt ? new Date(form.closesAt) : null;
    
    if (opensAt && closesAt && opensAt > closesAt) {
      toast.error("Opening date must be before closing date");
      return false;
    }
    
    if (opensAt && opensAt < now) {
      toast.error("Opening date cannot be in the past");
      return false;
    }
    
    return true;
  };

  // Funzione per aggiornare il tema
  const updateTheme = (updates: Partial<Theme>) => {
    setTheme(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Aggiorno la funzione handleThemeChange per aggiornare sia il tema locale che il form
  const handleThemeChange = (updates: Partial<Theme>) => {
    if (!form) return;
    
    // Aggiorna il tema locale
    const updatedTheme = { ...theme, ...updates };
    setTheme(updatedTheme);
    
    // Aggiorna il form con il nuovo tema
    setForm({
      ...form,
      theme: updatedTheme
    });
  };

  // Gestisce il salvataggio del form
  const handleSave = async () => {
    if (!form) return;
    
    if (!validateDates()) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/forms/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          theme,
          opensAt: form.opensAt?.toISOString(),
          closesAt: form.closesAt?.toISOString(),
          questions: form.questions.map(q => ({
            text: q.text,
            type: q.type,
            required: q.required,
            options: q.options,
            order: q.order
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form");
      }

      toast.success("Form saved successfully");
      navigate(`/admin/forms/${params.id}`);
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  // Gestisce la duplicazione del form
  const handleDuplicate = async () => {
    if (!form) return;
    
      setSaving(true);
    try {
      const response = await authenticatedFetch(`/api/forms/${params.id}/duplicate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate form");
      }

      const newForm = await response.json();
      toast.success("Form duplicated successfully");
      navigate(`/admin/forms/${newForm.id}/edit`);
    } catch (error) {
      console.error("Error duplicating form:", error);
      toast.error("Failed to duplicate form");
    } finally {
      setSaving(false);
    }
  };

  // Aggiunge una nuova domanda
  const addQuestion = async (questionData: Partial<Question>) => {
    if (!form) return;
    
    if (!questionData.text?.trim()) {
      toast.error('Il testo della domanda è obbligatorio');
      return;
    }
    
    // Validazione per tipi che richiedono opzioni
    const typesWithOptions = ["MULTIPLE_CHOICE", "RANKING"];
    if (typesWithOptions.includes(questionData.type as string)) {
      const validOptions = Array.isArray(questionData.options) 
        ? questionData.options.filter(opt => typeof opt === 'string' && opt.trim().length > 0)
        : [];
      if (validOptions.length === 0) {
        const errorMessage = questionData.type === "MULTIPLE_CHOICE" 
          ? 'Le domande a scelta multipla devono avere almeno un\'opzione'
          : 'Le domande di ranking devono avere almeno un elemento da ordinare';
        toast.error(errorMessage);
        return;
      }
    }
    
    setSaving(true);
    
    try {
      const questionPayload = {
        text: questionData.text,
        type: questionData.type,
        required: questionData.required || false,
        options: typesWithOptions.includes(questionData.type as string) && Array.isArray(questionData.options)
          ? questionData.options.filter(opt => typeof opt === 'string' && opt.trim().length > 0)
          : undefined
      };

      const response = await authenticatedFetch(`/api/forms/${params.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionPayload),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiunta della domanda");
      }

      const updatedForm = await response.json();
      
      // Parse options per ogni domanda se sono stringhe JSON
      if (updatedForm.questions && Array.isArray(updatedForm.questions)) {
        updatedForm.questions = updatedForm.questions.map((q: any) => ({
          ...q,
          options: q.options 
            ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
            : undefined
        }));
      }
      
      setForm(updatedForm);
      setIsAddingQuestion(false);
      setNewQuestion({
        text: '',
        type: 'TEXT' as QuestionType,
        required: false,
        options: undefined
      });
      toast.success("Domanda aggiunta con successo");
    } catch (error) {
      console.error("Errore nell'aggiunta della domanda:", error);
      toast.error("Impossibile aggiungere la domanda");
    } finally {
      setSaving(false);
    }
  };

  // Rimuove una domanda
  const removeQuestion = async (questionId: string) => {
    if (!form) return;
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/forms/${params.id}/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Errore nell'eliminazione della domanda");
      }

      const updatedForm = await response.json();
      
      // Parse options per ogni domanda se sono stringhe JSON
      if (updatedForm.questions && Array.isArray(updatedForm.questions)) {
        updatedForm.questions = updatedForm.questions.map((q: any) => ({
          ...q,
          options: q.options 
            ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
            : undefined
        }));
      }
      
      setForm(updatedForm);
      toast.success('Domanda rimossa con successo');
    } catch (error) {
      console.error("Errore nell'eliminazione della domanda:", error);
      toast.error("Impossibile eliminare la domanda");
    } finally {
      setSaving(false);
    }
  };

  // Aggiorna una domanda
  const updateQuestion = async (questionId: string, updates: Partial<Question>) => {
    if (!form) return;
    
    if (!updates.text?.trim()) {
      toast.error('Il testo della domanda è obbligatorio');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await authenticatedFetch(`/api/forms/${params.id}/questions/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento della domanda");
      }

      const updatedForm = await response.json();
      
      // Parse options per ogni domanda se sono stringhe JSON
      if (updatedForm.questions && Array.isArray(updatedForm.questions)) {
        updatedForm.questions = updatedForm.questions.map((q: any) => ({
          ...q,
          options: q.options 
            ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
            : undefined
        }));
      }
      
      setForm(updatedForm);
    } catch (error) {
      console.error("Errore nell'aggiornamento della domanda:", error);
      toast.error("Impossibile aggiornare la domanda");
    } finally {
      setSaving(false);
    }
  };

  // Aggiorna le opzioni di una domanda
  const updateQuestionOptions = async (questionId: string, options: string[]) => {
    if (!form) return;
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/forms/${params.id}/questions/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ options }),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento delle opzioni");
      }

      const updatedForm = await response.json();
      
      // Parse options per ogni domanda se sono stringhe JSON
      if (updatedForm.questions && Array.isArray(updatedForm.questions)) {
        updatedForm.questions = updatedForm.questions.map((q: any) => ({
          ...q,
          options: q.options 
            ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
            : undefined
        }));
      }
      
      setForm(updatedForm);
    } catch (error) {
      console.error("Errore nell'aggiornamento delle opzioni:", error);
      toast.error("Impossibile aggiornare le opzioni");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Form non trovato</h3>
          <p className="text-gray-500 mb-6">Il form che stai cercando non esiste o è stato eliminato.</p>
          <Button asChild>
            <Link to="/admin/forms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai forms
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[form.status as keyof typeof statusConfig]?.icon || Clock;

  return (
    <motion.div
      className="p-6 lg:p-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modifica Form</h1>
            <p className="text-gray-500 mt-1">Modifica le impostazioni del form</p>
          </div>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}/preview`}>
              <Eye className="h-4 w-4 mr-2" />
              Anteprima
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}/share`}>
              <FileText className="h-4 w-4 mr-2" />
              Condividi
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salva modifiche'}
          </Button>
        </div>
      </div>

      {/* Form Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{form.title}</h3>
              <p className="text-sm text-gray-500">{form.description}</p>
            </div>
            <Badge className={`${statusConfig[form.status as keyof typeof statusConfig]?.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[form.status as keyof typeof statusConfig]?.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Generali</CardTitle>
              <CardDescription>
                Modifica le informazioni principali del form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Titolo del form</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Inserisci il titolo del form"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Descrizione</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Inserisci una descrizione del form"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tipo di form</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="SURVEY"
                      checked={formData.type === 'SURVEY'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'SURVEY' | 'QUIZ' }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Sondaggio</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="QUIZ"
                      checked={formData.type === 'QUIZ'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'SURVEY' | 'QUIZ' }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Quiz</span>
                  </label>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data di Apertura
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.opensAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.opensAt ? format(new Date(form.opensAt), "PPP", { locale: it }) : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
                      <Calendar
                        mode="single"
                        selected={form.opensAt ? new Date(form.opensAt) : undefined}
                        onSelect={(date) => setForm(prev => prev ? { ...prev, opensAt: date || undefined } : null)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data di Chiusura
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.closesAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.closesAt ? format(new Date(form.closesAt), "PPP", { locale: it }) : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start" side="bottom" sideOffset={5}>
                      <Calendar
                        mode="single"
                        selected={form.closesAt ? new Date(form.closesAt) : undefined}
                        onSelect={(date) => setForm(prev => prev ? { ...prev, closesAt: date || undefined } : null)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalizzazione Form - Full Screen */}
          <div className="my-8">
            <div className="mb-4 px-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Personalizzazione
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Personalizza l'aspetto del form che gli utenti vedranno
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800" style={{ height: '600px' }}>
              <FormCustomizationV2
                initialTheme={theme}
                onThemeChange={(newTheme) => {
                  setTheme(newTheme);
                  handleThemeChange(newTheme);
                }}
                formTitle={formData.title}
                formDescription={formData.description}
                questions={form.questions}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Domande</CardTitle>
              <CardDescription>
                {form.questions.length} domande configurate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {question.type}
                          </Badge>
                          {question.required && (
                            <Badge variant="destructive" className="text-xs">
                              Obbligatoria
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-900">{question.text}</p>
                        {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-1">Opzioni:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex}>{typeof option === 'string' ? option : JSON.stringify(option)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Assicurati che le opzioni siano parseate se sono stringhe JSON
                          const questionToEdit = {
                            ...question,
                            options: question.options 
                              ? (typeof question.options === 'string' 
                                  ? JSON.parse(question.options) 
                                  : question.options)
                              : undefined
                          };
                          setEditingQuestion(questionToEdit);
                          setEditingQuestionIndex(index);
                          setIsEditingQuestions(true);
                        }}
                        className="ml-4"
                      >
                        <Type className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (form.questions.length > 0) {
                      const firstQuestion = form.questions[0];
                      // Assicurati che le opzioni siano parseate se sono stringhe JSON
                      const questionToEdit = {
                        ...firstQuestion,
                        options: firstQuestion.options 
                          ? (typeof firstQuestion.options === 'string' 
                              ? JSON.parse(firstQuestion.options) 
                              : firstQuestion.options)
                          : undefined
                      };
                      setEditingQuestion(questionToEdit);
                      setEditingQuestionIndex(0);
                      setIsEditingQuestions(true);
                    } else {
                      toast.info('Non ci sono domande da modificare');
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Modifica domande
                </Button>
                <Button 
                  variant="default" 
                  className="w-full bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                  onClick={() => {
                    setIsAddingQuestion(true);
                    setNewQuestion({
                      text: '',
                      type: 'TEXT' as QuestionType,
                      required: false,
                      options: undefined
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi domanda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Azioni rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/admin/forms/${form.id}/preview`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Anteprima
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/admin/forms/${form.id}/share`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Condividi
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={`/admin/forms/${form.id}/responses`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizza risposte
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Domande</span>
                <span className="text-sm font-medium">{form.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Stato</span>
                <Badge className={`text-xs ${statusConfig[form.status as keyof typeof statusConfig]?.color}`}>
                  {statusConfig[form.status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog per modificare le domande */}
      <Dialog open={isEditingQuestions} onOpenChange={(open) => {
        if (!open) {
          setIsEditingQuestions(false);
          setEditingQuestion(null);
          setEditingQuestionIndex(0);
          setNewOption('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-black">
                  Modifica Domanda
                </DialogTitle>
                <DialogDescription>
                  Modifica il testo, il tipo e le opzioni della domanda
                </DialogDescription>
              </div>
              {form && form.questions.length > 1 && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const prevIndex = editingQuestionIndex > 0 
                        ? editingQuestionIndex - 1 
                        : form.questions.length - 1;
                      const prevQuestion = form.questions[prevIndex];
                      const questionToEdit = {
                        ...prevQuestion,
                        options: prevQuestion.options 
                          ? (typeof prevQuestion.options === 'string' 
                              ? JSON.parse(prevQuestion.options) 
                              : prevQuestion.options)
                          : undefined
                      };
                      setEditingQuestion(questionToEdit);
                      setEditingQuestionIndex(prevIndex);
                      setNewOption('');
                    }}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500 min-w-[60px] text-center">
                    {editingQuestionIndex + 1} / {form.questions.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const nextIndex = editingQuestionIndex < form.questions.length - 1
                        ? editingQuestionIndex + 1
                        : 0;
                      const nextQuestion = form.questions[nextIndex];
                      const questionToEdit = {
                        ...nextQuestion,
                        options: nextQuestion.options 
                          ? (typeof nextQuestion.options === 'string' 
                              ? JSON.parse(nextQuestion.options) 
                              : nextQuestion.options)
                          : undefined
                      };
                      setEditingQuestion(questionToEdit);
                      setEditingQuestionIndex(nextIndex);
                      setNewOption('');
                    }}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text" className="text-[#868789] font-medium">Testo della domanda</Label>
                <Input
                  id="question-text"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value
                  })}
                  placeholder="Inserisci il testo della domanda"
                  className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00] mt-1"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#868789] font-medium">Tipo di domanda</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => {
                    const newType = value as QuestionType;
                    // Tipi che richiedono opzioni come array di stringhe
                    const typesWithOptions = ["MULTIPLE_CHOICE", "RANKING"];
                    setEditingQuestion({
                      ...editingQuestion,
                      type: newType,
                      // Se cambia a un tipo che richiede opzioni e non ha opzioni, inizializza con un array vuoto
                      // Se cambia da un tipo con opzioni a un tipo senza opzioni, rimuovi le opzioni
                      options: typesWithOptions.includes(newType)
                        ? (editingQuestion.options && Array.isArray(editingQuestion.options) && editingQuestion.options.length > 0 
                            ? editingQuestion.options 
                            : [''])
                        : undefined
                    });
                  }}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]">
                    <SelectValue placeholder="Seleziona il tipo di domanda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Testo</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Scelta Multipla</SelectItem>
                    <SelectItem value="RATING">Valutazione</SelectItem>
                    <SelectItem value="DATE">Data</SelectItem>
                    <SelectItem value="RANKING">Ranking</SelectItem>
                    <SelectItem value="LIKERT">Scala Likert</SelectItem>
                    <SelectItem value="FILE_UPLOAD">Caricamento File</SelectItem>
                    <SelectItem value="NPS">NPS</SelectItem>
                    <SelectItem value="BRANCHING">Branching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editingQuestion.type === "MULTIPLE_CHOICE" || editingQuestion.type === "RANKING") && (
                <div className="space-y-2">
                  <Label className="text-[#868789] font-medium">
                    {editingQuestion.type === "MULTIPLE_CHOICE" ? "Opzioni di scelta" : "Elementi da ordinare"}
                  </Label>
                  <div className="space-y-2">
                    {editingQuestion.options?.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingQuestion.options || [])];
                            newOptions[index] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions
                            });
                          }}
                          placeholder={`Opzione ${index + 1}`}
                          className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = editingQuestion.options?.filter((_, i) => i !== index) || [];
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions.length > 0 ? newOptions : undefined
                            });
                          }}
                          className="hover:bg-red-100 hover:text-red-600"
                          disabled={editingQuestion.options && editingQuestion.options.length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Aggiungi una nuova opzione"
                        className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newOption.trim()) {
                            e.preventDefault();
                            const newOptions = [...(editingQuestion.options || []), newOption.trim()];
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions
                            });
                            setNewOption('');
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          if (newOption.trim()) {
                            const newOptions = [...(editingQuestion.options || []), newOption.trim()];
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions
                            });
                            setNewOption('');
                          }
                        }}
                        className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                        disabled={!newOption.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingQuestion.options && editingQuestion.options.length === 0 && (
                      <p className="text-sm text-red-500">Aggiungi almeno un'opzione</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={editingQuestion.required}
                  onCheckedChange={(checked) => setEditingQuestion({
                    ...editingQuestion,
                    required: checked
                  })}
                />
                <Label htmlFor="required" className="text-[#868789] font-medium">Obbligatoria</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditingQuestions(false);
                setEditingQuestion(null);
              }}
              className="bg-white hover:bg-gray-100 border-gray-200 text-[#868789]"
            >
              Annulla
            </Button>
            <Button 
              onClick={async () => {
                if (!editingQuestion || !form) return;
                
                if (!editingQuestion.text?.trim()) {
                  toast.error('Il testo della domanda è obbligatorio');
                  return;
                }
                
                // Validazione per tipi che richiedono opzioni: devono avere almeno un'opzione
                const typesWithOptions = ["MULTIPLE_CHOICE", "RANKING"];
                if (typesWithOptions.includes(editingQuestion.type)) {
                  const validOptions = Array.isArray(editingQuestion.options) 
                    ? editingQuestion.options.filter(opt => typeof opt === 'string' && opt.trim().length > 0)
                    : [];
                  if (validOptions.length === 0) {
                    const errorMessage = editingQuestion.type === "MULTIPLE_CHOICE" 
                      ? 'Le domande a scelta multipla devono avere almeno un\'opzione'
                      : 'Le domande di ranking devono avere almeno un elemento da ordinare';
                    toast.error(errorMessage);
                    return;
                  }
                }
                
                await updateQuestion(editingQuestion.id, {
                  text: editingQuestion.text,
                  type: editingQuestion.type,
                  required: editingQuestion.required,
                  options: typesWithOptions.includes(editingQuestion.type) && Array.isArray(editingQuestion.options)
                    ? editingQuestion.options.filter(opt => typeof opt === 'string' && opt.trim().length > 0)
                    : undefined
                });
                
                // Naviga alla prossima domanda se disponibile
                if (form.questions.length > editingQuestionIndex + 1) {
                  const nextIndex = editingQuestionIndex + 1;
                  const nextQuestion = form.questions[nextIndex];
                  const questionToEdit = {
                    ...nextQuestion,
                    options: nextQuestion.options 
                      ? (typeof nextQuestion.options === 'string' 
                          ? JSON.parse(nextQuestion.options) 
                          : nextQuestion.options)
                      : undefined
                  };
                  setEditingQuestion(questionToEdit);
                  setEditingQuestionIndex(nextIndex);
                  setNewOption('');
                  toast.success('Domanda modificata con successo');
                } else {
                  setIsEditingQuestions(false);
                  setEditingQuestion(null);
                  setEditingQuestionIndex(0);
                  setNewOption('');
                  toast.success('Domanda modificata con successo');
                }
              }}
              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per aggiungere una nuova domanda */}
      <Dialog open={isAddingQuestion} onOpenChange={(open) => {
        if (!open) {
          setIsAddingQuestion(false);
          setNewQuestion({
            text: '',
            type: 'TEXT' as QuestionType,
            required: false,
            options: undefined
          });
          setNewOption('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Aggiungi Nuova Domanda
            </DialogTitle>
            <DialogDescription>
              Crea una nuova domanda per il form
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-question-text" className="text-[#868789] font-medium">Testo della domanda</Label>
              <Input
                id="new-question-text"
                value={newQuestion.text || ''}
                onChange={(e) => setNewQuestion({
                  ...newQuestion,
                  text: e.target.value
                })}
                placeholder="Inserisci il testo della domanda"
                className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00] mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#868789] font-medium">Tipo di domanda</Label>
              <Select
                value={newQuestion.type || 'TEXT'}
                onValueChange={(value) => {
                  const newType = value as QuestionType;
                  const typesWithOptions = ["MULTIPLE_CHOICE", "RANKING"];
                  setNewQuestion({
                    ...newQuestion,
                    type: newType,
                    options: typesWithOptions.includes(newType) ? [''] : undefined
                  });
                }}
              >
                <SelectTrigger className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]">
                  <SelectValue placeholder="Seleziona il tipo di domanda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Testo</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">Scelta Multipla</SelectItem>
                  <SelectItem value="RATING">Valutazione</SelectItem>
                  <SelectItem value="DATE">Data</SelectItem>
                  <SelectItem value="RANKING">Ranking</SelectItem>
                  <SelectItem value="LIKERT">Scala Likert</SelectItem>
                  <SelectItem value="FILE_UPLOAD">Caricamento File</SelectItem>
                  <SelectItem value="NPS">NPS</SelectItem>
                  <SelectItem value="BRANCHING">Branching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newQuestion.type === "MULTIPLE_CHOICE" || newQuestion.type === "RANKING") && (
              <div className="space-y-2">
                <Label className="text-[#868789] font-medium">
                  {newQuestion.type === "MULTIPLE_CHOICE" ? "Opzioni di scelta" : "Elementi da ordinare"}
                </Label>
                <div className="space-y-2">
                  {newQuestion.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions
                          });
                        }}
                        placeholder={`Opzione ${index + 1}`}
                        className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = newQuestion.options?.filter((_, i) => i !== index) || [];
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions.length > 0 ? newOptions : undefined
                          });
                        }}
                        className="hover:bg-red-100 hover:text-red-600"
                        disabled={newQuestion.options && newQuestion.options.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Aggiungi una nuova opzione"
                      className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newOption.trim()) {
                          e.preventDefault();
                          const newOptions = [...(newQuestion.options || []), newOption.trim()];
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions
                          });
                          setNewOption('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (newOption.trim()) {
                          const newOptions = [...(newQuestion.options || []), newOption.trim()];
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions
                          });
                          setNewOption('');
                        }
                      }}
                      className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                      disabled={!newOption.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newQuestion.options && newQuestion.options.length === 0 && (
                    <p className="text-sm text-red-500">Aggiungi almeno un'opzione</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="new-required"
                checked={newQuestion.required || false}
                onCheckedChange={(checked) => setNewQuestion({
                  ...newQuestion,
                  required: checked
                })}
              />
              <Label htmlFor="new-required" className="text-[#868789] font-medium">Obbligatoria</Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingQuestion(false);
                setNewQuestion({
                  text: '',
                  type: 'TEXT' as QuestionType,
                  required: false,
                  options: undefined
                });
                setNewOption('');
              }}
              className="bg-white hover:bg-gray-100 border-gray-200 text-[#868789]"
            >
              Annulla
            </Button>
            <Button 
              onClick={async () => {
                await addQuestion(newQuestion);
              }}
              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
            >
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 