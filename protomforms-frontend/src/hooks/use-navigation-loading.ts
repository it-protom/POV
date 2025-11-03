'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from "react-router-dom";
import { useLoading } from '../components/LoadingProvider';

export function useNavigationLoading() {
  const { setLoadingWithTimeout, clearLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Mostra loading per navigazione tra pagine
    setLoadingWithTimeout(true, 'Caricamento pagina...', 2000);

    // Cleanup automatico dopo un breve timeout
    const timer = setTimeout(() => {
      clearLoading();
    }, 500);

    return () => {
      clearTimeout(timer);
      clearLoading();
    };
  }, [pathname, searchParams, setLoadingWithTimeout, clearLoading]);

  return {
    pathname,
    searchParams
  };
}

// Hook per pagine specifiche che potrebbero richiedere più tempo
export function useSlowPageLoading(
  message: string = 'Caricamento in corso...',
  timeout: number = 5000
) {
  const { setLoadingWithTimeout, clearLoading } = useLoading();
  const pathname = usePathname();

  useEffect(() => {
    // Per pagine che potrebbero essere lente (come dashboard con molti dati)
    if (pathname.includes('/admin/dashboard') || 
        pathname.includes('/admin/analytics') || 
        pathname.includes('/admin/forms') && pathname.includes('/responses')) {
      setLoadingWithTimeout(true, message, timeout);
      
      // Auto-clear dopo timeout più lungo
      const timer = setTimeout(() => {
        clearLoading();
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearLoading();
      };
    }
  }, [pathname, message, timeout, setLoadingWithTimeout, clearLoading]);

  return { pathname };
} 