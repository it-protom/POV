import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/dashboard' : '/user/forms');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    // FORZA pov.protom.com in produzione
    let backendUrl: string;
    let frontendUrl: string;
    
    if (window.location.hostname === 'pov.protom.com') {
      backendUrl = 'https://pov.protom.com';
      frontendUrl = 'https://pov.protom.com';
    } else {
      backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      frontendUrl = window.location.origin;
    }
    
    const callbackUrl = encodeURIComponent(`${frontendUrl}/admin/dashboard`);
    window.location.href = `${backendUrl}/api/auth/signin/azure-ad?callbackUrl=${callbackUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla home</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFCD00] to-[#FFD700] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <span className="text-3xl font-bold text-gray-900">ProtomForms</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accedi alla piattaforma</h1>
          <p className="text-gray-600">Inserisci le tue credenziali per continuare</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Accesso</CardTitle>
            <CardDescription className="text-center">
              Scegli il metodo di accesso preferito
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Microsoft Login */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold py-3 rounded-lg transition-all duration-300"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              Accedi con Microsoft
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">oppure</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@protom.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="La tua password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold py-3 rounded-lg transition-all duration-300"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              <p>
                Non hai un account?{' '}
                <span className="text-[#FFCD00] font-medium">
                  Contatta l'amministratore
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 ProtomForms by Protom Group</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


