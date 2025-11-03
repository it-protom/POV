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


