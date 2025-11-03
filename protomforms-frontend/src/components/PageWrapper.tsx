'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigationLoading } from '../hooks/use-navigation-loading';
import { LoadingSpinner } from './ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showNavLoading?: boolean;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
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

function DefaultFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Caricamento pagina...</p>
      </div>
    </div>
  );
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ops! Qualcosa è andato storto</AlertTitle>
          <AlertDescription className="mt-2">
            {error?.message || 'Si è verificato un errore imprevisto durante il caricamento della pagina.'}
          </AlertDescription>
          {retry && (
            <div className="mt-4">
              <Button onClick={retry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Riprova
              </Button>
            </div>
          )}
        </Alert>
      </div>
    </div>
  );
}

export function PageWrapper({
  children,
  title,
  description,
  showNavLoading = true,
  fallback,
  errorFallback,
  className = ""
}: PageWrapperProps) {
  // Hook per navigation loading (opzionale)
  if (showNavLoading) {
    useNavigationLoading();
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen ${className}`}
    >
      <Suspense fallback={fallback || <DefaultFallback />}>
        <ErrorBoundary fallback={errorFallback}>
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              {description && (
                <p className="text-gray-600">{description}</p>
              )}
            </div>
          )}
          {children}
        </ErrorBoundary>
      </Suspense>
    </motion.div>
  );
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PageWrapper Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <DefaultErrorFallback 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

// Hook per utilizzare PageWrapper in layout
export function usePageTransition() {
  return {
    variants: pageVariants,
    initial: "initial",
    animate: "animate",
    exit: "exit"
  };
} 