'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedFormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  title?: string;
  description?: string;
}

export function AnimatedForm({ 
  children, 
  className = '', 
  onSubmit,
  title,
  description
}: AnimatedFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`bg-white p-6 rounded-lg shadow-sm ${className}`}
    >
      {title && (
        <motion.h2 
          className="text-2xl font-semibold text-protom-gray mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {title}
        </motion.h2>
      )}
      
      {description && (
        <motion.p 
          className="text-gray-500 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}
      
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {children}
      </motion.form>
    </motion.div>
  );
} 