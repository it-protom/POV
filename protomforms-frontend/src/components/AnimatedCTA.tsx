'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

export function AnimatedCTA() {
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
      className="container mx-auto text-center py-16 px-4 relative overflow-hidden"
      style={{ opacity, y }}
    >
      <motion.div 
        className="max-w-2xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.h2 
          className="text-3xl font-semibold text-protom-gray mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Inizia a creare i tuoi moduli
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Accedi con il tuo account Microsoft aziendale per iniziare subito
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href="/api/auth/signin"
              className="inline-block bg-protom-yellow text-black px-8 py-4 rounded-md font-semibold text-lg hover:bg-[#FFD700] transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Accedi con Microsoft
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Decorative elements */}
      <motion.div 
        className="absolute top-0 left-1/4 w-64 h-64 bg-protom-yellow/10 rounded-full -z-10"
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
        className="absolute bottom-0 right-1/4 w-48 h-48 bg-protom-gray/10 rounded-full -z-10"
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
