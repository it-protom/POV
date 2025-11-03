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
  TrendingUp 
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
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFCD00] to-[#FFD700] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ProtomForms
              </span>
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
                <Badge className="bg-[#FFCD00]/10 text-[#FFCD00] border-[#FFCD00]/20 font-medium px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Powered by Protom Group
                </Badge>
                
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Crea, gestisci,
                    <br />
                    visualizza form
                    <br />
                    <span className="text-gray-600">riguardo</span>
                  </h1>
                  
                  {/* Typing Animation */}
                  <div className="h-20 flex items-center">
                    <TypingAnimation />
                  </div>
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
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Setup immediato
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Sicurezza enterprise
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Supporto dedicato
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
              Come iniziare
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tre semplici passaggi per trasformare la raccolta dati della tua azienda
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <StepCard
              number="1"
              title="Crea un account"
              description="Registrati con il tuo account Microsoft aziendale e accedi immediatamente alla piattaforma"
              icon={<Target className="w-8 h-8" />}
            />
            <StepCard
              number="2"
              title="Scegli un template"
              description="Parti da template professionali o crea da zero il tuo questionario personalizzato"
              icon={<FileText className="w-8 h-8" />}
            />
            <StepCard
              number="3"
              title="Pubblica e analizza"
              description="Condividi il form e monitora le risposte in tempo reale con dashboard avanzate"
              icon={<TrendingUp className="w-8 h-8" />}
            />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analytics Avanzate"
              description="Dashboard in tempo reale con grafici interattivi e report esportabili"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Gestione Team"
              description="Collabora con il team, assegna ruoli e gestisci permessi granulari"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Sicurezza Enterprise"
              description="Crittografia end-to-end, backup automatici e conformità GDPR"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Integrazione API"
              description="Connetti con i tuoi sistemi esistenti tramite API REST complete"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Pronto a trasformare la tua raccolta dati?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Unisciti alle aziende che hanno già scelto ProtomForms per i loro questionari professionali
          </p>
          
          <Button 
            onClick={() => navigate('/auth/signin')}
            size="lg"
            className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Accedi alla Piattaforma
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFCD00] to-[#FFD700] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-gray-900">ProtomForms</span>
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
