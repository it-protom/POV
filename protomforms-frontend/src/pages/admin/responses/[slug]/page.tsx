import React from 'react';
"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Eye } from "lucide-react";
import { authenticatedFetch } from '@/lib/utils';

interface Answer {
  id: string;
  questionId: string;
  value: string;
}

interface Response {
  id: string;
  progressiveNumber: number;
  createdAt: string;
  answers: Answer[];
}

interface Form {
  id: string;
  title: string;
  isAnonymous: boolean;
  slug: string;
}

export default function FormResponsesPage() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line
  }, [params.slug]);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      console.log("Fetching form for slug:", params.slug);
      // 1. Trova il form tramite slug
      const formRes = await authenticatedFetch(`/api/forms/by-slug/${params.slug}`);
      if (!formRes.ok) throw new Error("Form non trovato");
      const formData = await formRes.json();
      console.log("Form found:", formData);
      setForm(formData);
      
      // 2. Prendi tutte le risposte di quel form
      console.log("Fetching responses for form ID:", formData.id);
      const respRes = await authenticatedFetch(`/api/forms/${formData.id}/responses`);
      if (!respRes.ok) throw new Error("Errore nel recupero risposte");
      const respData = await respRes.json();
      console.log("Responses found:", respData);
      setResponses(respData);
      setError(null);
    } catch (err: any) {
      console.error("Error in fetchResponses:", err);
      setError(err.message || "Errore generico");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Caricamento...</div>;
  }
  if (error || !form) {
    return <div className="p-8 text-red-600">{error || "Form non trovato"}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#868789] mb-4">
          Risposte per: {form.title}
        </h1>
        <div className="h-1.5 w-20 bg-[#FFCD00] rounded mb-8"></div>
        {responses.length === 0 && <div>Nessuna risposta trovata.</div>}
        <div className="space-y-4">
          {responses
            .sort((a, b) => b.progressiveNumber - a.progressiveNumber)
            .map((response) => (
              <div key={response.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#868789] mb-1">
                    Risposta #{response.progressiveNumber} del {new Date(response.createdAt).toLocaleString("it-IT")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {response.answers.length} risposte
                  </div>
                </div>
                <Link
                  to={`/admin/responses/${params.slug}/${response.progressiveNumber}`}
                  className="inline-flex items-center gap-1 text-sm text-[#FFCD00] hover:text-black transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Dettagli
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 