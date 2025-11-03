'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'default' | 'bordered' | 'elevated';
  hover?: boolean;
  onClick?: () => void;
  tilt?: boolean;
  glow?: boolean;
  shimmer?: boolean;
  borderGlow?: boolean;
}

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  variant = 'default',
  hover = true,
  onClick,
  tilt = false,
  glow = false,
  shimmer = false,
  borderGlow = false
}: AnimatedCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-border';
      case 'elevated':
        return 'shadow-lg';
      default:
        return 'bg-card';
    }
  };

  // Animazione di bagliore
  const glowAnimation = glow ? {
    boxShadow: [
      "0 0 0 0 rgba(255, 255, 255, 0)",
      "0 0 15px 5px rgba(255, 255, 255, 0.3)",
      "0 0 0 0 rgba(255, 255, 255, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  // Animazione di scintillio
  const shimmerAnimation = shimmer ? {
    background: [
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)",
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)"
    ],
    backgroundSize: ["200% 100%", "200% 100%", "200% 100%"],
    backgroundPosition: ["100% 0%", "0% 0%", "100% 0%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  } : {};

  // Animazione di bordo luminoso
  const borderGlowAnimation = borderGlow ? {
    borderColor: [
      "rgba(255, 255, 255, 0.1)",
      "rgba(255, 255, 255, 0.5)",
      "rgba(255, 255, 255, 0.1)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div
      className={cn(
        'rounded-lg p-6 overflow-hidden',
        getVariantStyles(),
        hover && 'hover:shadow-md transition-shadow',
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        ...glowAnimation,
        ...shimmerAnimation,
        ...borderGlowAnimation
      }}
      whileHover={hover ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={onClick ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : undefined}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      onClick={onClick}
      style={tilt ? {
        transformStyle: "preserve-3d",
        perspective: "1000px"
      } : undefined}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.1 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
} 