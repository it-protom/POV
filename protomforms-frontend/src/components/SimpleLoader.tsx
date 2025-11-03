'use client';

import { cn } from '../lib/utils';

interface SimpleLoaderProps {
  isVisible?: boolean;
  text?: string;
  className?: string;
}

export function SimpleLoader({ 
  isVisible = true, 
  text = 'Caricamento...', 
  className 
}: SimpleLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className={cn('flex items-center justify-center gap-3 p-4', className)}>
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-500 border-t-transparent" />
      <span className="text-sm font-medium text-gray-700">{text}</span>
    </div>
  );
}

export function SimpleLoadingOverlay({ 
  isVisible = true, 
  text = 'Caricamento...' 
}: SimpleLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-500 border-t-transparent" />
        <p className="text-gray-700 font-medium">{text}</p>
      </div>
    </div>
  );
} 