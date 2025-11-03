import { Role, FormType, QuestionType } from '@prisma/client';

// Extend the NextAuth session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    };
  }
}

// Form types
export interface Form {
  id: string;
  title: string;
  description?: string | null;
  type: FormType;
  theme?: any;
  ownerId: string;
  opensAt?: Date | null;
  closesAt?: Date | null;
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
  responses: Response[];
}

// Question types
export interface Question {
  id: string;
  formId: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: any;
  correctAnswer?: any;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  answers: Answer[];
}

// Response types
export interface Response {
  id: string;
  formId: string;
  userId?: string | null;
  score?: number | null;
  createdAt: Date;
  updatedAt: Date;
  answers: Answer[];
}

// Answer types
export interface Answer {
  id: string;
  responseId: string;
  questionId: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
} 