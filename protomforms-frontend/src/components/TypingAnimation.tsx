'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = [
  'ascoltare la tua voce',
  'dare valore alle tue idee',
  'raccogliere esperienze reali',
  'migliorare grazie a te',
  'costruire insieme qualcosa di migliore',
  'capire ciò che conta davvero'
];

export default function TypingAnimation() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    if (isWaiting) {
      const waitTimeout = setTimeout(() => {
        setIsWaiting(false);
        setIsDeleting(true);
      }, 2000); // Aspetta 2 secondi prima di cancellare
      return () => clearTimeout(waitTimeout);
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Sta scrivendo
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        } else {
          // Parola completata, aspetta
          setIsWaiting(true);
        }
      } else {
        // Sta cancellando
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          // Cancellazione completata, passa alla parola successiva
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100); // Cancella più velocemente di quanto scrive

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, isWaiting, currentWordIndex]);

  return (
    <motion.span 
      className="text-5xl lg:text-6xl font-bold text-[#FFCD00] min-h-[1.2em] inline-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayedText}
      <motion.span
        className="inline-block w-1 h-[0.9em] bg-[#FFCD00] ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </motion.span>
  );
} 