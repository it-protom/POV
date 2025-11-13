import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  Award,
  BookOpen,
  Lightbulb,
  Heart,
  ThumbsUp,
  Eye,
  Play,
  ArrowRight,
  Sparkles,
  User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
// Image removed - use regular img;

interface Form {
  id: string;
  title: string;
  description?: string;
  type: 'SURVEY' | 'QUIZ';
  status: string;
  isPublic: boolean;
  opensAt?: string;
  closesAt?: string;
  maxRepeats?: number | null;
  createdAt: string;
  updatedAt: string;
  questions: any[];
  responses: any[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface UserStats {
  totalResponses: number;
  completedForms: number;
  availableForms: number;
}

const typeConfig = {
  SURVEY: { 
    label: "Sondaggio", 
    color: "bg-[#FFCD00] text-black border-[#FFCD00]",
    icon: BookOpen,
    description: "Raccogli feedback e opinioni"
  },
  QUIZ: { 
    label: "Quiz", 
    color: "bg-black text-white border-black",
    icon: Award,
    description: "Testa le tue conoscenze"
  }
};

const statusConfig = {
  published: { 
    label: "Disponibile", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle 
  },
  draft: { 
    label: "In preparazione", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock 
  },
  archived: { 
    label: "Archiviato", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: AlertCircle 
  }
};

export default function UserFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [filteredForms, setFilteredForms] = useState<Form[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalResponses: 0,
    completedForms: 0,
    availableForms: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [activeTab, setActiveTab] = useState('available');
  const { toast } = useToast();
  const location = useLocation();

  const fetchFormsAndStats = async () => {
    try {
      setIsLoading(true);
      // Usa sempre percorsi relativi /api/... per passare attraverso il proxy Vite
      
      // Fetch forms (critical - must work)
      let formsData: any[] = [];
      let userResponses: any[] = [];
      
      try {
        // Usa sempre il percorso relativo /api/... per passare attraverso il proxy Vite
        // Il proxy Vite reindirizza /api/* a http://localhost:3001/api/*
        const formsUrl = '/api/forms/public';
        
        console.log('🔄 Fetching forms from:', formsUrl);
        
        const formsResponse = await fetch(formsUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          cache: 'no-cache'
        });

        console.log('📡 Forms response status:', formsResponse.status, formsResponse.statusText);

        if (formsResponse.ok) {
          formsData = await formsResponse.json();
          console.log('✅ Forms loaded:', formsData.length);
        } else {
          const errorText = await formsResponse.text().catch(() => 'Unknown error');
          console.error('❌ Forms response not OK:', formsResponse.status, formsResponse.statusText, errorText);
          toast({
            title: 'Errore',
            description: `Impossibile caricare i form (${formsResponse.status}). Riprova più tardi.`,
            variant: 'destructive'
          });
        }
      } catch (formsError: any) {
        console.error('❌ Error fetching forms:', formsError);
        toast({
          title: 'Errore di connessione',
          description: formsError.message || 'Impossibile connettersi al server. Verifica che il backend sia in esecuzione.',
          variant: 'destructive'
        });
      }

      // Il backend già filtra correttamente i form in base a maxRepeats
      // Non serve filtrare ulteriormente nel frontend perché il backend gestisce:
      // - Form con maxRepeats null: sempre disponibili
      // - Form con maxRepeats > 0: disponibili fino a raggiungere il limite
      // Il backend conta le risposte dell'utente e confronta con maxRepeats
      console.log('✅ Forms loaded from backend (already filtered by maxRepeats):', formsData.length);

      // Set the filtered forms
      setForms(formsData);
      setFilteredForms(formsData);

      // Fetch stats (optional - can fail silently)
      try {
        // Usa sempre il percorso relativo /api/... per passare attraverso il proxy Vite
        const statsResponse = await fetch('/api/users/stats', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData);
        } else {
          // User not authenticated or endpoint doesn't exist, set default stats
          setUserStats(prev => ({
            totalResponses: prev.totalResponses,
            completedForms: prev.completedForms,
            availableForms: formsData.length || 0
          }));
        }
      } catch (statsError) {
        // Stats are optional, fail silently but set defaults
        setUserStats(prev => ({
          totalResponses: prev.totalResponses,
          completedForms: prev.completedForms,
          availableForms: formsData.length || 0
        }));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Errore durante il caricamento dei dati',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisci il redirect dopo la compilazione del form
  useEffect(() => {
    if (location.state?.submitted) {
      toast({
        title: 'Form completato!',
        description: `Hai completato con successo il form. Grazie per il tuo contributo!`,
        variant: 'default'
      });
      // Pulisci lo state per evitare di mostrare il messaggio di nuovo
      window.history.replaceState({}, document.title);
      // Ricarica i form per aggiornare le statistiche
      fetchFormsAndStats();
    }
  }, [location.state, toast]);

  useEffect(() => {
    fetchFormsAndStats();
  }, []);

  useEffect(() => {
    let filtered = forms;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(form => 
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.owner.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    setFilteredForms(filtered);
  }, [forms, searchQuery, typeFilter, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTimeRemaining = (closesAt?: string) => {
    if (!closesAt) return null;
    const now = new Date();
    const closeDate = new Date(closesAt);
    const diff = closeDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Scaduto';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} giorni rimanenti`;
    if (hours > 0) return `${hours} ore rimanenti`;
    return 'Poche ore rimanenti';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Partecipa ai nostri{' '}
            <span className="text-[#FFCD00]">sondaggi</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Contribuisci con la tua opinione e aiuta a migliorare i nostri servizi.<br/>Ogni risposta è preziosa per noi!
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FFCD00]" />
                  <Input
                    placeholder="Cerca form, argomenti, autori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border border-gray-200 bg-white focus:border-[#FFCD00] focus:ring-0 transition-colors"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px] border border-gray-200 bg-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="SURVEY">Sondaggi</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] border border-gray-200 bg-white">
                      <SelectValue placeholder="Ordina per" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated">Più recenti</SelectItem>
                      <SelectItem value="created">Data creazione</SelectItem>
                      <SelectItem value="title">Nome</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 w-8 p-0 rounded-md ${viewMode === 'grid' ? 'bg-[#FFCD00] text-black shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 w-8 p-0 rounded-md ${viewMode === 'list' ? 'bg-[#FFCD00] text-black shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Summary */}
        <motion.div variants={itemVariants} className="my-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {filteredForms.length} {filteredForms.length === 1 ? 'form disponibile' : 'form disponibili'}
              {searchQuery && ` per "${searchQuery}"`}
            </p>
            {filteredForms.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageSquare className="h-4 w-4 text-[#FFCD00]" />
                <span>{userStats.totalResponses} risposte totali</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Forms Grid/List */}
        <AnimatePresence>
          {filteredForms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm max-w-xl mx-auto">
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <FileText className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Nessun form trovato</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery ? 
                      'Nessun form corrisponde ai criteri di ricerca.' : 
                      'Al momento non ci sono form disponibili. Torna più tardi!'
                    }
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery('')}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Cancella ricerca
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredForms.map((form, index) => {
                const TypeIcon = typeConfig[form.type].icon;
                const timeRemaining = getTimeRemaining(form.closesAt);
                const isExpired = form.closesAt && new Date(form.closesAt) < new Date();
                
                return (
                  <motion.div
                    key={form.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    layout
                    className="h-full"
                  >
                    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden bg-white h-full flex flex-col border border-gray-100 hover:border-[#FFCD00] hover:border-2">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFCD00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      {/* Status indicator */}
                      {isExpired && (
                        <motion.div 
                          className="absolute top-4 right-4 z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        >
                          <Badge variant="destructive" className="text-xs shadow-md">
                            Scaduto
                          </Badge>
                        </motion.div>
                      )}
                      
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 pr-4">
                            <motion.div 
                              className="flex items-center space-x-2 mb-2"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            >
                              <motion.div 
                                className={`p-2 rounded-lg ${form.type === 'SURVEY' ? 'bg-[#FFCD00]/20' : 'bg-black/10'}`}
                                whileHover={{ rotate: [0, -5, 5, 0] }}
                                transition={{ duration: 0.3 }}
                              >
                                <TypeIcon className={`h-4 w-4 ${form.type === 'SURVEY' ? 'text-[#FFCD00]' : 'text-black'}`} />
                              </motion.div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${typeConfig[form.type].color} shadow-sm`}
                              >
                                {typeConfig[form.type].label}
                              </Badge>
                            </motion.div>
                            <CardTitle className="text-lg leading-tight group-hover:text-[#FFCD00] transition-colors line-clamp-2 font-semibold">
                              {form.title}
                            </CardTitle>
                          </div>
                        </div>
                        
                        <CardDescription className="text-gray-600 line-clamp-2">
                          {form.description || typeConfig[form.type].description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0 relative z-10 flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col">
                          {/* Stats */}
                          <motion.div 
                            className="grid grid-cols-2 gap-4 text-sm mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <motion.div 
                              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 group-hover:bg-[#FFCD00]/10 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              <MessageSquare className="h-4 w-4 text-[#FFCD00]" />
                              <span className="text-gray-600 font-medium">{form.responses.length} risposte</span>
                            </motion.div>
                            <motion.div 
                              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 group-hover:bg-[#FFCD00]/10 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Target className="h-4 w-4 text-[#FFCD00]" />
                              <span className="text-gray-600 font-medium">{form.questions.length} domande</span>
                            </motion.div>
                          </motion.div>

                          {/* Time remaining */}
                          {timeRemaining && !isExpired && (
                            <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-4">
                              <Clock className="h-3 w-3" />
                              <span>{timeRemaining}</span>
                            </div>
                          )}

                          {/* Spacer to push content down */}
                          <div className="flex-1"></div>

                          {/* Author */}
                          <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-100 mb-4">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs bg-[#FFCD00] text-black">
                                {form.owner.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <span>Creato da {form.owner.name}</span>
                          </div>

                          {/* Action Button - Always at bottom */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              asChild
                              className="w-full bg-white border-2 border-black text-black hover:bg-[#FFCD00] hover:border-[#FFCD00] hover:text-black font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                              disabled={!!isExpired}
                            >
                              <Link to={`/forms/${form.id}`}>
                                {isExpired ? (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizza
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Inizia
                                  </>
                                )}
                              </Link>
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* List View */
            <motion.div variants={containerVariants} className="space-y-3">
              {filteredForms.map((form, index) => {
                const TypeIcon = typeConfig[form.type].icon;
                const timeRemaining = getTimeRemaining(form.closesAt);
                const isExpired = form.closesAt && new Date(form.closesAt) < new Date();
                
                return (
                  <motion.div
                    key={form.id}
                    variants={itemVariants}
                    layout
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover:border-b-4 hover:border-[#FFCD00]">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                form.type === 'SURVEY' ? 'bg-[#FFCD00]/20' : 'bg-black/10'
                              }`}>
                                <TypeIcon className={`h-6 w-6 ${
                                  form.type === 'SURVEY' ? 'text-[#FFCD00]' : 'text-black'
                                }`} />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {form.title}
                                </h3>
                                <Badge variant="outline" className={`text-xs ${typeConfig[form.type].color}`}>
                                  {typeConfig[form.type].label}
                                </Badge>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Scaduto
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                                {form.description || typeConfig[form.type].description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Creato da {form.owner.name}</span>
                                <span>•</span>
                                <span>{form.questions.length} domande</span>
                                <span>•</span>
                                <span>{form.responses.length} risposte</span>
                                {timeRemaining && !isExpired && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600">{timeRemaining}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Button 
                              asChild
                              className="bg-white border-2 border-black text-black hover:bg-[#FFCD00] hover:border-[#FFCD00] hover:text-black transition-all duration-300"
                              disabled={!!isExpired}
                            >
                              <Link to={`/forms/${form.id}`}>
                                {isExpired ? (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizza
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Inizia
                                  </>
                                )}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call to Action */}
        {filteredForms.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <Card className="border-2 border-[#FFCD00] shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Heart className="h-6 w-6 text-[#FFCD00]" />
                  <h3 className="text-2xl font-bold text-gray-900">La tua opinione conta!</h3>
                </div>
                <p className="text-gray-700 text-lg mb-6 max-w-2xl mx-auto">
                  Ogni risposta ci aiuta a migliorare i nostri servizi. 
                  Grazie per il tuo prezioso contributo!
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-[#FFCD00]" />
                    <span>Risposte anonime</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-[#FFCD00]" />
                    <span>5 minuti per completare</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 
