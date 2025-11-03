import React from 'react';
import { QuestionType } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
}

export function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select question type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
        <SelectItem value={QuestionType.TEXT}>Text</SelectItem>
        <SelectItem value={QuestionType.RATING}>Rating</SelectItem>
        <SelectItem value={QuestionType.DATE}>Date</SelectItem>
        <SelectItem value={QuestionType.RANKING}>Ranking</SelectItem>
        <SelectItem value={QuestionType.LIKERT}>Likert Scale</SelectItem>
        <SelectItem value={QuestionType.FILE_UPLOAD}>File Upload</SelectItem>
        <SelectItem value={QuestionType.NPS}>NPS</SelectItem>
        <SelectItem value={QuestionType.BRANCHING}>Branching</SelectItem>
      </SelectContent>
    </Select>
  );
} 