"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import SiriOrb from "./siri-orb";
import { useClickOutside } from "@/hooks/use-click-outside";
import { getFlowiseUrl } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

const SPEED = 1;
const SUCCESS_DURATION = 1500;
const DOCK_HEIGHT = 44;
const FEEDBACK_BORDER_RADIUS = 14;
const DOCK_BORDER_RADIUS = 20;
const SPRING_STIFFNESS = 550;
const SPRING_DAMPING = 45;
const SPRING_MASS = 0.7;
const CLOSE_DELAY = 0.08;
const FEEDBACK_WIDTH = 360;
const FEEDBACK_HEIGHT = 400; // Aumentata per mostrare i messaggi

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MorphSurfaceProps {
  chatflowid?: string;
}

type FooterContext = {
  showFeedback: boolean;
  success: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (message: string) => void;
};

const FooterContext = React.createContext({} as FooterContext);

const useFooter = () => React.useContext(FooterContext);

export function MorphSurface({ chatflowid = "b1d6d758-d8c4-4ac9-b023-5791c4939217" }: MorphSurfaceProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const feedbackRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId] = React.useState(() => uuidv4());
  const flowiseApiHost = getFlowiseUrl();

  const closeFeedback = React.useCallback(() => {
    setShowFeedback(false);
    feedbackRef.current?.blur();
  }, []);

  const openFeedback = React.useCallback(() => {
    setShowFeedback(true);
    // Se non ci sono messaggi, aggiungi il messaggio iniziale
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Ciao! Come posso aiutarti oggi?',
        timestamp: new Date()
      }]);
    }
    setTimeout(() => {
      feedbackRef.current?.focus();
    });
  }, [messages.length]);

  const sendMessage = React.useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    // Aggiungi il messaggio utente
    setMessages(prev => {
      const updatedMessages = [...prev, userMessage];
      
      // Prepara la history per Flowise (usa lo stato precedente, senza il nuovo messaggio)
      const history = prev
        .filter(msg => msg.id !== '1') // Escludi il messaggio iniziale se presente
        .map(msg => ({
          role: msg.role === 'user' ? 'userMessage' : 'apiMessage',
          content: msg.content
        }));

      // Costruisci l'URL completo per l'API Flowise
      const apiUrl = flowiseApiHost.includes('/api/v1') 
        ? `${flowiseApiHost}/prediction/${chatflowid}`
        : `${flowiseApiHost}/api/v1/prediction/${chatflowid}`;
      
      // Chiama l'API Flowise
      setIsLoading(true);
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          question: userMessage.content,
          history: history,
          overrideConfig: {
            returnSourceDocuments: false,
            sessionId: sessionId,
          }
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Estrai il testo della risposta
        let botResponse = data.text || data.message || 'Mi dispiace, non ho capito. Puoi ripetere?';
        
        // Rimuovi tutti i tag tra ^^ (es: ^survey^, ^base^, ecc.)
        const cleanedResponse = botResponse.replace(/\^[^\^]*\^/g, '').trim();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date()
        };

        setMessages(prevMessages => [...prevMessages, assistantMessage]);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Errore nella chiamata Flowise:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setIsLoading(false);
      });

      return updatedMessages;
    });
  }, [chatflowid, flowiseApiHost, sessionId, isLoading]);

  const onFeedbackSuccess = React.useCallback(async (messageText: string) => {
    await sendMessage(messageText);
  }, [sendMessage]);

  useClickOutside(rootRef as React.RefObject<HTMLElement>, closeFeedback);

  const context = React.useMemo(
    () => ({
      showFeedback,
      success,
      openFeedback,
      closeFeedback,
      messages,
      isLoading,
      sendMessage: onFeedbackSuccess,
    }),
    [showFeedback, success, openFeedback, closeFeedback, messages, isLoading, onFeedbackSuccess]
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 max-sm:bottom-3 max-sm:right-3">
      <motion.div
        animate={{
          width: showFeedback ? FEEDBACK_WIDTH : "auto",
          height: showFeedback ? FEEDBACK_HEIGHT : DOCK_HEIGHT,
          borderRadius: showFeedback
            ? FEEDBACK_BORDER_RADIUS
            : DOCK_BORDER_RADIUS,
        }}
        className={cn(
          "relative flex flex-col overflow-hidden border border-gray-200 bg-gray-50 shadow-lg",
          showFeedback ? "min-w-[360px]" : ""
        )}
        data-footer
        initial={false}
        ref={rootRef}
        transition={{
          type: "spring",
          stiffness: SPRING_STIFFNESS / SPEED,
          damping: SPRING_DAMPING,
          mass: SPRING_MASS,
          delay: showFeedback ? 0 : CLOSE_DELAY,
        }}
      >
        <FooterContext.Provider value={context}>
          <Dock />
          <Feedback onSuccess={onFeedbackSuccess} ref={feedbackRef} />
        </FooterContext.Provider>
      </motion.div>
    </div>
  );
}

function Dock() {
  const { showFeedback, openFeedback } = useFooter();

  if (showFeedback) return null;

  return (
    <footer className="flex h-[44px] select-none items-center justify-center whitespace-nowrap">
      <div className="flex items-center justify-center gap-2 px-3 max-sm:h-10 max-sm:px-2">
        <div className="flex w-fit items-center gap-2">
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SiriOrb
              colors={{
                bg: "oklch(22.64% 0 0)",
              }}
              size="24px"
            />
          </motion.div>
        </div>
        <Button
          className="flex h-fit flex-1 justify-end rounded-full px-2 py-0.5!"
          onClick={openFeedback}
          type="button"
          variant="ghost"
        >
          <span className="truncate">Ask AI</span>
        </Button>
      </div>
    </footer>
  );
}

function Feedback({
  ref,
  onSuccess,
}: {
  ref: React.Ref<HTMLTextAreaElement>;
  onSuccess: (message: string) => void;
}) {
  const { closeFeedback, showFeedback, messages, isLoading, sendMessage } = useFooter();
  const submitRef = React.useRef<HTMLButtonElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = React.useState('');

  // Scroll automatico alla fine dei messaggi
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue('');
      if (ref && 'current' in ref && ref.current) {
        ref.current.value = '';
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      closeFeedback();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitRef.current?.click();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
  }

  if (!showFeedback) return null;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col bg-gray-50 z-10"
      initial={{ opacity: 0 }}
      style={{
        pointerEvents: "all",
      }}
      transition={{
        type: "spring",
        stiffness: SPRING_STIFFNESS / SPEED,
        damping: SPRING_DAMPING,
        mass: SPRING_MASS,
      }}
    >
          <form 
            className="flex h-full flex-col"
            onSubmit={onSubmit}
          >
            <div className="flex h-full flex-col p-1">
            <div className="flex justify-between py-1 px-2">
              <p className="z-20 ml-[38px] flex select-none items-center gap-[6px] text-gray-700 text-sm font-medium">
                AI Chat
              </p>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-2 text-xs ${
                      message.role === 'user'
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-2 border border-gray-300">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                      <span className="text-xs text-gray-600">L'AI sta pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-200 p-3 bg-gray-50/50">
              <div className="relative">
                <textarea
                  className="w-full resize-none rounded-xl bg-white border border-gray-200 px-4 py-3 pr-12 outline-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-md"
                  name="message"
                  onKeyDown={onKeyDown}
                  onChange={handleInputChange}
                  value={inputValue}
                  placeholder="Scrivi un messaggio..."
                  ref={ref}
                  rows={2}
                  disabled={isLoading}
                  spellCheck={false}
                />
                {inputValue.trim() && !isLoading && (
                  <motion.button
                    type="submit"
                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
          </form>
          
      {/* SiriOrb quando aperto */}
      <motion.div
        animate={{ opacity: 1 }}
        className="absolute top-2 left-3 pointer-events-none"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <SiriOrb
          colors={{
            bg: "oklch(22.64% 0 0)",
          }}
          size="24px"
        />
      </motion.div>
    </motion.div>
  );
}

function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "flex h-6 w-fit items-center justify-center rounded-sm border border-gray-300 bg-gray-100 px-[6px] font-sans text-gray-700",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Add default export for lazy loading
export default MorphSurface;

