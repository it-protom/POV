import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'yellow' | 'white' | 'gray';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  yellow: 'border-[#FFCD00] border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-300 border-t-transparent'
};

export function LoadingSpinner({ 
  size = 'md', 
  className,
  color = 'yellow'
}: LoadingSpinnerProps) {
  return (
    <motion.div
      className={cn(
        'border-2 rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'yellow' | 'white' | 'gray';
}

const dotSizeClasses = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3'
};

const dotColorClasses = {
  yellow: 'bg-[#FFCD00]',
  white: 'bg-white',
  gray: 'bg-gray-400'
};

export function LoadingDots({ 
  size = 'md', 
  className,
  color = 'yellow'
}: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            dotColorClasses[color]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingPulse({ 
  size = 'md', 
  className
}: LoadingPulseProps) {
  return (
    <motion.div
      className={cn(
        'rounded-full bg-gradient-to-r from-[#FFCD00] to-[#FFD700]',
        sizeClasses[size],
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
} 