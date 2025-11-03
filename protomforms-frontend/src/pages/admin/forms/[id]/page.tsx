import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useParams } from "react-router-dom";
import { authenticatedFetch } from '@/lib/utils';

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
  const { toast, toasts } = useToast();

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
                  Risultati
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
    </motion.div>
  );
} 