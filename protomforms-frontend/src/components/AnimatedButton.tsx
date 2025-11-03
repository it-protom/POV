'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  ripple?: boolean;
  glow?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function AnimatedButton({
  children,
  className = '',
  delay = 0,
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  ripple = false,
  glow = false,
  icon,
  iconPosition = 'left'
}: AnimatedButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'outline':
        return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      case 'ghost':
        return 'hover:bg-accent hover:text-accent-foreground';
      default:
        return 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3 text-sm';
      case 'lg':
        return 'h-11 px-8 text-base';
      case 'md':
      default:
        return 'h-10 px-4 py-2 text-sm';
    }
  };

  // Animazione di ripple
  const rippleAnimation = ripple ? {
    boxShadow: [
      "0 0 0 0 rgba(255, 255, 255, 0)",
      "0 0 0 10px rgba(255, 255, 255, 0.3)",
      "0 0 0 0 rgba(255, 255, 255, 0)"
    ],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  // Animazione di bagliore
  const glowAnimation = glow ? {
    boxShadow: [
      "0 0 0 0 rgba(255, 255, 255, 0)",
      "0 0 10px 2px rgba(255, 255, 255, 0.5)",
      "0 0 0 0 rgba(255, 255, 255, 0)"
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0,
        ...rippleAnimation,
        ...glowAnimation
      }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && iconPosition === 'left' && (
        <motion.span 
          className="mr-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: delay + 0.1 }}
        >
          {icon}
        </motion.span>
      )}
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: delay + 0.2 }}
      >
        {children}
      </motion.span>
      {icon && iconPosition === 'right' && (
        <motion.span 
          className="ml-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: delay + 0.1 }}
        >
          {icon}
        </motion.span>
      )}
    </motion.button>
  );
} 