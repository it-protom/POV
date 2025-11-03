import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, ChevronDown, ChevronRight, Users, FileText, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authenticatedFetch } from '@/lib/utils';

interface Answer {
  id: string;
  questionId: string;
  value: string | number | string[] | Date | null | any;
}

interface Response {
  id: string;
  formId: string;
  createdAt: string;
  progressiveNumber: number;
  score?: number;
  form: {
    title: string;
    description?: string;
    isAnonymous: boolean;
    slug: string;
  };
  answers: Answer[];
  user?: {
    name?: string;
    email?: string;
  };
}

interface FormGroup {
  formId: string;
  formTitle: string;
  formDescription?: string;
  responses: Response[];
  totalResponses: number;
  uniqueUsers: number;
  lastResponse: string;
}

export default function ResponsesPage() {
  const [formGroups, setFormGroups] = useState<FormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedForm, setExpandedForm] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const res = await authenticatedFetch('/api/responses', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch responses');
      }
      const data = await res.json();
      
      // Raggruppa le risposte per form
      const groupedData = groupResponsesByForm(data);
      setFormGroups(groupedData);
      setError(null);
    } catch (err) {
      setError('Error loading responses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupResponsesByForm = (responses: Response[]): FormGroup[] => {
    const groups: { [key: string]: FormGroup } = {};

    responses.forEach(response => {
      if (!groups[response.formId]) {
        groups[response.formId] = {
          formId: response.formId,
          formTitle: response.form.title,
          formDescription: response.form.description,
          responses: [],
          totalResponses: 0,
          uniqueUsers: 0,
          lastResponse: ''
        };
      }

      groups[response.formId].responses.push(response);
      groups[response.formId].totalResponses++;
    });

    // Calcola statistiche per ogni gruppo
    Object.values(groups).forEach(group => {
      const uniqueUserIds = new Set(group.responses.map(r => {
        // Per form anonimi, non contiamo l'email dell'utente
        if (r.form.isAnonymous) return 'anonymous';
        return r.user?.email || 'anonymous';
      }));
      group.uniqueUsers = uniqueUserIds.size;
      
      const sortedResponses = group.responses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      group.lastResponse = sortedResponses[0]?.createdAt || '';
    });

    // Ordina per numero di risposte decrescente
    return Object.values(groups).sort((a, b) => b.totalResponses - a.totalResponses);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Ora';
    if (diffInHours < 24) return `${diffInHours}h fa`;
    if (diffInHours < 48) return 'Ieri';
    return formatDate(dateString);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const formatAnswerPreview = (value: any): string => {
    // Controlla null/undefined
    if (value === null || value === undefined) {
      return '';
    }
    
    // Se è una stringa vuota o solo spazi
    if (typeof value === 'string' && value.trim() === '') {
      return '';
    }
    
    // Se è un array, mostra i primi valori separati da virgola
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      // Filtra valori vuoti
      const nonEmptyValues = value.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (nonEmptyValues.length === 0) return '';
      const preview = nonEmptyValues.slice(0, 3).map(v => String(v)).join(', ');
      return nonEmptyValues.length > 3 ? `${preview}... (+${nonEmptyValues.length - 3})` : preview;
    }
    
    // Se è un oggetto, prova a estrarre valori utili
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const values = Object.values(value).filter(v => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string' && v.trim() === '') return false;
        return true;
      });
      if (values.length === 0) return '';
      return values.slice(0, 3).map(v => String(v)).join(', ');
    }
    
    // Se è una data
    if (value instanceof Date) {
      return value.toLocaleDateString('it-IT');
    }
    
    // Per numeri, converti in stringa
    if (typeof value === 'number') {
      return value.toString();
    }
    
    // Converti in stringa e controlla che non sia vuota
    const stringValue = String(value);
    return stringValue.trim() === '' ? '' : stringValue;
  };

  const getResponsePreview = (answers: Answer[]): string => {
    if (!Array.isArray(answers) || answers.length === 0) {
      return 'Nessuna risposta fornita';
    }
    
    // Prova a trovare la prima risposta con valore non vuoto
    for (const answer of answers) {
      if (!answer || !answer.hasOwnProperty('value')) {
        continue;
      }
      
      const preview = formatAnswerPreview(answer.value);
      
      if (preview && preview.trim() !== '') {
        // Se è troppo lunga, troncala
        if (preview.length > 100) {
          return preview.slice(0, 100) + '...';
        }
        return preview;
      }
    }
    
    return 'Nessuna risposta fornita';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFCD00]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
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
          <Link 
            to="/admin/dashboard"
            className="inline-flex items-center text-[#868789] hover:text-black transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Torna alla Dashboard
          </Link>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h1 className="text-3xl font-bold text-[#868789] mb-2">
              Risposte ai Form
            </h1>
            <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-4"></div>
            <p className="text-gray-600">
              Visualizza e gestisci tutte le risposte raggruppate per form
            </p>
          </div>
        </motion.div>

        {/* Statistiche generali */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Form Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{formGroups.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risposte Totali</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formGroups.reduce((sum, group) => sum + group.totalResponses, 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utenti Unici</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(formGroups.flatMap(group => 
                      group.responses.map(r => {
                        // Per form anonimi, non contiamo l'email dell'utente
                        if (r.form.isAnonymous) return 'anonymous';
                        return r.user?.email || 'anonymous';
                      })
                    )).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista form raggruppati */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Accordion type="single" collapsible value={expandedForm || undefined} onValueChange={setExpandedForm}>
            {formGroups.map((group, index) => (
              <motion.div
                key={group.formId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem value={group.formId} className="border-0">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                    <AccordionTrigger className="hover:no-underline">
                      <CardContent className="p-6 w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-[#FFCD00]/10 rounded-lg">
                                <FileText className="h-6 w-6 text-[#FFCD00]" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-[#868789] mb-1">
                                  {group.formTitle}
                                </h3>
                                {group.formDescription && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {group.formDescription}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{group.totalResponses} risposte</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{group.uniqueUsers} utenti</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ultima: {formatRelativeDate(group.lastResponse)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#FFCD00] text-black">
                              {group.totalResponses}
                            </Badge>
                            <ChevronDown className="h-5 w-5 text-gray-400 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      <div className="px-6 pb-6">
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-semibold text-[#868789] mb-4">
                            Risposte degli Utenti
                          </h4>
                          
                          <div className="space-y-4">
                            {group.responses
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((response) => (
                                <motion.div
                                  key={response.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                                                      <div className="flex items-start gap-3 flex-1">
                                    {!response.form.isAnonymous && (
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src="" alt={response.user?.name || 'Anonimo'} />
                                        <AvatarFallback className="bg-[#FFCD00] text-black font-medium">
                                          {getInitials(response.user?.name, response.user?.email)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-medium text-[#868789]">
                                            {response.form.isAnonymous ? 'Anonimo' : (response.user?.name || 'Anonimo')}
                                          </span>
                                          {!response.form.isAnonymous && response.user?.email && (
                                            <span className="text-sm text-gray-500">
                                              ({response.user.email})
                                            </span>
                                          )}
                                          {response.score !== undefined && (
                                            <Badge variant="outline" className="text-xs">
                                              Punteggio: {response.score}
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 mb-2">
                                          {formatDate(response.createdAt)}
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="text-sm text-gray-700">
                                            <span className="font-medium">Anteprima:</span>{' '}
                                            {getResponsePreview(response.answers)}
                                          </div>
                                          
                                          {Array.isArray(response.answers) && response.answers.length > 1 && (
                                            <span className="text-sm text-gray-400">
                                              +{response.answers.length - 1} altre risposte
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Link
                                        to={`/admin/responses/${response.form.slug}/${response.progressiveNumber}`}
                                        className="inline-flex items-center gap-1 text-sm text-[#FFCD00] hover:text-black transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Dettagli
                                      </Link>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {formGroups.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nessuna risposta trovata</p>
              <p className="text-sm">I form non hanno ancora ricevuto risposte.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 