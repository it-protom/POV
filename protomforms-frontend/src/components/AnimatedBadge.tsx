'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface AnimatedBadgeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glow?: boolean;
  shimmer?: boolean;
}

export function AnimatedBadge({
  children,
  className = '',
  delay = 0,
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  shimmer = false
}: AnimatedBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'danger':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      case 'md':
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  const pulseAnimation = pulse ? {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(0, 0, 0, 0)",
      "0 0 0 4px rgba(255, 255, 255, 0.3)",
      "0 0 0 0 rgba(0, 0, 0, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const glowAnimation = glow ? {
    boxShadow: [
      "0 0 0 0 rgba(255, 255, 255, 0)",
      "0 0 8px 2px rgba(255, 255, 255, 0.5)",
      "0 0 0 0 rgba(255, 255, 255, 0)"
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  const shimmerAnimation = shimmer ? {
    background: [
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)",
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)"
    ],
    backgroundSize: ["200% 100%", "200% 100%", "200% 100%"],
    backgroundPosition: ["100% 0%", "0% 0%", "100% 0%"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  } : {};

  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-full font-medium overflow-hidden',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
        ...pulseAnimation,
        ...glowAnimation,
        ...shimmerAnimation
      }}
      whileHover={{ 
        scale: 1.1,
        transition: { duration: 0.2 }
      }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {children}
    </motion.span>
  );
} 