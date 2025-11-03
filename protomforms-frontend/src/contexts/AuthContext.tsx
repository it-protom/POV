import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { endpoints } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    if (!isLoggingOut) {
      checkSession();
    }
  }, [isLoggingOut]);

  const checkSession = async () => {
    // Don't check session if we're in the middle of logging out
    if (isLoggingOut) {
      return;
    }

    try {
      const response = await api.get(endpoints.auth.session);
      if (response.data?.isAuthenticated && response.data?.user) {
        setUser(response.data.user);
        // Store user ID in localStorage for axios interceptor
        localStorage.setItem('user_id', response.data.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('user_id');
      }
    } catch (error: any) {
      // Only log if it's not a network error or 401/404 (expected when not authenticated)
      if (error.response?.status && ![401, 404, 500].includes(error.response.status)) {
        console.error('Session check failed:', error);
      }
      // Session doesn't exist or is invalid - this is expected when not logged in
      setUser(null);
      localStorage.removeItem('user_id');
    } finally {
      setLoading(false);
    }
  };
  
  // Export checkSession for external use (e.g., callback page)
  useEffect(() => {
    // Expose checkSession globally for callback pages
    (window as any).checkAuthSession = checkSession;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use the custom login endpoint (endpoints.auth.login è già /auth/login, baseURL contiene /api)
      const response = await api.post(endpoints.auth.login, {
        email,
        password,
      });

      if (response.data?.user) {
        setUser(response.data.user);
        // Store user ID in localStorage for axios interceptor and authenticatedFetch
        // This allows backend endpoints to authenticate via x-user-id header fallback
        localStorage.setItem('user_id', response.data.user.id);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Credenziali non valide';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Set logging out flag to prevent session check
      setIsLoggingOut(true);
      
      // Clear user state immediately
      setUser(null);
      localStorage.removeItem('user_id');
      
      // Call logout endpoint to clear server-side session and cookies
      await api.post(endpoints.auth.signout);
      
      // Small delay to ensure cookies are cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to home page with full reload to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state and redirect
      setUser(null);
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


