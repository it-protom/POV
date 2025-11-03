export enum QuestionType {
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RATING = 'RATING',
  DATE = 'DATE',
  RANKING = 'RANKING',
  LIKERT = 'LIKERT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  NPS = 'NPS',
  BRANCHING = 'BRANCHING'
}

export interface DateOptions {
  isRange: boolean;
  minDate?: string;
  maxDate?: string;
}

export interface QuestionFormData {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  dateOptions?: DateOptions;
}

export interface Question extends QuestionFormData {
  formId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  responseId: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

