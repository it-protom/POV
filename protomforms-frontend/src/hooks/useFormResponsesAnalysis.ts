import { useState } from 'react';
import { authenticatedFetch } from '@/lib/utils';

export interface FormAnalysisRequest {
  agentflowId: string;
  question?: string;
}

export interface FormAnalysisResult {
  success: boolean;
  formId: string;
  formTitle: string;
  totalResponses: number;
  textResponsesCount: number;
  analysis: {
    total?: number;
    positive?: number;
    negative?: number;
    neutral?: number;
    averageScore?: number;
    averageConfidence?: number;
    details?: Array<{
      question: string;
      answer: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
      keywords: string[];
      reasoning: string;
    }>;
    [key: string]: any;
  };
  flowiseResponse?: any;
}

export interface UseFormResponsesAnalysisReturn {
  analyze: (formId: string, request: FormAnalysisRequest) => Promise<FormAnalysisResult | null>;
  loading: boolean;
  error: string | null;
  result: FormAnalysisResult | null;
}

/**
 * Hook per analizzare le risposte di un form usando Flowise Agentflow
 * 
 * @example
 * const { analyze, loading, error, result } = useFormResponsesAnalysis();
 * 
 * const handleAnalyze = async () => {
 *   const result = await analyze('form-id', {
 *     agentflowId: 'b1d6d758-d8c4-4ac9-b023-5791c4939217',
 *     question: 'Analizza tutte le risposte e determina il sentiment'
 *   });
 *   
 *   if (result) {
 *     console.log('Analisi completata:', result.analysis);
 *   }
 * };
 */
export function useFormResponsesAnalysis(): UseFormResponsesAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FormAnalysisResult | null>(null);

  const analyze = async (
    formId: string,
    request: FormAnalysisRequest
  ): Promise<FormAnalysisResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await authenticatedFetch(
        `/api/forms/${formId}/analyze-responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      console.error('Errore nell\'analisi delle risposte:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyze,
    loading,
    error,
    result,
  };
}

