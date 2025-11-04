'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { PlusCircle, FileText, BarChart, Trash2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { usePageLoading, useApiLoading } from '../hooks/use-api-loading';
import { authenticatedFetch } from '../lib/utils';
import { DashboardSkeleton, FormCardSkeleton } from './ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface Form {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  responseCount: number;
  questionCount: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export default function AnimatedDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [totalResponses, setTotalResponses] = useState(0);

  // Hook per gestione loading progressivo
  const { pageReady, dataLoaded, markDataLoaded } = usePageLoading();
  const { isLoading, error, executeWithLoading } = useApiLoading({
    timeout: 3000, // Ridotto perché ora è veloce
    loadingMessage: 'Caricamento dashboard...',
    retryCount: 2
  });

  const fetchForms = async () => {
    const result = await executeWithLoading(async (signal) => {
              // Usa l'endpoint ultra-veloce
        const response = await fetch('/api/forms/fast?limit=6', { signal });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei form');
      }
      
      return response.json();
    });

    if (result) {
      setForms(result.forms);
      
      // Utilizza le statistiche ottimizzate dall'endpoint
      const total = result.stats?.totalResponses || 
                   result.forms.reduce((sum: number, form: any) => sum + (form.responseCount || 0), 0);
      setTotalResponses(total);
      markDataLoaded();
    }
  };

  // Carica i dati dopo che la pagina è pronta
  useEffect(() => {
    if (pageReady) {
      // Ridotto delay perché ora è veloce
      setTimeout(() => {
        fetchForms();
      }, 50);
    }
  }, [pageReady]);

  const handleDeleteForm = async (formId: string) => {
    setFormToDelete(formId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    
    try {
      const response = await authenticatedFetch(`/api/forms/${formToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del form');
      }
      
      toast.success('Form eliminato con successo');
      fetchForms(); // Ricarica la lista dei form
    } catch (error) {
      console.error('Errore nell\'eliminazione del form:', error);
      toast.error('Impossibile eliminare il form');
    } finally {
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Animazioni
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

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const buttonVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95
    }
  };

  // Renderizza sempre la struttura della pagina, anche se i dati non sono ancora caricati
  if (!pageReady) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      className="container mx-auto py-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div 
        className="flex justify-between items-center mb-8"
        variants={itemVariants}
      >
        <div>
          <motion.h1 
            className="text-4xl font-bold text-[#868789] mb-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          >
            Dashboard
          </motion.h1>
          <motion.div 
            className="h-1.5 w-24 bg-[#FFCD00] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />
        </div>
        <Link to="/admin/forms/new">
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button className="flex items-center gap-2 bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black hover:text-black font-semibold text-lg shadow-lg hover:shadow-xl px-8 py-4 rounded-lg">
              <PlusCircle className="h-6 w-6 text-black" />
              <span className="relative top-[-1px]">Nuovo Form</span>
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-[#FFCD00] hover:shadow-xl transition-shadow"
          variants={cardVariants}
          whileHover="hover"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#868789]">Form Totali</h2>
            <motion.div 
              className="p-3 bg-[#FFCD00]/20 rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FileText className="h-7 w-7 text-[#FFCD00]" />
            </motion.div>
          </div>
          <motion.p 
            className="text-5xl font-bold text-[#868789]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          >
            {forms.length}
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-[#FFCD00] hover:shadow-xl transition-shadow"
          variants={cardVariants}
          whileHover="hover"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#868789]">Risposte Totali</h2>
            <motion.div 
              className="p-3 bg-[#FFCD00]/20 rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BarChart className="h-7 w-7 text-[#FFCD00]" />
            </motion.div>
          </div>
          <motion.p 
            className="text-5xl font-bold text-[#868789]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          >
            {totalResponses}
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-[#FFCD00] hover:shadow-xl transition-shadow"
          variants={cardVariants}
          whileHover="hover"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#868789]">Tasso di Risposta</h2>
            <motion.div 
              className="p-3 bg-[#FFCD00]/20 rounded-full"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BarChart className="h-7 w-7 text-[#FFCD00]" />
            </motion.div>
          </div>
          <motion.p 
            className="text-5xl font-bold text-[#868789]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          >
            {forms.length > 0 ? Math.round((totalResponses / forms.length)) : 0}
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div 
        className="mb-8"
        variants={itemVariants}
      >
        <h2 className="text-2xl font-bold text-[#868789] mb-2">Form Recenti</h2>
        <motion.div 
          className="h-1.5 w-16 bg-[#FFCD00] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: 64 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        />
      </motion.div>
      
      {!dataLoaded ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <FormCardSkeleton key={i} />
          ))}
        </motion.div>
      ) : error ? (
        <motion.div 
          className="bg-white p-8 rounded-xl shadow-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-red-500 text-xl mb-4">??</div>
          <p className="text-lg text-[#868789] mb-4">{error}</p>
          <Button 
            onClick={() => fetchForms()}
            className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
          >
            Riprova
          </Button>
        </motion.div>
      ) : forms.length === 0 ? (
        <motion.div 
          className="bg-white p-8 rounded-xl shadow-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 bg-[#FFCD00]/20 rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FileText className="h-10 w-10 text-[#FFCD00]" />
          </motion.div>
          <p className="text-xl text-[#868789] mb-6">Non hai ancora creato nessun form.</p>
          <Link href="/admin/forms/new" className="inline-block">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black hover:text-black font-semibold text-lg shadow-lg hover:shadow-xl px-8 py-4 rounded-lg">
                Crea il tuo primo form
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {forms.map((form, index) => (
            <motion.div 
              key={form.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              variants={cardVariants}
              whileHover="hover"
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#868789] mb-2">{form.title}</h3>
                    <p className="text-sm text-[#868789]/70 mb-4">{form.description || 'Nessuna descrizione'}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteForm(form.id)}
                    className="text-[#868789]/50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                </div>
                
                <div className="flex items-center justify-between text-sm text-[#868789]/70 mb-6">
                  <div>
                    <span className="font-medium">{form.responseCount || 0}</span> risposte
                  </div>
                  <div>
                    Creato il {formatDate(form.createdAt)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link to={`/admin/forms/${form.id}`} className="col-span-2">
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2 border-[#FFCD00] text-[#868789] hover:bg-[#FFCD00] hover:text-black transition-all font-medium py-3">
                        <Eye className="h-5 w-5" />
                        Visualizza
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to={`/admin/forms/${form.id}/edit`}>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2 border-[#FFCD00] text-[#868789] hover:bg-[#FFCD00] hover:text-black transition-all font-medium py-3">
                        <Edit className="h-5 w-5" />
                        Modifica
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to={`/admin/forms/${form.id}/responses`}>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-2 border-[#FFCD00] text-[#868789] hover:bg-[#FFCD00] hover:text-black transition-all font-medium py-3">
                        <BarChart className="h-5 w-5" />
                        Risultati
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Form</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo form? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
} 
