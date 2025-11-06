import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Eye, 
  BarChart3, 
  Users, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Target,
  Settings,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { authenticatedFetch } from '@/lib/utils';
import { Icons } from '@/components/icons';

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  status: 'draft' | 'published' | 'archived';
  theme: any;
  isPublic: boolean;
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage: string;
  opensAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  responses: any[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

const statusConfig = {
  published: { label: "Pubblicato", color: "bg-green-100 text-green-800", icon: CheckCircle },
  draft: { label: "Bozza", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  archived: { label: "Archiviato", color: "bg-gray-100 text-gray-800", icon: AlertCircle }
};

const typeConfig = {
  SURVEY: { label: "Sondaggio", color: "bg-blue-100 text-blue-800" },
  QUIZ: { label: "Quiz", color: "bg-purple-100 text-purple-800" }
};

export default function FormDetailPage() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTeamsDialogOpen, setIsTeamsDialogOpen] = useState(false);
  const [teamsTitle, setTeamsTitle] = useState('');
  const [teamsText, setTeamsText] = useState('');
  const [isSendingTeams, setIsSendingTeams] = useState(false);
  const [focusedField, setFocusedField] = useState<'title' | 'text' | null>(null);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('piu-utilizzate');
  const [mostUsedEmojis, setMostUsedEmojis] = useState<string[]>([]);
  const categorySliderRef = useRef<HTMLDivElement>(null);
  const { toast, toasts } = useToast();

  // Carica le emoji più utilizzate dal localStorage
  useEffect(() => {
    const loadMostUsedEmojis = () => {
      try {
        const stored = localStorage.getItem('emoji-usage-stats');
        if (stored) {
          const stats: Record<string, number> = JSON.parse(stored);
          // Ordina per numero di click (decrescente) e prendi le prime 20
          const sorted = Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([emoji]) => emoji);
          setMostUsedEmojis(sorted);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle emoji più utilizzate:', error);
      }
    };
    loadMostUsedEmojis();
  }, []);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setForm(data);
        } else {
          setError('Form non trovato');
        }
      } catch (error) {
        setError('Errore nel caricamento del form');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchForm();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatus = (form: Form) => {
    // Se il form ha una data di chiusura passata, è archiviato
    if (form.closesAt && new Date(form.closesAt) < new Date()) {
      return 'archived';
    }
    // Se il form è pubblico, è pubblicato
    if (form.isPublic) {
      return 'published';
    }
    // Altrimenti è bozza
    return 'draft';
  };

  const calculateStats = (form: Form) => {
    const totalResponses = form.responses.length;
    const totalQuestions = form.questions.length;
    
    // Calcola risposte complete (che hanno risposto a tutte le domande)
    const completeResponses = form.responses.filter(r => 
      r.answers && r.answers.length >= totalQuestions
    ).length;
    
    // Calcola risposte parziali (che hanno risposto ad almeno una domanda)
    const partialResponses = form.responses.filter(r => 
      r.answers && r.answers.length > 0 && r.answers.length < totalQuestions
    ).length;
    
    // Calcola tasso di completamento
    const completionRate = totalResponses > 0 ? 
      Math.round((completeResponses / totalResponses) * 100) : 0;
    
    return {
      totalResponses,
      totalQuestions,
      completeResponses,
      partialResponses,
      completionRate
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
            <p className="text-gray-500 mb-6">{error || 'Form non trovato'}</p>
            <Button asChild>
              <Link to="/admin/forms">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Forms
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getStatus(form);
  const StatusIcon = statusConfig[status].icon;
  const stats = calculateStats(form);

  const handlePublish = async () => {
    if (!form) return;
    
    try {
      setIsPublishing(true);
      const response = await authenticatedFetch(`/api/forms/${form.id}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        // Aggiorna il form localmente
        setForm(prev => prev ? {
          ...prev,
          isPublic: true
        } : null);
        
        // Mostra toast di successo
        toast({
          title: 'Form pubblicato!',
          description: 'Il form è ora disponibile per le risposte',
          type: 'success'
        });
        
        // Ricarica i dati del form per aggiornare tutto
        const updatedForm = await authenticatedFetch(`/api/forms/${params.id}`);
        if (updatedForm.ok) {
          const data = await updatedForm.json();
          setForm(data);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: 'Errore',
          description: errorData.error || 'Errore durante la pubblicazione',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Errore durante la pubblicazione:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante la pubblicazione. Riprova.',
        type: 'error'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenTeamsDialog = () => {
    if (!form) return;
    // Imposta i valori di default
    setTeamsTitle('Nuovo Form Creato');
    setTeamsText(`${form.owner?.name || 'Utente'} ha creato un nuovo form: ${form.title}`);
    setIsTeamsDialogOpen(true);
  };

  const handleSendTeamsNotification = async () => {
    if (!form) return;
    
    try {
      setIsSendingTeams(true);
      const response = await authenticatedFetch(`/api/forms/${form.id}/send-teams-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: teamsTitle,
          text: teamsText
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Notifica inviata!',
            description: 'La notifica è stata inviata con successo a Teams',
            type: 'success'
          });
          setIsTeamsDialogOpen(false);
        } else {
          toast({
            title: 'Errore',
            description: 'Errore nell\'invio della notifica a Teams',
            type: 'error'
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: 'Errore',
          description: errorData.error || 'Errore nell\'invio della notifica',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Errore durante l\'invio della notifica Teams:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante l\'invio della notifica. Riprova.',
        type: 'error'
      });
    } finally {
      setIsSendingTeams(false);
    }
  };

  const trackEmojiUsage = (emoji: string) => {
    try {
      const stored = localStorage.getItem('emoji-usage-stats');
      const stats: Record<string, number> = stored ? JSON.parse(stored) : {};
      stats[emoji] = (stats[emoji] || 0) + 1;
      localStorage.setItem('emoji-usage-stats', JSON.stringify(stats));
      
      // Aggiorna lo stato delle emoji più utilizzate
      const sorted = Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([emoji]) => emoji);
      setMostUsedEmojis(sorted);
    } catch (error) {
      console.error('Errore nel salvataggio delle statistiche emoji:', error);
    }
  };

  const insertEmoji = (emoji: string, event?: React.MouseEvent) => {
    // Previeni il blur del campo quando si clicca sull'emoji
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Traccia l'utilizzo dell'emoji
    trackEmojiUsage(emoji);

    // Se un campo è selezionato, inserisci l'emoji direttamente
    if (focusedField === 'title') {
      const input = document.getElementById('teams-title') as HTMLInputElement;
      if (input) {
        // Salva la posizione del cursore PRIMA di perdere il focus
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue = teamsTitle.substring(0, start) + emoji + teamsTitle.substring(end);
        setTeamsTitle(newValue);
        
        // Usa requestAnimationFrame per assicurarsi che il DOM sia aggiornato
        requestAnimationFrame(() => {
          // Riposiziona il cursore dopo l'emoji e mantieni il focus
          input.focus();
          const newPosition = start + emoji.length;
          input.setSelectionRange(newPosition, newPosition);
          setFocusedField('title'); // Mantieni il campo come focused
        });
      }
    } else if (focusedField === 'text') {
      const textarea = document.getElementById('teams-text') as HTMLTextAreaElement;
      if (textarea) {
        // Salva la posizione del cursore PRIMA di perdere il focus
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const newValue = teamsText.substring(0, start) + emoji + teamsText.substring(end);
        setTeamsText(newValue);
        
        // Usa requestAnimationFrame per assicurarsi che il DOM sia aggiornato
        requestAnimationFrame(() => {
          // Riposiziona il cursore dopo l'emoji e mantieni il focus
          textarea.focus();
          const newPosition = start + emoji.length;
          textarea.setSelectionRange(newPosition, newPosition);
          setFocusedField('text'); // Mantieni il campo come focused
        });
      }
    } else {
      // Se nessun campo è selezionato, copia negli appunti (senza toast per non disturbare)
      navigator.clipboard.writeText(emoji).catch((error) => {
        console.error('Errore nella copia:', error);
      });
    }
  };

  const scrollCategorySlider = (direction: 'left' | 'right') => {
    if (categorySliderRef.current) {
      const scrollAmount = 200; // Quantità di scroll in pixel
      const currentScroll = categorySliderRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      categorySliderRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.div
      className="p-6 lg:p-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/forms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Forms
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-gray-500 mt-1">{form.description}</p>
          </div>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          {!form.isPublic && (
            <Button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pubblicando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pubblica
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}/preview`}>
              <Eye className="h-4 w-4 mr-2" />
              Anteprima
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/forms/${form.id}/share`}>
              <Share2 className="h-4 w-4 mr-2" />
              Condividi
            </Link>
          </Button>
          <Button variant="teams" size="sm" onClick={handleOpenTeamsDialog}>
            <img 
              src="/microsoft_office_teams_logo.png" 
              alt="Teams" 
              className="h-4 w-4 mr-2"
            />
            Condividi su Teams
          </Button>
        </div>
      </div>

      {/* Status and Type Badges */}
      <div className="flex items-center space-x-3">
        <Badge className={`${statusConfig[status].color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig[status].label}
        </Badge>
        <Badge variant="outline" className={`${typeConfig[form.type].color}`}>
          {typeConfig[form.type].label}
        </Badge>
        {form.isPublic && (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pubblico
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="questions">Domande ({form.questions.length})</TabsTrigger>
              <TabsTrigger value="responses">Risposte ({form.responses.length})</TabsTrigger>
              <TabsTrigger value="settings">Impostazioni</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Domande del Form
                  </CardTitle>
                  <CardDescription>
                    {form.questions.length} domande configurate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {form.questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-l-4 border-l-[#FFCD00]">
                          <CardContent className="p-4">
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
                                <p className="text-gray-900 font-medium">{question.text}</p>
                                {question.options && question.options.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-500 mb-2">Opzioni:</p>
                                    <div className="space-y-1">
                                      {question.options.map((option, optIndex) => (
                                        <div key={optIndex} className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded">
                                          {optIndex + 1}. {option}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="responses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Risposte Ricevute
                  </CardTitle>
                  <CardDescription>
                    {form.responses.length} risposte totali
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {form.responses.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nessuna risposta ricevuta ancora</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.responses.map((response, index) => {
                        const answersCount = response.answers?.length || 0;
                        const isComplete = answersCount >= form.questions.length;
                        const isPartial = answersCount > 0 && answersCount < form.questions.length;
                        
                        return (
                          <div key={response.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Risposta #{index + 1}</span>
                                {isComplete && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completa
                                  </Badge>
                                )}
                                {isPartial && (
                                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Parziale
                                  </Badge>
                                )}
                                {answersCount === 0 && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Vuota
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                {answersCount} di {form.questions.length} domande risposte
                              </p>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.round((answersCount / form.questions.length) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Impostazioni del Form
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Visibilità</label>
                      <p className="text-sm text-gray-500">
                        {form.isPublic ? 'Pubblico' : 'Privato'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Anonimo</label>
                      <p className="text-sm text-gray-500">
                        {form.isAnonymous ? 'Sì' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Modifica Risposte</label>
                      <p className="text-sm text-gray-500">
                        {form.allowEdit ? 'Permessa' : 'Non permessa'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mostra Risultati</label>
                      <p className="text-sm text-gray-500">
                        {form.showResults ? 'Sì' : 'No'}
                      </p>
                    </div>
                    {form.opensAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Apertura</label>
                        <p className="text-sm text-gray-500">
                          {formatDate(form.opensAt)}
                        </p>
                      </div>
                    )}
                    {form.closesAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Chiusura</label>
                        <p className="text-sm text-gray-500">
                          {formatDate(form.closesAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Risposte Totali</span>
                </div>
                <span className="font-semibold">{stats.totalResponses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Domande</span>
                </div>
                <span className="font-semibold">{stats.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-600">Complete</span>
                </div>
                <span className="font-semibold text-green-600">{stats.completeResponses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600">Parziali</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.partialResponses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Tasso Completamento</span>
                </div>
                <span className="font-semibold">{stats.completionRate}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Creato da: <span className="font-medium">{form.owner.name}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Creato il: <span className="font-medium">{formatDate(form.createdAt)}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Aggiornato il: <span className="font-medium">{formatDate(form.updatedAt)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" asChild>
                <Link to={`/admin/forms/${form.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica Form
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/admin/forms/${form.id}/preview`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Anteprima
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/admin/forms/${form.id}/share`}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/admin/forms/${form.id}/responses`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analisi Risposte
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/admin/forms/${form.id}/results`}>
                  <Users className="h-4 w-4 mr-2" />
                  Visualizza Risultati
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast: any) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="font-medium">{toast.title}</div>
            {toast.description && (
              <div className="text-sm opacity-90 mt-1">{toast.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog Condividi su Teams */}
      <Dialog open={isTeamsDialogOpen} onOpenChange={setIsTeamsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-w-[95vw] max-h-[90vh] overflow-hidden border-[#6264A7] border-2 flex flex-col p-0">
          <DialogHeader className="border-b border-[#6264A7]/20 pb-4 px-6 pt-6 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[#6264A7]">
              <img 
                src="/microsoft_office_teams_logo.png" 
                alt="Teams" 
                className="h-5 w-5"
              />
              Condividi su Teams
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Personalizza il titolo e il messaggio della notifica che verrà inviata al canale Teams.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-6 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              <Label htmlFor="teams-title" className="text-gray-700 font-medium">
                Titolo
                <span className="text-xs text-gray-500 ml-2">(puoi usare emoji 🎉 📋 ✨)</span>
              </Label>
              <Input
                id="teams-title"
                value={teamsTitle}
                onChange={(e) => setTeamsTitle(e.target.value)}
                onFocus={(e) => {
                  setFocusedField('title');
                  // Salva la posizione del cursore quando il campo riceve il focus
                  const input = e.target as HTMLInputElement;
                  input.setSelectionRange(input.selectionStart || 0, input.selectionEnd || 0);
                }}
                onBlur={(e) => {
                  // Non deselezionare se il click è su un'emoji
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget || !relatedTarget.closest('.emoji-button')) {
                    // Usa un timeout più lungo per dare tempo all'emoji di essere inserita
                    setTimeout(() => {
                      // Verifica se il campo è ancora focused prima di deselezionare
                      const input = document.getElementById('teams-title') as HTMLInputElement;
                      if (input && document.activeElement !== input) {
                        setFocusedField(null);
                      }
                    }, 300);
                  }
                }}
                placeholder="Es: 🎉 Nuovo Form Creato"
                className="focus:border-[#6264A7] focus:ring-[#6264A7]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teams-text" className="text-gray-700 font-medium">
                Messaggio
                <span className="text-xs text-gray-500 ml-2">(puoi usare emoji 📝 ✅ 🚀)</span>
              </Label>
              <Textarea
                id="teams-text"
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                onFocus={() => setFocusedField('text')}
                onBlur={(e) => {
                  // Non deselezionare se il click è su un'emoji
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget || !relatedTarget.closest('.emoji-button')) {
                    setTimeout(() => setFocusedField(null), 200);
                  }
                }}
                placeholder="Es: 📝 [Nome] ha creato un nuovo form: [Titolo] ✅"
                rows={4}
                className="focus:border-[#6264A7] focus:ring-[#6264A7]"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 text-xs text-blue-700">
              <p className="font-medium mb-1.5 text-xs">💡 Suggerimento:</p>
              <p className="mb-2.5 text-xs leading-tight">
                {focusedField 
                  ? `Clicca su un'emoji per inserirla nel campo ${focusedField === 'title' ? 'Titolo' : 'Messaggio'}:`
                  : 'Clicca su un\'emoji per copiarla negli appunti (o seleziona un campo per inserirla direttamente):'
                }
              </p>
              
              {/* Categorie Emoji - Slider */}
              <div className="mb-2.5 relative flex items-center gap-2">
                {/* Freccia sinistra */}
                <button
                  type="button"
                  onClick={() => scrollCategorySlider('left')}
                  className="flex-shrink-0 bg-white border border-blue-200 rounded-full p-1 shadow-md hover:bg-blue-50 hover:border-[#6264A7] transition-all z-10 h-7 w-7 flex items-center justify-center"
                  aria-label="Scorri a sinistra"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-[#6264A7]" />
                </button>
                {/* Slider delle categorie */}
                <div 
                  ref={categorySliderRef}
                  className="flex gap-1.5 overflow-x-hidden pb-1.5 scrollbar-hide flex-1 items-center"
                >
                  {[
                    { 
                      id: 'piu-utilizzate', 
                      name: '⭐ Più utilizzate', 
                      emojis: mostUsedEmojis.length > 0 
                        ? mostUsedEmojis 
                        : ['✅', '❌', '👍', '👎', '❤️', '🎉', '🔥', '💯', '🚀', '✨', '💡', '📝', '📋', '📊', '📈', '🎯', '⭐', '💬', '🔔', '📢'] 
                    },
                    { id: 'celebrazioni', name: '🎉 Celebrazioni', emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🍾', '🥳', '🎆', '🎇', '✨', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹'] },
                    { id: 'documenti', name: '📋 Documenti', emojis: ['📋', '📝', '📄', '📑', '📊', '📈', '📉', '📌', '📍', '📎', '📏', '📐', '📒', '📓', '📔', '📕', '📗', '📘', '📙', '📚'] },
                    { id: 'check', name: '✅ Check', emojis: ['✅', '✔️', '✓', '☑️', '✓️', '👌', '👍', '🎯', '⭐', '🌟', '💫', '✨', '💯', '🔥', '💪', '👏', '🙌', '🤝', '🤲', '✋'] },
                    { id: 'comunicazione', name: '💬 Comunicazione', emojis: ['💬', '📢', '🔔', '📣', '📮', '✉️', '📧', '💌', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📯', '📰', '📻'] },
                    { id: 'tecnologia', name: '💻 Tecnologia', emojis: ['🚀', '💡', '⚡', '🔥', '💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '💿', '📀', '🖨️', '🖲️', '🖱', '⌚', '📟', '📠', '☎️', '📞'] },
                    { id: 'persone', name: '👥 Persone', emojis: ['👥', '👤', '👨‍💼', '👩‍💼', '🤝', '👫', '👬', '👭', '👯', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👨‍👦', '👨‍👧', '👩‍👦'] },
                    { id: 'frecce', name: '➡️ Frecce', emojis: ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↔️', '↕️', '🔄', '🔁', '⏩', '⏪', '⏫', '⏬', '🔀', '🔂', '🔃', '🔄', '🔁', '▶️'] },
                    { id: 'oggetti', name: '🔍 Oggetti', emojis: ['🔍', '🔎', '📌', '📎', '📏', '📐', '✂️', '📦', '📬', '📭', '🗂️', '📁', '📂', '🗂', '🗄️', '🗃️', '🗳️', '🗞️', '📰', '📄'] },
                    { id: 'emozioni', name: '😊 Emozioni', emojis: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '☺️', '🙃', '😋', '😛'] },
                    { id: 'successo', name: '🏆 Successo', emojis: ['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎖', '👑', '💎', '💍', '🌹', '🥀', '🌺', '🌻', '🌷', '🌼', '🌸', '💐', '🌾'] },
                    { id: 'tempo', name: '⏰ Tempo', emojis: ['⏰', '⏱️', '⏲️', '🕐', '📅', '📆', '🗓️', '📆', '🗂️', '📁', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'] },
                    { id: 'sicurezza', name: '🔐 Sicurezza', emojis: ['🔐', '🔒', '🔓', '🔑', '🗝️', '💼', '👜', '🎒', '📿', '📿', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔓', '🔐', '🔒', '🔓'] },
                    { id: 'cibo', name: '🍕 Cibo', emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🥞', '🥐', '🥨', '🧀', '🥖', '🥨', '🥯', '🥞', '🧇', '🥓', '🥩'] },
                    { id: 'natura', name: '🌍 Natura', emojis: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️'] },
                    { id: 'sport', name: '⚽ Sport', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥍', '🏹', '🎣', '🥊'] },
                    { id: 'trasporti', name: '🚗 Trasporti', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍'] },
                    { id: 'luoghi', name: '🏠 Luoghi', emojis: ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌'] },
                    { id: 'simboli', name: '❤️ Simboli', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'] },
                    { id: 'numeri', name: '0️⃣ Numeri', emojis: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'] },
                    { id: 'forme', name: '🔴 Forme', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️'] },
                    { id: 'giochi', name: '🎯 Giochi', emojis: ['🎯', '🎲', '🎮', '🕹️', '🎰', '🧩', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🧶', '🪡', '🪢'] }
                  ].map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedEmojiCategory(category.id)}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap border ${
                        selectedEmojiCategory === category.id
                          ? 'bg-[#6264A7] text-white shadow-md border-[#6264A7]'
                          : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-[#6264A7]/50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                {/* Freccia destra */}
                <button
                  type="button"
                  onClick={() => scrollCategorySlider('right')}
                  className="flex-shrink-0 bg-white border border-blue-200 rounded-full p-1 shadow-md hover:bg-blue-50 hover:border-[#6264A7] transition-all z-10 h-7 w-7 flex items-center justify-center"
                  aria-label="Scorri a destra"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-[#6264A7]" />
                </button>
              </div>

              {/* Emoji della categoria selezionata */}
              <div 
                key={selectedEmojiCategory}
                className="max-h-36 overflow-y-auto overflow-x-hidden"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#93c5fd #dbeafe'
                }}
              >
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { 
                      id: 'piu-utilizzate', 
                      emojis: mostUsedEmojis.length > 0 
                        ? mostUsedEmojis 
                        : ['✅', '❌', '👍', '👎', '❤️', '🎉', '🔥', '💯', '🚀', '✨', '💡', '📝', '📋', '📊', '📈', '🎯', '⭐', '💬', '🔔', '📢'] 
                    },
                    { id: 'celebrazioni', emojis: ['🎉', '🎊', '🎈', '🎁', '🎂', '🍾', '🥳', '🎆', '🎇', '✨', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹'] },
                    { id: 'documenti', emojis: ['📋', '📝', '📄', '📑', '📊', '📈', '📉', '📌', '📍', '📎', '📏', '📐', '📒', '📓', '📔', '📕', '📗', '📘', '📙', '📚'] },
                    { id: 'check', emojis: ['✅', '✔️', '✓', '☑️', '✓️', '👌', '👍', '🎯', '⭐', '🌟', '💫', '✨', '💯', '🔥', '💪', '👏', '🙌', '🤝', '🤲', '✋'] },
                    { id: 'comunicazione', emojis: ['💬', '📢', '🔔', '📣', '📮', '✉️', '📧', '💌', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📯', '📰', '📻'] },
                    { id: 'tecnologia', emojis: ['🚀', '💡', '⚡', '🔥', '💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '💿', '📀', '🖨️', '🖲️', '🖱', '⌚', '📟', '📠', '☎️', '📞'] },
                    { id: 'persone', emojis: ['👥', '👤', '👨‍💼', '👩‍💼', '🤝', '👫', '👬', '👭', '👯', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👨‍👦', '👨‍👧', '👩‍👦'] },
                    { id: 'frecce', emojis: ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↔️', '↕️', '🔄', '🔁', '⏩', '⏪', '⏫', '⏬', '🔀', '🔂', '🔃', '🔄', '🔁', '▶️'] },
                    { id: 'oggetti', emojis: ['🔍', '🔎', '📌', '📎', '📏', '📐', '✂️', '📦', '📬', '📭', '🗂️', '📁', '📂', '🗂', '🗄️', '🗃️', '🗳️', '🗞️', '📰', '📄'] },
                    { id: 'emozioni', emojis: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '☺️', '🙃', '😋', '😛'] },
                    { id: 'successo', emojis: ['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎖', '👑', '💎', '💍', '🌹', '🥀', '🌺', '🌻', '🌷', '🌼', '🌸', '💐', '🌾'] },
                    { id: 'tempo', emojis: ['⏰', '⏱️', '⏲️', '🕐', '📅', '📆', '🗓️', '📆', '🗂️', '📁', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'] },
                    { id: 'sicurezza', emojis: ['🔐', '🔒', '🔓', '🔑', '🗝️', '💼', '👜', '🎒', '📿', '📿', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔓', '🔐', '🔒', '🔓'] },
                    { id: 'cibo', emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🥞', '🥐', '🥨', '🧀', '🥖', '🥨', '🥯', '🥞', '🧇', '🥓', '🥩'] },
                    { id: 'natura', emojis: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️'] },
                    { id: 'sport', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '🥍', '🏹', '🎣', '🥊'] },
                    { id: 'trasporti', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍'] },
                    { id: 'luoghi', emojis: ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌'] },
                    { id: 'simboli', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'] },
                    { id: 'numeri', emojis: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'] },
                    { id: 'forme', emojis: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️'] },
                    { id: 'giochi', emojis: ['🎯', '🎲', '🎮', '🕹️', '🎰', '🧩', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🧶', '🪡', '🪢'] }
                  ].find(cat => cat.id === selectedEmojiCategory)?.emojis.map((emoji, index) => (
                    <button
                      key={`${selectedEmojiCategory}-${emoji}-${index}`}
                      type="button"
                      onMouseDown={(e) => {
                        // Previeni il blur del campo quando si clicca sull'emoji
                        e.preventDefault();
                        // Inserisci l'emoji immediatamente
                        insertEmoji(emoji, e);
                      }}
                      onClick={(e) => {
                        // Previeni il comportamento di default
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="emoji-button text-2xl hover:scale-125 transition-transform cursor-pointer p-1.5 rounded hover:bg-blue-100 active:scale-110"
                      title={`Clicca per ${focusedField ? 'inserire' : 'copiare'} ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-[#6264A7]/20 pt-4 px-6 pb-6 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsTeamsDialogOpen(false)}
              disabled={isSendingTeams}
            >
              Annulla
            </Button>
            <Button
              variant="teams"
              onClick={handleSendTeamsNotification}
              disabled={isSendingTeams || !teamsTitle.trim() || !teamsText.trim()}
            >
              {isSendingTeams ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Invio in corso...
                </>
              ) : (
                <>
                  <img 
                    src="/microsoft_office_teams_logo.png" 
                    alt="Teams" 
                    className="h-4 w-4 mr-2"
                  />
                  Pubblica
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 