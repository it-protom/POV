import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormClient({ form }: { form: any }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    console.log('Invio risposta...', answers);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      console.log('API response:', res.status);
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Errore nell\'invio della risposta');
      }
    } catch (err) {
      setError('Errore di rete');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[300px]"
      >
        <div className="w-20 h-20 rounded-full bg-[#FFCD00] flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-[#868789] mb-2">Risposta inviata!</h2>
        <p className="text-gray-600 text-center">Grazie per aver compilato il sondaggio.<br />{form.thankYouMessage || 'La tua opinione è importante per noi.'}</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 text-[#868789]">{form.title}</h1>
        {form.description && <p className="mb-6 text-gray-600 text-lg">{form.description}</p>}
      </motion.div>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence>
            {form.questions.map((q: any, idx: number) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ delay: idx * 0.08, duration: 0.5, type: 'spring', stiffness: 80 }}
                className="bg-gray-50 rounded-xl shadow p-5 border-l-4 border-[#FFCD00]"
              >
                <label className="block font-semibold text-lg mb-2 text-[#868789]">
                  {idx + 1}. {q.text} {q.required && <span className="text-red-500">*</span>}
                </label>
                {q.type === 'TEXT' && (
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#FFCD00] transition"
                    placeholder="Risposta..."
                    required={q.required}
                    value={answers[q.id] || ''}
                    onChange={e => handleChange(q.id, e.target.value)}
                  />
                )}
                {q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && (
                  <div className="flex flex-col gap-2 mt-2">
                    {q.options.map((opt: string, i: number) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleChange(q.id, opt)}
                          required={q.required}
                          className="accent-[#FFCD00]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={false}
            className="w-full bg-[#FFCD00] text-black font-semibold py-4 rounded-lg text-lg shadow hover:bg-[#FFCD00]/90 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></span>
            ) : null}
            {submitting ? 'Invio in corso...' : 'Invia Risposte'}
          </motion.button>
        </form>
      </div>
    </>
  );
} 