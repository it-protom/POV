'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { ThemeV2 } from '@/types/theme';
import { cn } from '@/lib/utils';

interface ProgressBarWithCheckpointsProps {
  totalQuestions: number;
  currentQuestion: number;
  completedQuestions: number[];
  theme?: Partial<ThemeV2>;
  className?: string;
  onCheckpointClick?: (index: number) => void;
  showLabels?: boolean;
}

export function ProgressBarWithCheckpoints({
  totalQuestions,
  currentQuestion,
  completedQuestions,
  theme,
  className,
  onCheckpointClick,
  showLabels = false,
}: ProgressBarWithCheckpointsProps) {
  const primaryColor = theme?.primaryColor || '#3b82f6';

  // Calcola la posizione dei checkpoint (distribuiti uniformemente)
  const getCheckpointPosition = (index: number) => {
    if (totalQuestions === 1) return 50; // Centrato se c'è solo una domanda
    // Distribuzione uniforme: primo checkpoint all'inizio, ultimo alla fine
    return (index / (totalQuestions - 1)) * 100;
  };

  // La barra si ferma esattamente al checkpoint della domanda corrente
  const progressPercentage = getCheckpointPosition(currentQuestion);

  // Determina lo stato di un checkpoint
  const getCheckpointState = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (completedQuestions.includes(index)) {
      return 'completed';
    }
    if (index === currentQuestion) {
      return 'current';
    }
    if (index < currentQuestion) {
      return 'completed';
    }
    return 'upcoming';
  };

  // Converti hex color in RGB per gestire opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // default blue
  };

  const rgb = hexToRgb(primaryColor);
  const primaryColorRgb = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Animazione per il checkpoint corrente
  const pulseAnimation = {
    scale: [1, 1.15, 1],
  };

  const glowAnimation = {
    scale: [1, 1.3, 1],
    opacity: [0.4, 0, 0.4],
  };

  const transition = {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  return (
    <div className={cn('w-full py-6', className)}>
      {/* Container principale */}
      <div className="relative w-full max-w-5xl mx-auto px-6">
        {/* Barra di progresso di base */}
        <div className="relative h-2.5 w-full rounded-full overflow-hidden shadow-inner"
          style={{
            backgroundColor: theme?.backgroundColor ? `${theme.backgroundColor}15` : 'rgba(229, 231, 235, 0.8)',
          }}>
          {/* Barra di progresso */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, rgba(${primaryColorRgb}, 0.85))`,
              boxShadow: `0 0 10px rgba(${primaryColorRgb}, 0.3)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Checkpoint container */}
        <div className="relative -mt-6 mb-4">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const position = getCheckpointPosition(index);
            const state = getCheckpointState(index);
            const isClickable = onCheckpointClick && (state === 'completed' || state === 'current');

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {/* Checkpoint */}
                <motion.button
                  type="button"
                  onClick={() => isClickable && onCheckpointClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex flex-col items-center gap-2 transition-all',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-default'
                  )}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {/* Anello esterno glow per stato corrente */}
                  {state === 'current' && (
                    <>
                      <motion.div
                        className="absolute top-0 rounded-full"
                        style={{
                          width: '52px',
                          height: '52px',
                          backgroundColor: `rgba(${primaryColorRgb}, 0.1)`,
                        }}
                        animate={glowAnimation}
                        transition={transition}
                      />
                      <motion.div
                        className="absolute top-0 rounded-full"
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: `rgba(${primaryColorRgb}, 0.15)`,
                        }}
                        animate={glowAnimation}
                        transition={{ ...transition, delay: 0.3 }}
                      />
                    </>
                  )}

                  {/* Checkpoint principale */}
                  <motion.div
                    className={cn(
                      'relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all font-bold text-sm',
                    )}
                    style={{
                      backgroundColor: state === 'completed'
                        ? primaryColor
                        : state === 'current'
                        ? 'white'
                        : '#f3f4f6',
                      borderColor: state === 'completed' || state === 'current'
                        ? primaryColor
                        : '#d1d5db',
                      borderWidth: state === 'current' ? '3px' : '2px',
                      borderStyle: 'solid',
                      boxShadow:
                        state === 'current'
                          ? `0 0 0 4px rgba(${primaryColorRgb}, 0.15), 0 4px 12px rgba(${primaryColorRgb}, 0.25)`
                          : state === 'completed'
                          ? `0 2px 10px rgba(${primaryColorRgb}, 0.3)`
                          : '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    animate={state === 'current' ? pulseAnimation : {}}
                    transition={state === 'current' ? transition : {}}
                  >
                    {/* Numero o icona */}
                    {state === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2
                          className="w-6 h-6"
                          style={{ color: 'white' }}
                          strokeWidth={2.5}
                        />
                      </motion.div>
                    ) : (
                      <motion.span
                        className="font-bold"
                        style={{
                          color: state === 'current' ? primaryColor : '#9ca3af',
                          fontSize: '15px',
                        }}
                        animate={state === 'current' ? { scale: [1, 1.05, 1] } : {}}
                        transition={state === 'current' ? transition : {}}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </motion.div>

                </motion.button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

