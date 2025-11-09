/**
 * Esempio di come usare l'API per analizzare le risposte di un form
 * con Flowise Agentflow
 */

import { useFormResponsesAnalysis } from '@/hooks/useFormResponsesAnalysis';

// Esempio 1: Uso dell'hook React
export function ExampleUseHook() {
  const { analyze, loading, error, result } = useFormResponsesAnalysis();

  const handleAnalyze = async (formId: string) => {
    const analysisResult = await analyze(formId, {
      agentflowId: '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
      question: 'Analizza tutte le risposte e determina il sentiment generale'
    });

    if (analysisResult) {
      console.log('✅ Analisi completata:', {
        total: analysisResult.totalResponses,
        textResponses: analysisResult.textResponsesCount,
        analysis: analysisResult.analysis
      });
    }
  };

  return {
    handleAnalyze,
    loading,
    error,
    result
  };
}

// Esempio 2: Chiamata diretta con fetch
export async function exampleDirectFetch(formId: string, userId: string) {
  try {
    const response = await fetch(
      `/api/forms/${formId}/analyze-responses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          agentflowId: '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
          question: 'Analizza tutte le risposte e determina il sentiment generale'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore nell\'analisi');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Errore:', error);
    throw error;
  }
}

// Esempio 3: Analisi con domanda personalizzata
export async function exampleCustomQuestion(
  formId: string, 
  userId: string,
  customQuestion: string
) {
  const response = await fetch(
    `/api/forms/${formId}/analyze-responses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        agentflowId: '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
        question: customQuestion
      })
    }
  );

  return await response.json();
}

// Esempio 4: Analisi con authenticatedFetch (usando il sistema di auth esistente)
import { authenticatedFetch } from '@/lib/utils';

export async function exampleWithAuth(formId: string) {
  const response = await authenticatedFetch(
    `/api/forms/${formId}/analyze-responses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentflowId: '9a96c980-b7a2-48af-ae0b-5b17b8daa9bb',
        question: 'Analizza tutte le risposte e determina il sentiment generale'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Errore nell\'analisi');
  }

  return await response.json();
}

