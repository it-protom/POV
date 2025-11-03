import { QuestionFormData, QuestionType } from '../types';

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  questions: QuestionFormData[];
}

export const formTemplates: FormTemplate[] = [
  {
    id: 'satisfaction',
    title: 'Sondaggio di soddisfazione',
    description: 'Modello per valutare la soddisfazione dei clienti',
    questions: [
      {
        id: '1',
        type: QuestionType.NPS,
        text: 'Quanto è probabile che raccomandi il nostro servizio a un amico o collega?',
        required: true,
      },
      {
        id: '2',
        type: QuestionType.RATING,
        text: 'Come valuteresti la qualità del servizio ricevuto?',
        required: true,
      },
      {
        id: '3',
        type: QuestionType.TEXT,
        text: 'Quali aspetti del servizio potrebbero essere migliorati?',
        required: false,
      },
    ],
  },
  {
    id: 'digital-transformation',
    title: 'Valutazione trasformazione digitale',
    description: 'Modello per valutare l\'efficacia della trasformazione digitale',
    questions: [
      {
        id: '1',
        type: QuestionType.LIKERT,
        text: 'I nuovi strumenti digitali hanno migliorato la mia efficienza lavorativa',
        required: true,
      },
      {
        id: '2',
        type: QuestionType.LIKERT,
        text: 'La formazione ricevuta è stata sufficiente per utilizzare i nuovi strumenti',
        required: true,
      },
      {
        id: '3',
        type: QuestionType.TEXT,
        text: 'Quali sono i principali ostacoli che hai incontrato nell\'utilizzo dei nuovi strumenti?',
        required: false,
      },
    ],
  },
  {
    id: 'wellbeing',
    title: 'Indagine sul benessere',
    description: 'Modello per valutare il benessere dei dipendenti',
    questions: [
      {
        id: '1',
        type: QuestionType.RATING,
        text: 'Come valuteresti il tuo livello di soddisfazione lavorativa?',
        required: true,
      },
      {
        id: '2',
        type: QuestionType.LIKERT,
        text: 'Il lavoro è fonte di stress eccessivo',
        required: true,
      },
      {
        id: '3',
        type: QuestionType.TEXT,
        text: 'Quali iniziative potrebbero migliorare il tuo benessere lavorativo?',
        required: false,
      },
    ],
  },
  {
    id: 'training',
    title: 'Valutazione formazione',
    description: 'Modello per valutare l\'efficacia della formazione',
    questions: [
      {
        id: '1',
        type: QuestionType.RATING,
        text: 'Come valuteresti la qualità complessiva della formazione?',
        required: true,
      },
      {
        id: '2',
        type: QuestionType.LIKERT,
        text: 'I contenuti della formazione sono stati chiari e comprensibili',
        required: true,
      },
      {
        id: '3',
        type: QuestionType.TEXT,
        text: 'Quali argomenti vorresti approfondire in futuro?',
        required: false,
      },
    ],
  },
]; 
