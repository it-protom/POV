import { z } from 'zod';

// Form validation schemas
export const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  type: z.enum(['SURVEY', 'QUIZ']),
  theme: z.any().optional(),
  opensAt: z.date().optional(),
  closesAt: z.date().optional(),
  isAnonymous: z.boolean().default(false),
  allowEdit: z.boolean().default(false),
  showResults: z.boolean().default(false),
  thankYouMessage: z.string().max(500, 'Thank you message is too long').optional(),
});

// Question validation schemas
export const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(500, 'Question text is too long'),
  type: z.enum([
    'MULTIPLE_CHOICE',
    'TEXT',
    'RATING',
    'DATE',
    'RANKING',
    'LIKERT',
    'FILE_UPLOAD',
    'NPS',
    'BRANCHING',
  ]),
  required: z.boolean().default(false),
  options: z.any().optional(),
  correctAnswer: z.any().optional(),
  order: z.number().int().min(0),
});

// Response validation schemas
export const responseSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'Question ID is required'),
      value: z.any(),
    })
  ),
});

// Export types
export type FormInput = z.infer<typeof formSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ResponseInput = z.infer<typeof responseSchema>;


