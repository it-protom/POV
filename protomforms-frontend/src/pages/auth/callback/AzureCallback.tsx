import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { endpoints } from '@/lib/api';

export default function AzureCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Check if there's an error from Azure AD
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          console.error('Azure AD error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setTimeout(() => {
            navigate('/auth/signin?error=' + encodeURIComponent(errorDescription || errorParam));
          }, 2000);
          return;
        }

        // Wait a bit for NextAuth to set the session cookie
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify session with backend
        const response = await api.get(endpoints.auth.session);
        
        if (response.data?.isAuthenticated && response.data?.user) {
          // Session is valid, redirect to dashboard
          const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard';
          // Decode the callback URL if needed
          const decodedCallback = decodeURIComponent(callbackUrl);
          
          // Use window.location for full page reload to ensure auth state is refreshed
          // FORZA pov.protom.com in produzione
          let finalUrl: string;
          if (decodedCallback.startsWith('http')) {
            finalUrl = decodedCallback;
            // Se è un URL esterno ma siamo su pov.protom.com, forza il dominio corretto
            if (window.location.hostname === 'pov.protom.com' && !decodedCallback.includes('pov.protom.com')) {
              finalUrl = decodedCallback.replace(/https?:\/\/[^/]+/, 'https://pov.protom.com');
            }
          } else {
            const baseUrl = window.location.hostname === 'pov.protom.com' 
              ? 'https://pov.protom.com' 
              : window.location.origin;
            finalUrl = baseUrl + decodedCallback;
          }
          window.location.href = finalUrl;
        } else {
          // No session found, redirect to signin
          setError('Autenticazione fallita. Riprova.');
          setTimeout(() => {
            navigate('/auth/signin?error=authentication_failed');
          }, 2000);
        }
      } catch (err: any) {
        console.error('Session verification error:', err);
        setError('Errore durante la verifica della sessione.');
        setTimeout(() => {
          navigate('/auth/signin?error=session_verification_failed');
        }, 2000);
      }
    };

    verifySession();
  }, [navigate, searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        {error ? (
          <>
            <div className="animate-bounce rounded-full h-12 w-12 border-4 border-red-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-red-700">Errore</h2>
            <p className="text-gray-700 mt-2">{error}</p>
            <p className="text-gray-500 mt-2 text-sm">Reindirizzamento in corso...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Autenticazione in corso...</h2>
            <p className="text-gray-500 mt-2">Verifica della sessione...</p>
          </>
        )}
      </div>
    </div>
  );
}

