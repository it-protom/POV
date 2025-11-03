'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

interface AnimatedNotificationProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
}

export function AnimatedNotification({
  children,
  className = '',
  variant = 'default',
  position = 'top-right',
  duration = 5000,
  onClose,
  showCloseButton = true,
  animation = 'fade'
}: AnimatedNotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-white text-gray-800 border-gray-300';
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getAnimation = () => {
    switch (animation) {
      case 'slide':
        return {
          initial: { opacity: 0, x: position.includes('right') ? 100 : -100 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: position.includes('right') ? 100 : -100 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.8 }
        };
      case 'bounce':
        return {
          initial: { opacity: 0, y: -20 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 500,
              damping: 30
            }
          },
          exit: { 
            opacity: 0, 
            y: -20,
            transition: {
              duration: 0.2
            }
          }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...getAnimation()}
          className={cn(
            'fixed z-50 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md',
            getVariantStyles(),
            getPositionStyles(),
            className
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">{children}</div>
            {showCloseButton && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 