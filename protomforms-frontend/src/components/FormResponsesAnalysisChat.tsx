import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getFlowiseUrl, authenticatedFetch } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Form {
  id: string;
  title: string;
  description?: string | null;
  responses?: number;
  _count?: {
    responses: number;
  };
}

interface FormResponsesAnalysisChatProps {
  className?: string;
  agentflowId?: string;
}

export function FormResponsesAnalysisChat({ 
  className = '',
  agentflowId = '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb'
}: FormResponsesAnalysisChatProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const flowiseApiHost = getFlowiseUrl();
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [formResponses, setFormResponses] = useState<any>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Ciao! Sono il tuo analista HR specializzato nell\'interpretazione di survey aziendali. Seleziona un form per iniziare l\'analisi delle risposte.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carica i form disponibili solo se autenticato
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('🔐 Utente autenticato:', user);
      loadForms();
    } else if (!authLoading && !isAuthenticated) {
      console.warn('⚠️ Utente non autenticato');
      toast({
        title: 'Autenticazione richiesta',
        description: 'Effettua il login per accedere ai form',
        type: 'warning'
      });
    }
  }, [authLoading, isAuthenticated, user]);

  // Carica le risposte quando selezioni un form
  useEffect(() => {
    if (selectedFormId) {
      loadFormResponses(selectedFormId);
    }
  }, [selectedFormId]);

  // Scroll automatico
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadForms = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticazione richiesta',
        description: 'Effettua il login per accedere ai form',
        type: 'warning'
      });
      return;
    }

    setLoadingForms(true);
    try {
      // Usa api (axios) che ha withCredentials configurato
      const response = await api.get('/forms');
      const data = response.data;
      
      console.log('📋 Forms ricevuti:', data.length);
      console.log('📋 Primo form esempio:', data[0]);
      
      // Filtra i form che hanno risposte
      // L'API restituisce sia _count.responses che responses
      const formsWithResponses = data.filter((f: any) => {
        const responseCount = f._count?.responses || f.responses || 0;
        return responseCount > 0;
      });
      
      console.log('✅ Form con risposte:', formsWithResponses.length);
      setForms(formsWithResponses);
    } catch (error: any) {
      console.error('Errore nel caricamento dei form:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Autenticazione richiesta',
          description: 'Effettua il login per accedere ai form',
          type: 'warning'
        });
      } else {
        toast({
          title: 'Errore',
          description: error.response?.data?.error || 'Errore nel caricamento dei form',
          type: 'error'
        });
      }
    } finally {
      setLoadingForms(false);
    }
  };

  const loadFormResponses = async (formId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Autenticazione richiesta',
        description: 'Effettua il login per accedere alle risposte',
        type: 'warning'
      });
      return;
    }

    setLoadingResponses(true);
    try {
      // Carica sia il form completo che le risposte usando api (axios)
      const [formResponse, responsesResponse] = await Promise.all([
        api.get(`/forms/${formId}`),
        api.get(`/forms/${formId}/responses`)
      ]);

      const formData = formResponse.data;
      const responsesData = responsesResponse.data;

      setFormResponses({
        formId,
        responses: responsesData,
        form: {
          id: formData.id,
          title: formData.title,
          description: formData.description,
          questions: formData.questions || []
        }
      });
      
      // Aggiungi messaggio informativo
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Form "${formData.title}" caricato con ${responsesData.length} risposte. Puoi iniziare a chiedermi di analizzare le risposte!`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      console.error('Errore nel caricamento delle risposte:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: 'Autenticazione richiesta',
          description: 'Effettua il login per accedere alle risposte',
          type: 'warning'
        });
      } else {
        toast({
          title: 'Errore',
          description: error.response?.data?.error || 'Errore nel caricamento delle risposte',
          type: 'error'
        });
      }
    } finally {
      setLoadingResponses(false);
    }
  };

  // Prepara le variabili per Flowise
  const prepareFlowiseVars = () => {
    if (!formResponses || !formResponses.form) return null;

    const form = formResponses.form;
    const responses = formResponses.responses || [];

    // Estrai solo risposte testuali
    const textAnswers = responses.flatMap((response: any) => 
      (response.answers || [])
        .filter((answer: any) => answer.question?.type === 'TEXT')
        .map((answer: any) => ({
          responseId: response.id,
          progressiveNumber: response.progressiveNumber,
          question: answer.question?.text || '',
          answer: typeof answer.value === 'string' 
            ? answer.value 
            : JSON.stringify(answer.value),
          createdAt: response.createdAt
        }))
    );

    // Prepara il contesto formattato
    const responsesContext = textAnswers.length > 0
      ? textAnswers.map((item: any, index: number) => 
          `Risposta ${index + 1} (ID: ${item.responseId}, Progressivo: ${item.progressiveNumber}):
Domanda: ${item.question}
Risposta: ${item.answer}
Data: ${item.createdAt}
---`
        ).join('\n\n')
      : 'Nessuna risposta testuale disponibile per questo form.';

    return {
      formId: form.id,
      formTitle: form.title || 'Form senza titolo',
      formDescription: form.description || '',
      totalResponses: responses.length,
      textResponsesCount: textAnswers.length,
      responsesContext: responsesContext,
      responsesData: JSON.stringify(textAnswers),
      userId: null, // Non necessario per l'analisi
    };
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Verifica che ci sia un form selezionato
    if (!selectedFormId || !formResponses) {
      toast({
        title: 'Attenzione',
        description: 'Seleziona prima un form con risposte',
        type: 'warning'
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Costruisci l'URL prima del try per renderlo disponibile nel catch
    let apiUrl: string;
    if (flowiseApiHost.includes('/api/v1')) {
      apiUrl = `${flowiseApiHost}/prediction/${agentflowId}`;
    } else if (flowiseApiHost.endsWith('/')) {
      apiUrl = `${flowiseApiHost}api/v1/prediction/${agentflowId}`;
    } else {
      apiUrl = `${flowiseApiHost}/api/v1/prediction/${agentflowId}`;
    }

    try {
      // Prepara le variabili
      const vars = prepareFlowiseVars();
      if (!vars) {
        throw new Error('Impossibile preparare le variabili del form');
      }

      // Prepara la history
      const history = messages
        .filter(msg => msg.id !== '1') // Escludi il messaggio iniziale
        .map(msg => ({
          role: msg.role === 'user' ? 'userMessage' : 'apiMessage',
          content: msg.content
        }));
      
      console.log('🔵 Chiamando Flowise:', {
        flowiseApiHost,
        apiUrl,
        agentflowId,
        hasVars: !!vars,
        varsKeys: Object.keys(vars),
        windowHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
      });

      // Chiama Flowise con le variabili
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante per i cookie CORS
        body: JSON.stringify({
          question: userMessage.content,
          history: history,
          overrideConfig: {
            returnSourceDocuments: false,
            sessionId: sessionId,
            vars: vars
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Estrai il testo della risposta
      let botResponse = data.text || data.message || 'Mi dispiace, non ho capito. Puoi ripetere?';
      
      // Se c'è un campo "report" (structured output), usalo
      if (data.report) {
        botResponse = data.report;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('❌ Errore nella chiamata Flowise:', error);
      console.error('❌ Dettagli errore:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        apiUrl,
        flowiseApiHost
      });
      
      let errorMessage = 'Errore sconosciuto';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = `Errore di connessione: impossibile raggiungere Flowise. Verifica che l'URL sia corretto: ${apiUrl}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Errore: ${errorMessage}\n\nURL utilizzato: ${apiUrl}\n\nSe stai usando localhost, assicurati di essere connesso alla VPN o di usare pov.protom.com`,
        timestamp: new Date()
      }]);

      toast({
        title: 'Errore Flowise',
        description: errorMessage,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Analisi Risposte Form - Chat HR
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Selezione Form */}
        <div className="p-4 border-b bg-gray-50">
          <Label htmlFor="form-select" className="text-sm font-medium mb-2 block">
            Seleziona Form da Analizzare
          </Label>
          <div className="flex gap-2">
            <Select 
              value={selectedFormId} 
              onValueChange={setSelectedFormId}
              disabled={loadingForms}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loadingForms ? "Caricamento..." : "Seleziona un form"} />
              </SelectTrigger>
              <SelectContent>
                {forms.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Nessun form con risposte disponibile
                  </div>
                ) : (
                  forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{form.title}</span>
                        {(form._count?.responses || form.responses) && (
                          <Badge variant="secondary" className="ml-2">
                            {form._count?.responses || form.responses || 0} risposte
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedFormId && formResponses && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>
                {formResponses.responses.length} risposte caricate
                {formResponses.responses.length > 0 && (
                  <span className="ml-2 text-green-600">✓ Pronto per l'analisi</span>
                )}
              </span>
            </div>
          )}

          {loadingResponses && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Caricamento risposte...</span>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#FFCD00] text-black'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedFormId && formResponses
                  ? "Chiedi di analizzare le risposte..."
                  : "Seleziona prima un form..."
              }
              disabled={isLoading || !selectedFormId || !formResponses}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || !selectedFormId || !formResponses}
              className="bg-[#FFCD00] hover:bg-[#E6B800] text-black"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!selectedFormId && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>Seleziona un form per iniziare l'analisi</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

