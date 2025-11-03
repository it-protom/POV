'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
// Image removed - use regular img;
import { useRef } from 'react';

export function AnimatedHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.div 
      ref={containerRef}
      className="w-full bg-white py-16 border-b relative overflow-hidden"
      style={{ y, opacity }}
    >
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
        <motion.div 
          className="lg:w-1/2 mb-8 lg:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2
          }}
        >
          <motion.h1 
            className="text-4xl lg:text-5xl font-semibold text-protom-gray mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.4,
              ease: "easeOut"
            }}
          >
            Benvenuto in<br />
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.6,
                ease: "easeOut"
              }}
            >
              
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.6,
              ease: "easeOut"
            }}
          >
            Crea facilmente sondaggi e quiz.<br />
            Raccogli risposte e analizza i risultati in tempo reale.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.8,
              ease: "easeOut"
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/api/auth/signin"
                className="inline-block bg-protom-yellow text-white px-6 py-3 rounded-md font-medium text-lg hover:bg-protom-gray transition-colors duration-300"
              >
                Accedi con Microsoft
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div 
          className="lg:w-1/2"
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ 
            duration: 1, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.3
          }}
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Image
              src="/images/forms-hero.png"
              alt="ProtomForms Preview"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Decorative elements */}
      <motion.div 
        className="absolute top-0 right-0 w-64 h-64 bg-protom-yellow/10 rounded-full -z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          delay: 0.5
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-48 h-48 bg-protom-gray/10 rounded-full -z-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          delay: 0.7
        }}
      />
    </motion.div>
  );
} 
