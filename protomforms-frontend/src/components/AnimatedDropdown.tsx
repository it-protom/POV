'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnimatedDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: 'left' | 'right' | 'center';
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  animation?: 'fade' | 'scale' | 'slide' | 'bounce';
  glow?: boolean;
  shimmer?: boolean;
}

export function AnimatedDropdown({ 
  trigger, 
  children, 
  className = '',
  triggerClassName = '',
  contentClassName = '',
  align = 'left',
  width = 'auto',
  isOpen: controlledIsOpen,
  onOpenChange,
  animation = 'fade',
  glow = false,
  shimmer = false
}: AnimatedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isDropdownOpen = controlledIsOpen ?? isOpen;
  
  const handleToggle = () => {
    const newIsOpen = !isDropdownOpen;
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onOpenChange]);
  
  const getWidthClass = () => {
    switch (width) {
      case 'sm':
        return 'w-48';
      case 'md':
        return 'w-64';
      case 'lg':
        return 'w-80';
      case 'xl':
        return 'w-96';
      case 'full':
        return 'w-full';
      default:
        return 'w-auto';
    }
  };
  
  const getAlignmentClass = () => {
    switch (align) {
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      default:
        return 'left-0';
    }
  };

  // Ottieni l'animazione in base al tipo
  const getAnimation = () => {
    switch (animation) {
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8, y: 10 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.8, y: 10 },
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
        };
      case 'slide':
        return {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
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
          exit: { opacity: 0 },
          transition: { duration: 0.2 }
        };
    }
  };
  
  return (
    <div 
      ref={dropdownRef}
      className={cn('relative inline-block', className)}
    >
      <motion.div 
        onClick={handleToggle}
        className={cn('cursor-pointer', triggerClassName)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {trigger}
      </motion.div>
      
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            {...getAnimation()}
            className={cn(
              'absolute z-50 mt-1 bg-white rounded-md shadow-lg overflow-hidden',
              getWidthClass(),
              getAlignmentClass(),
              contentClassName
            )}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function DropdownItem({ 
  children, 
  onClick, 
  className = '',
  icon,
  disabled = false
}: DropdownItemProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'px-4 py-2 flex items-center cursor-pointer',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.div>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className = '' }: DropdownSeparatorProps) {
  return (
    <div className={cn('h-px bg-gray-200 my-1', className)} />
  );
} 