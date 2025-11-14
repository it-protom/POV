import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Frasi motivazionali che cambiano ad ogni refresh
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [currentPhrase, setCurrentPhrase] = useState("");

  // Seleziona una frase casuale ad ogni caricamento
  useEffect(() => {
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    setCurrentPhrase(randomPhrase);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E5E5E7] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="text-xl font-semibold text-gray-700">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#E5E5E7]">
      {/* New Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="px-8 py-4 flex items-center justify-between">
          {/* Logo POV a sinistra */}
          <div className="flex items-center">
            <motion.h1
              className="text-4xl font-bold text-[#FFCD00]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              POV
            </motion.h1>
          </div>

          {/* Frase motivazionale a destra */}
          <motion.div
            className="text-gray-700 text-lg font-medium italic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {currentPhrase}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
