'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  showTimeout?: boolean;
  timeoutDuration?: number;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setLoading: (loading: boolean, message?: string) => void;
  setLoadingWithTimeout: (loading: boolean, message?: string, timeout?: number) => void;
  clearLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    showTimeout: false
  });
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const clearLoading = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setLoadingState({
      isLoading: false,
      showTimeout: false
    });
  }, [timeoutId]);

  const setLoading = useCallback((loading: boolean, message?: string) => {
    if (!loading) {
      clearLoading();
      return;
    }

    setLoadingState({
      isLoading: true,
      message,
      showTimeout: false
    });
  }, [clearLoading]);

  const setLoadingWithTimeout = useCallback((
    loading: boolean, 
    message?: string, 
    timeout: number = 3000
  ) => {
    if (!loading) {
      clearLoading();
      return;
    }

    setLoadingState({
      isLoading: true,
      message,
      showTimeout: false,
      timeoutDuration: timeout
    });

    // Imposta timeout per mostrare schermata di attesa
    const id = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        showTimeout: true
      }));
    }, timeout);

    setTimeoutId(id);
  }, [clearLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <LoadingContext.Provider value={{
      loadingState,
      setLoading,
      setLoadingWithTimeout,
      clearLoading
    }}>
      {children}
      <GlobalLoadingScreen />
    </LoadingContext.Provider>
  );
}

function GlobalLoadingScreen() {
  const { loadingState } = useLoading();

  return (
    <AnimatePresence>
      {loadingState.isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="text-center">
            {!loadingState.showTimeout ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-12 w-12 text-[#FFCD00]" />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Caricamento in corso...
                  </h3>
                  {loadingState.message && (
                    <p className="text-sm text-gray-600">
                      {loadingState.message}
                    </p>
                  )}
                </div>

                {/* Progress indicator */}
                <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#FFCD00] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: (loadingState.timeoutDuration || 3000) / 1000,
                      ease: "easeOut"
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center space-y-4 max-w-md mx-auto p-6"
              >
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Caricamento in corso...
                  </h3>
                  <p className="text-sm text-gray-600">
                    Il caricamento sta richiedendo più tempo del previsto.
                    <br />
                    Per favore attendi ancora qualche secondo.
                  </p>
                </div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-6 w-6 text-[#FFCD00]" />
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 