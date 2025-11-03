import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  
  const withLoading = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T> => {
    startLoading();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    // Auto-stop dopo 5 secondi come fallback
    setTimeout(() => setIsNavigating(false), 5000);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return {
    isNavigating,
    startNavigation,
    stopNavigation,
  };
} 