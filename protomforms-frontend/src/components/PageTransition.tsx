'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from "react-router-dom";
import { useEffect, useState } from 'react';
import { SimpleLoader } from './SimpleLoader';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simula un breve loading per le transizioni di pagina
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {isLoading && <SimpleLoader />}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
} 