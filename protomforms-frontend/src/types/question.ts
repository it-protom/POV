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

export interface MultipleChoiceOptions {
  choices?: string[];
  multiple?: boolean;
  maxSelections?: number;
}

export interface QuestionFormData {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[] | MultipleChoiceOptions;
  dateOptions?: DateOptions;
} 