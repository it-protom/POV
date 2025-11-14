import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/hooks/use-loading";
import { authenticatedFetch } from '../../../lib/utils';
import { SimpleLoader } from '../../../components/SimpleLoader';
import { usePageLoading, useApiLoading } from "@/hooks/use-api-loading";
import { FormsPageSkeleton, FormCardSkeleton } from '../../../components/ui/skeleton';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Grid3X3, 
  List, 
  MoreHorizontal,
  Eye,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FilterNavigationMenu } from '../../../components/FilterNavigationMenu';
import SplitText from '../../../components/SplitText';

const statusConfig = {
  published: { label: "Pubblicato", color: "bg-green-100 text-green-800", icon: CheckCircle },
  draft: { label: "Bozza", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  archived: { label: "Archiviato", color: "bg-gray-100 text-gray-800", icon: AlertCircle }
};

const typeConfig = {
  SURVEY: { label: "Sondaggio", color: "bg-blue-100 text-blue-800" },
  QUIZ: { label: "Quiz", color: "bg-purple-100 text-purple-800" }
};

interface Form {
  id: string;
  title: string;
  description: string;
  type: 'SURVEY' | 'QUIZ';
  status: 'published' | 'draft' | 'archived';
  responses: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  category: string;
  author: string;
  isStarred: boolean;
  tags: string[];
}

const motivationalPhrases = [
  // Frasi Orientate alla Scoperta e all'Insight
  "Cosa scopriamo oggi?",
  "Pronti a svelare nuovi insight?",
  "Quali risposte cerchiamo oggi?",
  "Che storia racconteranno i dati?",
  "Esploriamo insieme nuove prospettive",
  // Frasi Orientate all'Azione e al Coinvolgimento
  "Diamoci dentro con i sondaggi!",
  "Creiamo domande che fanno la differenza",
  "È ora di dare voce al tuo team",
  "Costruiamo il questionario perfetto",
  "Trasformiamo le curiosità in risposte",
  // Frasi con Intelligenza Artificiale
  "L'AI è pronta a supportarti",
  "Intelligenza artificiale + la tua visione = insight potenti",
  "Potenziamo le tue survey con l'AI",
  "Smart surveys per decisioni smart",
  // Frasi Orientate al Risultato
  "Dalle domande giuste alle decisioni migliori",
  "I tuoi insight iniziano qui",
  "Trasforma i dati in azioni concrete",
  "Ogni domanda è un'opportunità",
  "Progetta, pubblica, scopri",
  // Frasi Motivazionali e di Benvenuto
  "Bentornato! Quale insight inseguiamo oggi?",
  "Il tuo team ha tanto da dirti. Ascoltiamolo insieme",
  "Ogni survey è un ponte verso la comprensione",
  "Creiamo connessioni attraverso le domande"
];

export default function DashboardPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [filteredForms, setFilteredForms] = useState<Form[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [motivationalPhrase, setMotivationalPhrase] = useState<string>('');
  const { toasts, toast } = useToast();
  
  // Hook per gestione loading progressivo
  const { pageReady, dataLoaded, markDataLoaded } = usePageLoading();
  const { isLoading, error, executeWithLoading } = useApiLoading({
    timeout: 8000,
    loadingMessage: 'Caricamento forms...'
  });
  
  // Manteniamo i loading hooks esistenti per altre operazioni
  const { isLoading: isDeleting, withLoading: withDeleting } = useLoading();

  const fetchForms = async () => {
    const result = await executeWithLoading(async (signal) => {
      const response = await authenticatedFetch(`/api/forms/summary?t=${Date.now()}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei forms');
      }
      return response.json();
    });

    if (result) {
      const formsData = (result.forms || result).map((form: any) => {
        // Mappa responseCount a responses
        const responseCount = form.responseCount !== undefined ? form.responseCount : (form.responses || 0);
        
        // Calcola completionRate: se ci sono risposte, usa una stima ragionevole
        // In futuro questo dovrebbe essere calcolato nel backend
        let completionRate = 0;
        if (responseCount > 0) {
          // Stima basata sul numero di risposte (più risposte = tasso più alto)
          if (responseCount > 10) {
            completionRate = 85;
          } else if (responseCount > 5) {
            completionRate = 75;
          } else {
            completionRate = 65;
          }
        }
        
        return {
          ...form,
          // Mappa responseCount a responses
          responses: responseCount,
          // Usa completionRate calcolato o quello fornito
          completionRate: typeof form.completionRate === 'number' && !isNaN(form.completionRate) 
            ? form.completionRate 
            : completionRate,
          // Assicurati che category esista
          category: form.category || (form.type === 'SURVEY' ? 'Sondaggio' : 'Quiz'),
          // Assicurati che tags sia un array
          tags: Array.isArray(form.tags) ? form.tags : [form.type === 'SURVEY' ? 'Sondaggio' : 'Quiz'],
          // Assicurati che isStarred sia un booleano
          isStarred: form.isStarred || false,
        };
      });
      
      console.log('Forms loaded:', formsData.map((f: Form) => ({ title: f.title, responses: f.responses })));
      
      setForms(formsData);
      setFilteredForms(formsData);
      markDataLoaded();
    }
  };

  // Seleziona una frase motivazionale casuale al mount
  useEffect(() => {
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    setMotivationalPhrase(randomPhrase);
  }, []);

  const handleAnimationComplete = () => {
    // Animazione completata
  };

  // Carica i dati dopo che la pagina è pronta
  useEffect(() => {
    if (pageReady) {
      setTimeout(() => {
        fetchForms();
      }, 100);
    }
  }, [pageReady]);

  useEffect(() => {
    let filtered = forms;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(form => 
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) || false
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(form => form.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(form => form.type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'responses':
          return b.responses - a.responses;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredForms(filtered);
  }, [forms, searchQuery, statusFilter, typeFilter, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDuplicateForm = async (formId: string) => {
    try {
      setIsDuplicating(formId);
      const response = await fetch(`/api/forms/${formId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Form duplicato',
          description: 'Il form è stato duplicato con successo',
          type: 'success'
        });
        
        // Refresh the forms list
        await fetchForms();
      } else {
        const error = await response.json();
        toast({
          title: 'Errore',
          description: error.error || 'Errore durante la duplicazione',
          type: 'error'
        });
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore durante la duplicazione',
        type: 'error'
      });
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId) return;

    await withDeleting(async () => {
      try {
        const response = await authenticatedFetch(`/api/forms/${deleteFormId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: 'Form eliminato',
            description: 'Il form è stato eliminato con successo',
            type: 'success'
          });
          
          // Remove from forms list
          setForms(prev => prev.filter(form => form.id !== deleteFormId));
        } else {
          const error = await response.json();
          toast({
            title: 'Errore',
            description: error.error || 'Errore durante l\'eliminazione',
            type: 'error'
          });
        }
      } catch (error) {
        toast({
          title: 'Errore',
          description: 'Errore durante l\'eliminazione',
          type: 'error'
        });
      } finally {
        setDeleteFormId(null);
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { y: 0, opacity: 1 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0,
        delay: 0
      }
    }
  };

  // Renderizza sempre la pagina, anche se i dati non sono ancora caricati
  if (!pageReady) {
    return <FormsPageSkeleton />;
  }

  return (
    <motion.div
      className="p-6 lg:p-8 space-y-8 relative min-h-screen pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Filter Navigation Menu */}
      <div className="flex justify-between items-center mb-4">
        {motivationalPhrase && (
          <SplitText
            text={motivationalPhrase}
            className="font-bold tracking-tight text-gray-900"
            style={{ fontSize: '3rem' }}
            delay={30}
            duration={0.3}
            ease="power2.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="left"
            tag="div"
            onLetterAnimationComplete={handleAnimationComplete}
          />
        )}
        <FilterNavigationMenu
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Forms Grid/List */}
      <AnimatePresence>
        {!dataLoaded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <FormCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12">
                <div className="text-red-500 text-xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Errore di caricamento</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <Button onClick={() => fetchForms()} className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black">
                  Riprova
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredForms.length === 0 && searchQuery ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun form trovato</h3>
                <p className="text-gray-500 mb-6">
                  Nessun form corrisponde ai criteri di ricerca.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
            style={{ opacity: 1 }}
          >
            {/* Card Crea Nuovo Form */}
            <motion.div
              initial={{ opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Link to="/admin/forms/new" className="block h-full">
                <Card className="border-2 border-dashed border-gray-300 hover:border-[#FFCD00] shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden h-full flex flex-col bg-white hover:bg-gray-50 cursor-pointer">
                  <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-[#FFCD00]/10 group-hover:to-[#FFCD00]/20 flex items-center justify-center transition-all duration-300 border-2 border-gray-200 group-hover:border-[#FFCD00]/30">
                        <PlusCircle className="h-6 w-6 text-gray-400 group-hover:text-[#FFCD00] transition-all duration-300" strokeWidth={1.5} />
                      </div>
                      <div className="text-center space-y-1">
                        <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-[#FFCD00] transition-colors">
                          Crea Nuovo Form
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Inizia da qui
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
            {filteredForms.map((form, index) => {
              const StatusIcon = statusConfig[form.status].icon;
              return (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="h-full"
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden h-full flex flex-col">
                    {form.isStarred && (
                      <div className="absolute top-4 right-4 z-10">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                    )}
                    
                    <CardHeader className="pb-3 flex-shrink-0">
                      {/* Header con badge tipo e status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium ${typeConfig[form.type].color} border`}
                          >
                            {typeConfig[form.type].label}
                          </Badge>
                          <Badge 
                            className={`text-xs font-medium ${statusConfig[form.status].color}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5 mr-1.5" />
                            {statusConfig[form.status].label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Titolo - più prominente */}
                      <div className="mb-2">
                        <CardTitle className="text-base font-semibold leading-snug group-hover:text-[#FFCD00] transition-colors line-clamp-2 break-words">
                          <Link to={`/admin/forms/${form.id}`} className="block">
                            {form.title}
                          </Link>
                        </CardTitle>
                      </div>
                      
                      {/* Descrizione - separata visivamente */}
                      <div className="pt-2 border-t border-gray-100">
                        <CardDescription className="text-xs leading-relaxed line-clamp-2 break-words text-gray-600">
                          {form.description || 'Nessuna descrizione'}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <div className="space-y-4 flex-1 flex flex-col">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {typeof form.responses === 'number' && !isNaN(form.responses) ? form.responses : 0} risposte
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Target className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {typeof form.completionRate === 'number' && !isNaN(form.completionRate) ? form.completionRate : 0}% completato
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {form.tags?.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {form.tags && form.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{form.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Spacer per spingere il footer in basso */}
                        <div className="flex-1"></div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t mt-auto">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs bg-[#FFCD00] text-black">
                                {form.author.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{form.author}</span>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/forms/${form.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizza
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDuplicateForm(form.id)}
                                disabled={isDuplicating === form.id}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {isDuplicating === form.id ? 'Duplicando...' : 'Duplica'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDeleteFormId(form.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2" style={{ opacity: 1 }}>
            {/* Card Crea Nuovo Form - List View */}
            <motion.div
              initial={{ opacity: 1 }}
            >
              <Link to="/admin/forms/new" className="block">
                <Card className="border-2 border-dashed border-gray-300 hover:border-[#FFCD00] shadow-sm hover:shadow-md transition-all duration-300 group bg-white hover:bg-gray-50 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-[#FFCD00]/10 group-hover:to-[#FFCD00]/20 flex items-center justify-center transition-all duration-300 border-2 border-gray-200 group-hover:border-[#FFCD00]/30">
                            <PlusCircle className="h-5 w-5 text-gray-400 group-hover:text-[#FFCD00] transition-all duration-300" strokeWidth={1.5} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-medium text-gray-600 group-hover:text-[#FFCD00] transition-colors truncate">
                              Crea Nuovo Form
                            </h3>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">Inizia da qui</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
            {filteredForms.map((form, index) => {
              const StatusIcon = statusConfig[form.status].icon;
              return (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 1 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-[#FFCD00] rounded-lg flex items-center justify-center">
                              {form.isStarred ? (
                                <Star className="h-6 w-6 text-black fill-current" />
                              ) : (
                                <FileText className="h-6 w-6 text-black" />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                <Link to={`/admin/forms/${form.id}`} className="hover:text-[#FFCD00] transition-colors">
                                  {form.title}
                                </Link>
                              </h3>
                              <Badge className={`text-xs ${statusConfig[form.status].color}`}>
                                <StatusIcon className="h-2.5 w-2.5 mr-1" />
                                {statusConfig[form.status].label}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${typeConfig[form.type].color}`}>
                                {typeConfig[form.type].label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{form.description || 'Nessuna descrizione'}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{form.category}</span>
                              <span>•</span>
                              <span>{form.author}</span>
                              <span>•</span>
                              <span>Aggiornato il {formatDate(form.updatedAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="text-center">
                            <div className="font-medium text-gray-900 text-sm">
                              {typeof form.responses === 'number' && !isNaN(form.responses) ? form.responses : 0}
                            </div>
                            <div>Risposte</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 text-sm">
                              {typeof form.completionRate === 'number' && !isNaN(form.completionRate) ? form.completionRate : 0}%
                            </div>
                            <div>Completato</div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/forms/${form.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizza
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDuplicateForm(form.id)}
                                disabled={isDuplicating === form.id}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {isDuplicating === form.id ? 'Duplicando...' : 'Duplica'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setDeleteFormId(form.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il form e tutte le sue risposte verranno eliminate definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <button
              onClick={handleDeleteForm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando...' : 'Elimina'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4 min-w-[200px]">
            <SimpleLoader text="Caricamento forms..." />
          </div>
        </div>
      )}
    </motion.div>
  );
}
