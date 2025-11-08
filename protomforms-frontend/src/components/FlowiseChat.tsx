import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, RotateCcw, Star, RadioGroup, RadioGroupItem, CheckSquare, BarChart3 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '@/components/ui/label';
import { getFlowiseUrl } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FlowiseFormData {
  title?: string;
  description?: string;
  type?: 'SURVEY' | 'QUIZ';
  isAnonymous?: boolean;
  allowEdit?: boolean;
  showResults?: boolean;
  thankYouMessage?: string;
  questions?: Array<{
    text: string;
    type: string;
    required: boolean;
    options?: any;
  }>;
}

interface FlowiseChatProps {
  chatflowid: string;
  apiHost?: string;
  className?: string;
  onFormGenerated?: (formData: FlowiseFormData) => void;
}

export function FlowiseChat({ 
  chatflowid, 
  apiHost,
  className = '',
  onFormGenerated
}: FlowiseChatProps) {
  // Usa apiHost se fornito, altrimenti usa la variabile d'ambiente o fallback
  const flowiseApiHost = apiHost || getFlowiseUrl();
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente AI per la creazione di form. Descrivi il tipo di form che vuoi creare e ti aiuterò a generare titolo, descrizione e domande pertinenti.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Funzione per resettare la chat con un nuovo session ID
  const resetChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Ciao! Sono il tuo assistente AI per la creazione di form. Descrivi il tipo di form che vuoi creare e ti aiuterò a generare titolo, descrizione e domande pertinenti.',
        timestamp: new Date()
      }
    ]);
    setInputValue('');
  };

  // Scroll automatico alla fine dei messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepara la history per Flowise
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'userMessage' : 'apiMessage',
        content: msg.content
      }));

      // Costruisci l'URL completo per l'API Flowise
      // Se flowiseApiHost già contiene /api/v1, non aggiungerlo di nuovo
      const apiUrl = flowiseApiHost.includes('/api/v1') 
        ? `${flowiseApiHost}/prediction/${chatflowid}`
        : `${flowiseApiHost}/api/v1/prediction/${chatflowid}`;
      
      // Chiama l'API Flowise
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          history: history,
          overrideConfig: {
            returnSourceDocuments: false,
            sessionId: sessionId,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Estrai il testo della risposta
      let botResponse = data.text || data.message || 'Mi dispiace, non ho capito. Puoi ripetere?';
      
      // Rimuovi tutti i tag tra ^^ (es: ^survey^, ^base^, ecc.) prima di processare
      const cleanedResponse = botResponse.replace(/\^[^\^]*\^/g, '').trim();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Estrai JSON dalla risposta se presente (usa la risposta originale per il parsing)
      if (onFormGenerated && botResponse) {
        try {
          // Cerca JSON dentro blocchi markdown ```json ... ``` o ``` ... ```
          // Usa [\s\S]*? per matchare anche newline e caratteri speciali
          const jsonBlockMatch = botResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonBlockMatch) {
            const jsonString = jsonBlockMatch[1].trim();
            // Prova a parsare il JSON
            const parsed = JSON.parse(jsonString);
            if (parsed && (parsed.title || parsed.questions)) {
              onFormGenerated(parsed);
              return;
            }
          }
          
          // Se non c'è un blocco markdown, cerca direttamente un oggetto JSON
          // Cerca il primo { e l'ultimo } per catturare l'intero oggetto
          const firstBrace = botResponse.indexOf('{');
          const lastBrace = botResponse.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonString = botResponse.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(jsonString);
            if (parsed && (parsed.title || parsed.questions)) {
              onFormGenerated(parsed);
            }
          }
        } catch (e) {
          console.error('Errore nel parsing del JSON:', e);
          // Se non c'è JSON valido, ignora silenziosamente
        }
      }
    } catch (error) {
      console.error('Errore nella chiamata Flowise:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Assicurati che Flowise sia in esecuzione e che il chatflow ID sia corretto.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Funzione per sanitizzare l'HTML rimuovendo tag pericolosi
  const sanitizeHTML = (html: string): string => {
    // Rimuovi script, iframe, object, embed, form, input per sicurezza
    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/<input[^>]*>/gi, '');
    
    // Sostituisci i riferimenti ai tipi di domanda con placeholder per renderizzazione grafica
    // Cattura varianti come: <p><strong>Tipo:</strong> LIKERT</p>, <strong>Tipo:</strong> RATING, Tipo: MULTIPLE_CHOICE
    sanitized = sanitized.replace(
      /(?:<p>)?(?:<strong>)?Tipo:\s*(?:<\/strong>)?\s*(LIKERT|RATING|MULTIPLE_CHOICE|MULTIPLE CHOICE|NPS|TEXT|DATE|RANKING|FILE_UPLOAD|BRANCHING)(?:<\/p>)?/gi,
      '<div class="question-type-visual" data-type="$1"></div>'
    );
    
    // Normalizza MULTIPLE CHOICE (con spazio) a MULTIPLE_CHOICE
    sanitized = sanitized.replace(/data-type="MULTIPLE CHOICE"/gi, 'data-type="MULTIPLE_CHOICE"');
    
    // Rimuovi tutti i riferimenti duplicati "Tipo: [TIPO]" che appaiono dopo una visualizzazione grafica
    // Estrai tutti i tipi trovati e rimuovi i loro riferimenti testuali successivi
    const foundTypes: string[] = [];
    sanitized.replace(/<div class="question-type-visual" data-type="([^"]+)"><\/div>/gi, (match, type) => {
      if (!foundTypes.includes(type.toUpperCase())) {
        foundTypes.push(type.toUpperCase());
      }
      return match;
    });
    
    // Rimuovi tutti i riferimenti testuali ai tipi già visualizzati graficamente
    foundTypes.forEach(type => {
      const typeVariants = [type, type.replace('_', ' ')];
      typeVariants.forEach(variant => {
        // Rimuovi pattern come "Tipo: RATING", "<p>Tipo: RATING</p>", "<strong>Tipo:</strong> RATING", ecc.
        sanitized = sanitized.replace(
          new RegExp(`(?:<p>)?(?:<strong>)?Tipo:\\s*(?:<\\/strong>)?\\s*${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:<\\/p>)?`, 'gi'),
          ''
        );
      });
    });
    
    return sanitized;
  };

  // Funzione per renderizzare il tipo di domanda graficamente
  const renderQuestionTypeVisual = (type: string) => {
    const typeUpper = type.toUpperCase();
    
    switch (typeUpper) {
      case 'LIKERT':
        return (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Per niente d'accordo</span>
              <span className="text-xs text-gray-600">Completamente d'accordo</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className="h-10 flex flex-col items-center justify-center border border-gray-300 rounded-lg bg-gray-50"
                >
                  <span className="text-xs font-medium text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'RATING':
        return (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
            <div className="flex items-center gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-[#FFCD00] fill-[#FFCD00]"
                />
              ))}
            </div>
          </div>
        );
      
      case 'MULTIPLE_CHOICE':
        return (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
            <div className="space-y-2">
              {['Opzione 1', 'Opzione 2', 'Opzione 3'].map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'NPS':
        return (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
            <div className="flex items-center gap-1 justify-center flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <div
                  key={value}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-gray-50 text-xs font-medium text-gray-700"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'TEXT':
        return (
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-300">
            <textarea
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              placeholder="Risposta di testo..."
              disabled
            />
          </div>
        );
      
      default:
        return (
          <div className="mt-2 inline-block px-2 py-1 bg-gray-200 rounded text-xs font-medium text-gray-700">
            Tipo: {type}
          </div>
        );
    }
  };

  // Funzione per verificare se il contenuto contiene HTML
  const containsHTML = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  return (
    <div className={`flowise-chat-custom ${className}`}>
      <style>{`
        .ai-message-content h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .ai-message-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .ai-message-content p {
          color: #374151;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .ai-message-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ai-message-content li {
          color: #374151;
          margin-top: 0.25rem;
          line-height: 1.6;
        }
        .ai-message-content strong {
          font-weight: 600;
          color: #111827;
        }
        .ai-message-content em {
          font-style: italic;
          color: #4B5563;
        }
        .ai-message-content hr {
          border: none;
          border-top: 1px solid #D1D5DB;
          margin: 1rem 0;
        }
        .ai-message-content code {
          background-color: #F3F4F6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
      `}</style>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col" style={{ height: '500px' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#868789] to-[#000000] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FFCD00]" />
              <h4 className="font-semibold">Chat AI</h4>
            </div>
            <Button
              onClick={resetChat}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-[#FFCD00] hover:text-black"
              title="Ricomincia una nuova conversazione"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Nuova Chat
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4" ref={scrollAreaRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#FFCD00] text-black'
                      : 'bg-gray-100 text-gray-900 border border-gray-300'
                  }`}
                >
                  {message.role === 'assistant' && containsHTML(message.content) ? (
                    <div 
                      className="ai-message-content text-sm"
                      style={{
                        lineHeight: '1.6',
                      }}
                    >
                      {(() => {
                        const sanitized = sanitizeHTML(message.content);
                        // Estrai i placeholder dei tipi di domanda e sostituiscili con componenti React
                        const parts = sanitized.split(/(<div class="question-type-visual" data-type="([^"]+)"><\/div>)/g);
                        return parts.map((part, index) => {
                          const match = part.match(/<div class="question-type-visual" data-type="([^"]+)"><\/div>/);
                          if (match) {
                            return <div key={index}>{renderQuestionTypeVisual(match[1])}</div>;
                          }
                          return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('it-IT', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FFCD00]" />
                    <span className="text-sm text-gray-600">L'AI sta pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-300 p-4 bg-gray-50">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi il tuo messaggio..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
