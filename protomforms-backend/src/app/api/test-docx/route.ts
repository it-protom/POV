import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { QuestionType } from '@/types/question';

interface ParsedQuestion {
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Test API parse-docx chiamata');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('Nessun file ricevuto');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('File ricevuto:', file.name, file.size, file.type);

    // Check file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      console.log('Tipo file non supportato:', file.name);
      return NextResponse.json({ error: 'Only DOCX files are supported' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File convertito in buffer, dimensione:', buffer.length);

    // Parse DOCX content
    console.log('Inizio parsing DOCX...');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    console.log('Testo estratto, lunghezza:', text.length);
    console.log('Primi 500 caratteri:', text.substring(0, 500));

    // Parse questions from text
    console.log('Inizio parsing domande...');
    const questions = parseQuestionsFromText(text);
    console.log('Domande trovate:', questions.length);
    console.log('Domande:', questions);

    return NextResponse.json({ 
      success: true, 
      questions,
      rawText: text.substring(0, 1000) // Limitiamo il testo per il debug
    });

  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return NextResponse.json({ 
      error: 'Error parsing document', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Normalize text: replace multiple newlines with single newlines and trim
  const normalizedText = text.replace(/\n\s*\n/g, '\n').trim();
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('Linee normalizzate:', lines);

  let currentQuestion: ParsedQuestion | null = null;
  let currentOptions: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers and titles
    if (line.startsWith('#') || line.toLowerCase().includes('sondaggio') || 
        line.toLowerCase().includes('questionario') || line.toLowerCase().includes('form')) {
      continue;
    }
    
    // Detect question patterns
    const questionPatterns = [
      /^(\d+)[\.\)]\s*(.+)$/, // 1. Question or 1) Question
      /^[A-Z][A-Z\s]*[\.\)]\s*(.+)$/, // A. Question or A) Question
      /^[Qq]uestion\s*\d*[\.\)]?\s*(.+)$/, // Question 1. or Question 1)
      /^[Dd]omanda\s*\d*[\.\)]?\s*(.+)$/, // Domanda 1. or Domanda 1)
    ];

    let isQuestion = false;
    let questionText = '';

    for (const pattern of questionPatterns) {
      const match = line.match(pattern);
      if (match) {
        isQuestion = true;
        questionText = match[1] || match[0];
        break;
      }
    }

    // If no pattern matches, check if line ends with question mark or contains question words
    if (!isQuestion && (line.includes('?') || 
        line.toLowerCase().includes('come') || 
        line.toLowerCase().includes('quanto') || 
        line.toLowerCase().includes('quale') || 
        line.toLowerCase().includes('dove') || 
        line.toLowerCase().includes('quando') || 
        line.toLowerCase().includes('perché') ||
        line.toLowerCase().includes('why') ||
        line.toLowerCase().includes('how') ||
        line.toLowerCase().includes('what') ||
        line.toLowerCase().includes('when') ||
        line.toLowerCase().includes('where'))) {
      isQuestion = true;
      questionText = line;
    }

    if (isQuestion) {
      // Save previous question if exists
      if (currentQuestion) {
        if (currentOptions.length > 0) {
          currentQuestion.options = currentOptions;
        }
        currentQuestion.type = determineQuestionType(currentQuestion.text, currentOptions);
        questions.push(currentQuestion);
      }

      // Start new question
      currentQuestion = {
        text: questionText,
        type: QuestionType.TEXT,
        required: true
      };
      currentOptions = [];
    } else {
      // Check for answer options
      const optionPatterns = [
        /^[a-d][\.\)]\s*(.+)$/i, // a. Option or a) Option
        /^[A-D][\.\)]\s*(.+)$/, // A. Option or A) Option
        /^[1-4][\.\)]\s*(.+)$/, // 1. Option or 1) Option
        /^[-•*]\s*(.+)$/, // - Option or • Option or * Option
        /^\([a-d]\)\s*(.+)$/i, // (a) Option or (A) Option
      ];

      let isOption = false;
      let optionText = '';

      for (const pattern of optionPatterns) {
        const match = line.match(pattern);
        if (match) {
          isOption = true;
          optionText = match[1] || match[0];
          break;
        }
      }

      // Check for special option indicators
      if (!isOption && (line.toLowerCase().includes('(risposta libera)') || 
          line.toLowerCase().includes('(free text)') ||
          line.toLowerCase().includes('(testo libero)'))) {
        // This is a text question indicator, not an option
        continue;
      }

      if (isOption && currentQuestion) {
        currentOptions.push(optionText);
      } else if (currentQuestion && line.length > 0 && !line.startsWith('(') && !line.startsWith('#')) {
        // Check if this line contains multiple options (like "Eccellente Buono Discreto Scarso")
        const words = line.split(/\s+/);
        if (words.length <= 4 && words.every(word => word.length > 2)) {
          // This might be options on the same line, add them as options
          currentOptions.push(...words);
        } else if (!line.match(/^[a-d][\.\)]/i) && !line.match(/^[1-4][\.\)]/) && !line.match(/^[-•*]/)) {
          // If it's not an option but we have a question, it might be additional question text
          currentQuestion.text += ' ' + line;
        }
      }
    }
  }

  // Add the last question
  if (currentQuestion) {
    if (currentOptions.length > 0) {
      currentQuestion.options = currentOptions;
    }
    // Determina sempre il tipo, anche se non ci sono opzioni
    currentQuestion.type = determineQuestionType(currentQuestion.text, currentOptions);
    questions.push(currentQuestion);
  }

  return questions;
}

function determineQuestionType(questionText: string, options: string[]): QuestionType {
  const text = questionText.toLowerCase();
  
  // Check for rating questions
  if (text.includes('valuta') || text.includes('rating') || text.includes('punteggio') || 
      text.includes('1-5') || text.includes('1-10') || text.includes('da 1 a') ||
      text.includes('scale') || text.includes('scala') || text.includes('livello') ||
      text.includes('molto insoddisfatto') || text.includes('molto soddisfatto')) {
    return QuestionType.RATING;
  }

  // Check for boolean questions (map to MULTIPLE_CHOICE with Yes/No options)
  if (text.includes('sì/no') || text.includes('si/no') || text.includes('yes/no') ||
      text.includes('vero/falso') || text.includes('true/false') ||
      text.includes('raccomanderesti') || text.includes('would you recommend')) {
    return QuestionType.MULTIPLE_CHOICE;
  }

  // Check for multiple choice
  if (options.length > 0) {
    // Look for "select all" or "multiple" indicators
    if (text.includes('seleziona tutti') || text.includes('select all') || 
        text.includes('più risposte') || text.includes('multiple') ||
        text.includes('tutte quelle che') || text.includes('all that apply') ||
        text.includes('tutti quelli che') || text.includes('più opzioni')) {
      return QuestionType.MULTIPLE_CHOICE;
    }
    
    // Default to multiple choice for questions with options
    return QuestionType.MULTIPLE_CHOICE;
  }

  // Default to text
  return QuestionType.TEXT;
} 