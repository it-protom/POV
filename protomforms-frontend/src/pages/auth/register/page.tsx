import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validazione base
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la registrazione');
      }

      // Reindirizza alla pagina di login con messaggio di successo
      navigate('/auth/signin?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Protom Forms
              </h1>
              <p className="text-gray-600 text-lg">
                Crea il tuo account e inizia subito
              </p>
            </div>
          </div>

          {/* Main card */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl animate-fade-in">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-semibold text-center text-gray-800">
                Crea un nuovo account
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Inserisci i tuoi dati per registrarti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@protom.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Conferma Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Registrazione in corso...
                    </>
                  ) : (
                    <>
                      Registrati
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
              
              {/* Login link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Hai già un account?{" "}
                  <Link 
                    to="/auth/signin" 
                    className="font-medium text-green-600 hover:text-green-800 transition-colors hover:underline"
                  >
                    Accedi ora
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Protom Forms. Tutti i diritti riservati.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 