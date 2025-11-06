import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ottiene l'URL base dell'applicazione
 * @returns L'URL base dell'applicazione
 */
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Nel browser, utilizziamo l'URL corrente
    return window.location.origin;
  }
  // Durante il rendering lato server, utilizziamo un valore predefinito
  return process.env.NEXTAUTH_URL || 'http://localhost:3001';
}

/**
 * Ottiene l'URL dell'API backend
 * @returns L'URL dell'API backend
 */
export function getApiUrl() {
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    // FORZA pov.protom.com in produzione per evitare conflitti
    let baseUrl: string;
    if (window.location.hostname === 'pov.protom.com') {
      baseUrl = 'https://pov.protom.com';
    } else if (window.location.hostname.includes('protom.com') && window.location.hostname !== 'agoexplorer.protom.com') {
      baseUrl = window.location.origin;
    } else {
      // Check for environment variable from Vite (può essere /api o URL completo)
      const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
      if (envApiUrl) {
        // Se è un percorso relativo (inizia con /), aggiungi all'origin
        if (envApiUrl.startsWith('/')) {
          const ensured = envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/$/, '')}/api`;
          return `${window.location.origin}${ensured}`;
        }
        // Se è un URL completo, assicurati che termini con /api
        if (/^https?:\/\//i.test(envApiUrl)) {
          const hasApi = /\/(api)(\/)?$/i.test(envApiUrl) || /\/api\//i.test(envApiUrl);
          const ensured = hasApi ? envApiUrl.replace(/\/$/, '') : `${envApiUrl.replace(/\/$/, '')}/api`;
          return ensured;
        }
        // Altrimenti tratta come base path
        const ensured = envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl.replace(/\/$/, '')}/api`;
        return `${window.location.origin}${ensured.startsWith('/') ? ensured : `/${ensured}`}`;
      }
      // Default: use same origin with /api path
      baseUrl = window.location.origin;
    }
    
    return `${baseUrl}/api`;
  }
  
  // Fallback for SSR (shouldn't happen in Vite)
  return '/api';
}

/**
 * Helper per fetch che aggiunge automaticamente l'header x-user-id se disponibile
 * @param url URL da chiamare (può essere relativo o assoluto)
 * @param options Opzioni fetch standard
 * @returns Promise<Response>
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = localStorage.getItem('user_id');
  const headers = new Headers(options.headers);
  
  // Aggiungi x-user-id se disponibile e non già presente
  if (userId && !headers.has('x-user-id')) {
    headers.set('x-user-id', userId);
  }
  
  // Costruisci l'URL completo se è relativo
  let fullUrl = url;
  if (url.startsWith('/api/') || url.startsWith('/api')) {
    // URL relativo, costruisci l'URL completo
    const apiUrl = getApiUrl();
    // Rimuovi /api se già presente nell'URL relativo
    const path = url.startsWith('/api') ? url.substring(4) : url;
    fullUrl = `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // URL relativo senza /api, aggiungi getApiUrl
    const apiUrl = getApiUrl();
    fullUrl = `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }
  
  // Assicurati che credentials sia sempre 'include' per i cookie
  return fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers,
  });
}

/**
 * Ottiene l'URL pubblico dell'applicazione (per condivisione link)
 * In produzione usa pov.protom.com, in sviluppo usa localhost
 * @returns L'URL pubblico dell'applicazione
 */
export function getPublicUrl() {
  if (typeof window !== 'undefined') {
    // Se siamo su pov.protom.com, usa quello
    if (window.location.hostname === 'pov.protom.com' || window.location.hostname.includes('protom.com')) {
      return `https://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
    }
    
    // Check for environment variable
    const envPublicUrl = import.meta.env.VITE_PUBLIC_URL || import.meta.env.VITE_FRONTEND_URL;
    if (envPublicUrl) {
      return envPublicUrl;
    }
    
    // In sviluppo, usa l'URL corrente
    return window.location.origin;
  }
  
  // Fallback per SSR - controlla variabili d'ambiente
  return process.env.VITE_PUBLIC_URL || process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
}
