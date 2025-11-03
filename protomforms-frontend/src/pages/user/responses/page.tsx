import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Calendar, Eye, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Answer {
  id: string;
  questionId: string;
  value: any;
}

interface Response {
  id: string;
  formId: string;
  createdAt: string;
  progressiveNumber?: number;
  score?: number;
  form: {
    id: string;
    title: string;
    description?: string;
    slug?: string;
  };
  answers: Answer[];
}

export default function UserResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUserResponses();
  }, []);

  const fetchUserResponses = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add userId header if user is authenticated but no NextAuth session
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }
      
      const res = await fetch('/api/users/responses', {
        credentials: 'include',
        headers
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Autenticazione richiesta');
          return;
        }
        throw new Error('Errore nel caricamento delle risposte');
      }
      
      const data = await res.json();
      
      // Filtra solo le risposte dell'utente corrente (se l'API non lo fa già)
      // Per ora assumiamo che l'API restituisca già solo le risposte dell'utente
      setResponses(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Errore durante il caricamento delle risposte');
      console.error('Error fetching user responses:', err);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
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
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Le Mie Risposte
          </h1>
          <p className="text-lg text-gray-600">
            Visualizza tutte le risposte che hai inviato
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Risposte Totali</p>
                  <p className="text-3xl font-bold text-gray-900">{responses.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-[#FFCD00]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Form Completati</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Set(responses.map(r => r.formId)).size}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#FFCD00]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Ultima Risposta</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {responses.length > 0 
                      ? formatDate(responses[0].createdAt).split(',')[0]
                      : 'Nessuna'
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-[#FFCD00]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Responses List */}
        {error ? (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow bg-white">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <MessageSquare className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Errore</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={fetchUserResponses} className="bg-[#FFCD00] text-black hover:bg-[#FFCD00]/90">
                  Riprova
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : responses.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <MessageSquare className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Nessuna risposta trovata</h3>
                <p className="text-gray-600 mb-6">
                  Non hai ancora inviato nessuna risposta. Inizia a partecipare ai form disponibili!
                </p>
                <Button 
                  asChild
                  className="bg-[#FFCD00] text-black hover:bg-[#FFCD00]/90"
                >
                  <Link to="/user/forms">
                    <FileText className="mr-2 h-4 w-4" />
                    Vai ai Form Disponibili
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-4">
            {responses.map((response) => (
              <motion.div key={response.id} variants={itemVariants}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover:border-b-4 hover:border-[#FFCD00]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{response.form.title}</CardTitle>
                        {response.form.description && (
                          <CardDescription className="text-gray-600">
                            {response.form.description}
                          </CardDescription>
                        )}
                      </div>
                      {response.score !== undefined && response.score !== null && (
                        <Badge className="bg-[#FFCD00] text-black">
                          Punteggio: {response.score}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-[#FFCD00]" />
                          <span>{formatDate(response.createdAt)}</span>
                        </div>
                        {response.progressiveNumber && (
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-[#FFCD00]" />
                            <span>Risposta #{response.progressiveNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{response.answers.length} risposte</span>
                        </div>
                      </div>
                      {response.form.slug && response.progressiveNumber ? (
                        <Button
                          asChild
                          variant="outline"
                          className="border-black text-black hover:bg-[#FFCD00] hover:border-[#FFCD00]"
                        >
                          <Link to={`/user/responses/${response.form.slug}/${response.progressiveNumber}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          className="border-gray-300 text-gray-400"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizza
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
