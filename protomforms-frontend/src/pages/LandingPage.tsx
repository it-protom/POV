import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  FileText, 
  Target, 
  TrendingUp, 
  EyeOff, 
  Heart,
  MessageSquare,
  Clock,
  Play,
  CheckCircle2
} from 'lucide-react';
import TypingAnimation from '../components/TypingAnimation';
import FormPreviewCard from '../components/FormPreviewCard';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/forms');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFCD00] mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="/logo_pov.png"
                alt="POV Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col -mt-1 text-left items-start">
                <span className="text-4xl font-bold text-gray-900 leading-none block -ml-0.5">
                  pov
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  by Protom Group
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/auth/signin')}
                className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Accedi con Microsoft
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

        {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-32 overflow-hidden">
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    I nostri form nascono per
                    <br />
                    <span className="text-[#FFCD00]">
                      <TypingAnimation />
                    </span>
                  </h1>
                </div>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  La piattaforma completa per questionari aziendali, sondaggi di soddisfazione 
                  e raccolta dati professionale.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/auth/signin')}
                  size="lg"
                  className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  Accedi alla Piattaforma
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-200 hover:border-[#FFCD00] hover:text-[#FFCD00] px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  Scopri di più
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <EyeOff className="w-4 h-4 text-gray-700" />
                  Sondaggi anonimi
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Heart className="w-4 h-4 text-red-500" />
                  La tua opinione conta
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Risposte protette
                </div>
              </div>
            </div>
            
            {/* Right Content - Form Preview */}
            <div className="relative">
              <FormPreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Neutral Background */}
      <section className="relative bg-gradient-to-br from-gray-100 to-gray-50 py-20 lg:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FFCD00]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Come partecipare
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tre semplici passaggi per condividere la tua opinione e contribuire al miglioramento
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <StepCard
              number="1"
              title="Accedi con Microsoft"
              description="Usa il tuo account aziendale Microsoft per accedere rapidamente e in sicurezza"
              icon={<Shield className="w-8 h-8" />}
            />
            <StepCard
              number="2"
              title="Scegli un form"
              description="Esplora i form disponibili e trova quelli a cui vuoi contribuire con la tua opinione"
              icon={<FileText className="w-8 h-8" />}
            />
            <StepCard
              number="3"
              title="Rispondi e condividi"
              description="Compila il form in pochi minuti: ogni tua risposta è preziosa e aiuta a migliorare"
              icon={<MessageSquare className="w-8 h-8" />}
            />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Compilazione rapida"
              description="Rispondi in pochi minuti, senza registrazioni complicate o passaggi lunghi"
            />
            <FeatureCard
              icon={<EyeOff className="w-6 h-6" />}
              title="Risposte anonime"
              description="I tuoi feedback sono protetti e anonimi, puoi esprimerti liberamente"
            />
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Il tuo contributo conta"
              description="Ogni risposta è importante e aiuta a prendere decisioni migliori"
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Semplice e intuitivo"
              description="Interfaccia chiara e user-friendly per una compilazione piacevole"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Pronto a condividere la tua opinione?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Accedi e inizia a partecipare ai form disponibili. La tua voce è importante e fa la differenza!
          </p>
          
          <Button 
            onClick={() => navigate('/auth/signin')}
            size="lg"
            className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Vai ai Form Disponibili
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img
                src="/logo_pov.png"
                alt="POV Logo"
                className="h-14 w-14 object-contain mt-0.5"
              />
              <div className="flex flex-col -mt-1 text-left items-start">
                <span className="text-4xl font-bold text-gray-900 leading-none block -ml-0.5">
                  pov
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  by Protom Group
                </span>
              </div>
            </div>
            <p className="text-gray-600">
              © 2024 ProtomForms by Protom Group. Piattaforma professionale per questionari aziendali.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function StepCard({ 
  number, 
  title, 
  description, 
  icon 
}: { 
  number: string; 
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-[#FFCD00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-black">{number}</span>
          </div>
          <div className="w-12 h-12 bg-[#FFCD00]/10 rounded-xl flex items-center justify-center mx-auto">
            <div className="text-[#FFCD00]">{icon}</div>
      </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardContent className="p-6 space-y-4">
        <div className="w-12 h-12 bg-[#FFCD00] rounded-xl flex items-center justify-center">
          <div className="text-black">{icon}</div>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

export default LandingPage;
