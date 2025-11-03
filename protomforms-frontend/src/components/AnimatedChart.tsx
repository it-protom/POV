'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedChartProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  title?: string;
  description?: string;
}

export function AnimatedChart({ 
  children, 
  className = '', 
  delay = 0,
  title,
  description
}: AnimatedChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true, margin: "-50px" }}
      className={`bg-white p-6 rounded-lg shadow-sm ${className}`}
    >
      {title && (
        <motion.h3 
          className="text-lg font-medium text-protom-gray mb-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.1 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
      )}
      
      {description && (
        <motion.p 
          className="text-sm text-gray-500 mb-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.7, 
          delay: delay + 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
        viewport={{ once: true }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
} 