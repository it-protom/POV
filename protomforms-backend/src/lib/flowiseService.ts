/**
 * Servizio per interagire con Flowise API
 * Simile al pattern usato in AGO Explorer
 */

export interface FlowisePredictionRequest {
  question: string;
  history?: Array<{
    role: 'userMessage' | 'apiMessage';
    content: string;
  }>;
  overrideConfig?: {
    returnSourceDocuments?: boolean;
    sessionId?: string;
    vars?: Record<string, any>;
    form?: Record<string, any>;
  };
}

export interface FlowisePredictionResponse {
  text?: string;
  message?: string;
  sourceDocuments?: any[];
  [key: string]: any;
}

/**
 * Ottiene l'URL base di Flowise
 */
export function getFlowiseBaseUrl(): string {
  // In produzione usa l'URL configurato, altrimenti localhost
  const flowiseUrl = process.env.FLOWISE_API_URL || process.env.FLOWISE_URL;
  
  if (flowiseUrl) {
    return flowiseUrl;
  }
  
  // Fallback: usa localhost per sviluppo, produzione usa porta 4005
  return process.env.NODE_ENV === 'production' 
    ? 'http://127.0.0.1:4005'
    : 'http://localhost:4005';
}

/**
 * Chiama l'API Flowise per una prediction
 * @param chatflowId ID del chatflow/agentflow
 * @param request Dati della richiesta
 * @returns Risposta da Flowise
 */
export async function callFlowisePrediction(
  chatflowId: string,
  request: FlowisePredictionRequest
): Promise<FlowisePredictionResponse> {
  const baseUrl = getFlowiseBaseUrl();
  const url = `${baseUrl}/api/v1/prediction/${chatflowId}`;
  
  console.log('🔵 Calling Flowise:', {
    url,
    chatflowId,
    hasVars: !!request.overrideConfig?.vars,
    hasForm: !!request.overrideConfig?.form,
  });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Flowise API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Flowise API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Flowise response received');
    
    return data;
  } catch (error) {
    console.error('❌ Error calling Flowise:', error);
    throw error;
  }
}

/**
 * Prepara le variabili per l'analisi delle risposte dei form
 * @param formData Dati del form
 * @param responses Array di risposte
 * @param userId ID utente (opzionale)
 * @returns Variabili da passare a Flowise
 */
export function prepareFormResponsesVars(
  formData: {
    id: string;
    title: string;
    description?: string | null;
    questions: Array<{
      id: string;
      text: string;
      type: string;
    }>;
  },
  responses: Array<{
    id: string;
    progressiveNumber: number | null;
    createdAt: Date;
    answers: Array<{
      questionId: string;
      value: any;
      question: {
        id: string;
        text: string;
        type: string;
      };
    }>;
  }>,
  userId?: string | null
): Record<string, any> {
  // Estrai solo risposte testuali per l'analisi sentiment
  const textAnswers = responses.flatMap(response => 
    response.answers
      .filter(answer => answer.question.type === 'TEXT')
      .map(answer => ({
        responseId: response.id,
        progressiveNumber: response.progressiveNumber,
        question: answer.question.text,
        answer: typeof answer.value === 'string' 
          ? answer.value 
          : JSON.stringify(answer.value),
        createdAt: response.createdAt.toISOString(),
      }))
  );
  
  // Prepara il contesto per Flowise
  const responsesContext = textAnswers.map((item, index) => 
    `Risposta ${index + 1} (ID: ${item.responseId}, Progressivo: ${item.progressiveNumber}):
Domanda: ${item.question}
Risposta: ${item.answer}
Data: ${item.createdAt}
---`
  ).join('\n\n');
  
  return {
    formId: formData.id,
    formTitle: formData.title,
    formDescription: formData.description || '',
    totalResponses: responses.length,
    textResponsesCount: textAnswers.length,
    responsesContext: responsesContext,
    responsesData: JSON.stringify(textAnswers),
    userId: userId || null,
  };
}

