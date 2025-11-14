import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { QuestionFormData, QuestionType } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Star } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface SortableQuestionProps {
  question: QuestionFormData;
  onEdit: (question: QuestionFormData) => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedQuestion: QuestionFormData) => void;
}

export function SortableQuestion({ question, onEdit, onDelete, onUpdate }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderQuestionPreview = () => {
    switch (question.type) {
      case QuestionType.TEXT:
        return (
          <Textarea 
            placeholder="Risposta di testo..." 
            className="w-full border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]" 
            disabled 
          />
        );
      
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <RadioGroup className="space-y-2" disabled>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`preview-${index}`} />
                <Label htmlFor={`preview-${index}`} className="text-[#868789]">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case QuestionType.RATING:
        return (
          <>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-6 h-6 text-[#FFCD00] opacity-50"
              />
            ))}
          </>
        );
      
      case QuestionType.DATE:
        return (
          <Input 
            type="date" 
            className="w-full border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]" 
            disabled 
          />
        );
      
      case QuestionType.LIKERT:
        return (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm text-[#868789] mb-2">
              <span>Fortemente in disaccordo</span>
              <span>Fortemente d'accordo</span>
            </div>
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex flex-col items-center">
                  <RadioGroup disabled>
                    <RadioGroupItem value={value.toString()} />
                  </RadioGroup>
                  <span className="text-xs text-[#868789] mt-1">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case QuestionType.NPS:
        return (
          <div className="flex justify-between items-center w-full">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-8 h-8 rounded-full border-gray-200 text-[#868789] hover:bg-[#FFCD00] hover:text-black"
                disabled
              >
                {i}
              </Button>
            ))}
          </div>
        );
      
      case QuestionType.FILE_UPLOAD:
        return (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <p className="text-[#868789]">Trascina qui il file o clicca per selezionarlo</p>
            <p className="text-sm text-[#868789] mt-1">Supporto per un singolo file</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4 border-2 border-transparent hover:border-[#FFCD00] transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <button
              className="cursor-grab active:cursor-grabbing text-[#868789] hover:text-[#FFCD00] transition-colors"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-black">{question.text}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(question)}
              className="hover:bg-[#FFCD00]/10 hover:text-[#FFCD00]"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(question.id)}
              className="hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderQuestionPreview()}
        </CardContent>
      </Card>
    </div>
  );
} 