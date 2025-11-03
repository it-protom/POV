'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { FormInput, CheckSquare, Share2, BarChart3 } from 'lucide-react';
import { useRef } from 'react';

export function AnimatedFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -50]);

  return (
    <motion.div 
      ref={containerRef}
      className="w-full bg-white py-16 relative overflow-hidden"
      style={{ opacity, y }}
    >
      <div className="container mx-auto px-4">
        <motion.h2 
          className="text-3xl font-semibold text-center text-protom-gray mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          Tutto ciò che ti serve per i tuoi moduli
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1]
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureItem
              icon={<FormInput className="w-8 h-8 text-protom-yellow" />}
              title="Creazione Semplice"
              description="Crea moduli professionali in pochi minuti con vari tipi di domande: scelta multipla, testo, valutazioni e altro."
              delay={0.1}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1]
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureItem
              icon={<CheckSquare className="w-8 h-8 text-protom-yellow" />}
              title="Quiz e Valutazioni"
              description="Imposta risposte corrette, assegna punteggi e fornisci feedback automatico per i quiz."
              delay={0.2}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1]
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureItem
              icon={<Share2 className="w-8 h-8 text-protom-yellow" />}
              title="Condivisione Facile"
              description="Condividi i tuoi moduli tramite link o QR code. Controlla chi può accedere e rispondere."
              delay={0.3}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.7, 
              delay: 0.4,
              ease: [0.22, 1, 0.36, 1]
            }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureItem
              icon={<BarChart3 className="w-8 h-8 text-protom-yellow" />}
              title="Analisi Dettagliate"
              description="Visualizza risposte e statistiche in tempo reale. Esporta i risultati in Excel."
              delay={0.4}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <motion.div 
        className="absolute top-1/4 right-0 w-64 h-64 bg-protom-yellow/5 rounded-full -z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          delay: 0.5
        }}
        viewport={{ once: true }}
      />
      <motion.div 
        className="absolute bottom-1/4 left-0 w-48 h-48 bg-protom-gray/5 rounded-full -z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          delay: 0.7
        }}
        viewport={{ once: true }}
      />
    </motion.div>
  );
}

function FeatureItem({ 
  icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay?: number;
}) {
  return (
    <motion.div 
      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-300"
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay
      }}
    >
      <motion.div 
        className="flex-shrink-0 p-2 bg-white rounded-full shadow-sm"
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {icon}
      </motion.div>
      <div>
        <motion.h3 
          className="text-xl font-medium text-protom-gray mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + delay }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-gray-600"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + delay }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
} 