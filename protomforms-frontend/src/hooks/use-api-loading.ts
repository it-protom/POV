import { useState, useCallback, useEffect, useRef } from 'react';
import { useLoading } from '../components/LoadingProvider';

interface ApiLoadingOptions {
  timeout?: number;
  showGlobalLoading?: boolean;
  loadingMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

interface ApiLoadingState {
  isLoading: boolean;
  error: string | null;
  isTimeout: boolean;
  retryAttempt: number;
}

export function useApiLoading<T>(
  options: ApiLoadingOptions = {}
) {
  const {
    timeout = 5000,
    showGlobalLoading = false,
    loadingMessage,
    retryCount = 2,
    retryDelay = 1000
  } = options;

  const { setLoadingWithTimeout, clearLoading } = useLoading();
  const [state, setState] = useState<ApiLoadingState>({
    isLoading: false,
    error: null,
    isTimeout: false,
    retryAttempt: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const executeWithLoading = useCallback(async <TResult>(
    apiCall: (signal: AbortSignal) => Promise<TResult>,
    customOptions?: Partial<ApiLoadingOptions>
  ): Promise<TResult | null> => {
    const currentOptions = { ...options, ...customOptions };
    let attempt = 0;

    const executeAttempt = async (): Promise<TResult | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isTimeout: false,
        retryAttempt: attempt
      }));

      // Mostra loading globale se richiesto
      if (showGlobalLoading || currentOptions.showGlobalLoading) {
        setLoadingWithTimeout(
          true,
          currentOptions.loadingMessage || loadingMessage,
          currentOptions.timeout || timeout
        );
      }

      // Crea abort controller per cancellare la richiesta
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Setup timeout
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isTimeout: true }));
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, currentOptions.timeout || timeout);

      try {
        const result = await apiCall(signal);
        
        clearTimeouts();
        setState(prev => ({ ...prev, isLoading: false }));
        
        if (showGlobalLoading || currentOptions.showGlobalLoading) {
          clearLoading();
        }

        return result;
      } catch (error: any) {
        clearTimeouts();

        // Se è stato abortato per timeout
        if (error.name === 'AbortError' && state.isTimeout) {
          if (attempt < (currentOptions.retryCount || retryCount)) {
            attempt++;
            // Retry dopo delay
            await new Promise(resolve => 
              setTimeout(resolve, currentOptions.retryDelay || retryDelay)
            );
            return executeAttempt();
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Timeout: Il caricamento sta impiegando troppo tempo. Riprova più tardi.',
              isTimeout: true
            }));
          }
        } else {
          // Altri errori
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Si è verificato un errore durante il caricamento'
          }));
        }

        if (showGlobalLoading || currentOptions.showGlobalLoading) {
          clearLoading();
        }

        return null;
      }
    };

    return executeAttempt();
  }, [
    options,
    showGlobalLoading,
    loadingMessage,
    timeout,
    retryCount,
    retryDelay,
    setLoadingWithTimeout,
    clearLoading,
    clearTimeouts,
    state.isTimeout
  ]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      isTimeout: false,
      retryAttempt: 0
    }));
  }, []);

  const reset = useCallback(() => {
    clearTimeouts();
    setState({
      isLoading: false,
      error: null,
      isTimeout: false,
      retryAttempt: 0
    });
    clearLoading();
  }, [clearTimeouts, clearLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    ...state,
    executeWithLoading,
    retry,
    reset
  };
}

// Hook specifico per caricamento dati di pagina
export function usePageLoading() {
  const [pageReady, setPageReady] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Simula che la pagina è pronta immediatamente
    setPageReady(true);
  }, []);

  const markDataLoaded = useCallback(() => {
    setDataLoaded(true);
  }, []);

  const resetData = useCallback(() => {
    setDataLoaded(false);
  }, []);

  return {
    pageReady,
    dataLoaded,
    markDataLoaded,
    resetData
  };
}

// Hook per gestire fetch con cache e loading
export function useCachedFetch<T>(
  url: string,
  options: ApiLoadingOptions & {
    enabled?: boolean;
    cacheKey?: string;
    cacheDuration?: number;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const { executeWithLoading, ...loadingState } = useApiLoading<T>(options);
  const { enabled = true, cacheDuration = 300000 } = options; // 5 min default cache

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const result = await executeWithLoading(async (signal) => {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });

    if (result) {
      setData(result);
    }
  }, [url, enabled, executeWithLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    setData(null);
    fetchData();
  }, [fetchData]);

  return {
    data,
    ...loadingState,
    refetch
  };
} 