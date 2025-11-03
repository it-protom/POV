'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  variant?: 'default' | 'bordered' | 'elevated';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  glowEffect?: boolean;
  shimmerEffect?: boolean;
}

export function AnimatedList({
  children,
  className = '',
  delay = 0,
  staggerChildren = 0.1,
  variant = 'default',
  spacing = 'md',
  hoverEffect = false,
  glowEffect = false,
  shimmerEffect = false
}: AnimatedListProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return 'divide-y divide-border';
      case 'elevated':
        return 'space-y-4';
      default:
        return '';
    }
  };

  const getSpacingStyles = () => {
    switch (spacing) {
      case 'none':
        return '';
      case 'sm':
        return 'space-y-2';
      case 'lg':
        return 'space-y-6';
      case 'md':
      default:
        return 'space-y-4';
    }
  };

  // Animazione di bagliore
  const glowAnimation = glowEffect ? {
    boxShadow: [
      "0 0 0 0 rgba(255, 255, 255, 0)",
      "0 0 10px 2px rgba(255, 255, 255, 0.3)",
      "0 0 0 0 rgba(255, 255, 255, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  // Animazione di scintillio
  const shimmerAnimation = shimmerEffect ? {
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: staggerChildren
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      ...glowAnimation,
      ...shimmerAnimation,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    hover: hoverEffect ? {
      scale: 1.02,
      transition: { duration: 0.2 }
    } : {}
  };

  return (
    <motion.div
      className={cn(
        'w-full overflow-hidden',
        getVariantStyles(),
        getSpacingStyles(),
        className
      )}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div 
          key={index} 
          variants={item}
          whileHover="hover"
          className="overflow-hidden"
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
} 