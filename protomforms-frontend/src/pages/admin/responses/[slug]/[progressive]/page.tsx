import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useParams } from "react-router-dom";

interface Answer {
  id: string;
  questionId: string;
  value: string;
  question: {
    text: string;
    type: string;
  };
}

interface Response {
  id: string;
  formId: string;
  createdAt: string;
  progressiveNumber: number;
  form: {
    title: string;
    isAnonymous: boolean;
    slug: string;
  };
  answers: Answer[];
}

export default function ResponseDetailsPage() {
  const params = useParams();
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponse();
  }, []);

  const fetchResponse = async () => {
    try {
      const res = await fetch(`/api/responses/${params.slug}/${params.progressive}`);
      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }
      const data = await res.json();
      setResponse(data);
      setError(null);
    } catch (err) {
      setError('Error loading response');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-protom-yellow"></div>
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-red-600">{error || 'Response not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            to="/admin/responses"
            className="inline-flex items-center text-[#868789] hover:text-black transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Torna alle Risposte
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-[#868789] mb-2">
            {response.form.title}
          </h1>
          <div className="text-sm text-[#868789] mb-2">
            Risposta #{response.progressiveNumber} del {formatDate(response.createdAt)}
            {response.form.isAnonymous && (
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                Anonima
              </span>
            )}
          </div>
          <div className="h-1.5 w-20 bg-[#FFCD00] rounded"></div>
        </div>

        <div className="space-y-6">
          {response.answers.map((answer) => (
            <div key={answer.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="text-sm text-[#868789] mb-1">Domanda</div>
              <div className="text-lg font-medium text-[#868789] mb-4">
                {answer.question.text}
              </div>
              
              <div className="text-sm text-[#868789] mb-1">Risposta</div>
              <div className="text-lg text-[#868789]">
                {answer.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 