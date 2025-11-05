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
  const [user, setUser] = useState<User | null>(() => {
    // Try to restore user from localStorage immediately on mount
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      try {
        return JSON.parse(storedUserData);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        return null;
      }
    }
    return null;
  });
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
        // Store user data in localStorage for persistence across page reloads
        localStorage.setItem('user_id', response.data.user.id);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
      } else {
        // Only clear if explicitly not authenticated (not network error)
        setUser(null);
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_data');
      }
    } catch (error: any) {
      console.error('Session check failed:', error);
      
      // Only clear session if it's a 401 (Unauthorized) - meaning session is explicitly invalid
      // Don't clear on network errors or other server errors (500, etc)
      if (error.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_data');
      } else {
        // For network errors or server errors, try to restore from localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData && !user) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            console.log('Restoring session from localStorage due to network error');
            setUser(parsedUser);
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
          }
        }
      }
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
      // Validate credentials with custom endpoint
      const response = await api.post(endpoints.auth.login, {
        email,
        password,
      });

      if (response.data?.user) {
        setUser(response.data.user);
        // Store user data in localStorage for persistence across page reloads
        // This allows backend endpoints to authenticate via x-user-id header fallback
        localStorage.setItem('user_id', response.data.user.id);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
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
      localStorage.removeItem('user_data');
      
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


