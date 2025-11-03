'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { FormInput, CheckSquare, Layout } from 'lucide-react';
import { useRef } from 'react';

export function AnimatedQuickActions() {
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
      className="container mx-auto py-12 px-4"
      style={{ opacity, y }}
    >
      <motion.h2 
        className="text-3xl font-semibold text-center text-protom-gray mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        Azioni Rapide
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <QuickActionCard
            title="Nuovo Sondaggio"
            description="Raccogli feedback e opinioni"
            icon={<FormInput className="w-6 h-6" />}
            delay={0.2}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <QuickActionCard
            title="Nuovo Quiz"
            description="Crea test con valutazione automatica"
            icon={<CheckSquare className="w-6 h-6" />}
            delay={0.4}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <QuickActionCard
            title="Da Modello"
            description="Usa un modello preimpostato"
            icon={<Layout className="w-6 h-6" />}
            delay={0.6}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ 
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
    <Link href="/api/auth/signin">
      <motion.div
        whileHover={{ 
          scale: 1.03,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          delay
        }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
          <CardContent className="p-6 flex items-start space-x-4">
            <motion.div 
              className="text-protom-yellow"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="font-medium text-lg text-protom-gray">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
} 
