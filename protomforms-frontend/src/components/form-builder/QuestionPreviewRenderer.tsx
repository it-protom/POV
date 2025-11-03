// Component helper per renderizzare l'anteprima di una domanda nel form customization
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, GripVertical } from 'lucide-react';
import { Theme } from './FormCustomization';

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: any;
}

interface QuestionPreviewRendererProps {
  question: Question;
  questionNumber: number;
  theme: Theme;
}

export function QuestionPreviewRenderer({ question, questionNumber, theme }: QuestionPreviewRendererProps) {
  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center mb-6">
        <span 
          className="w-10 h-10 flex items-center justify-center rounded-full text-white mr-4 text-lg font-semibold"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {questionNumber}
        </span>
        <Label className="text-xl font-semibold" style={{ color: theme.textColor }}>
          {question.text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>

      {/* Question Input based on type */}
      <div className="pl-14">
        {question.type === 'TEXT' && (
          <Input
            placeholder="Inserisci la tua risposta..."
            readOnly
            className="w-full"
            style={{ borderColor: theme.accentColor, borderRadius: `${theme.borderRadius}px` }}
          />
        )}

        {question.type === 'MULTIPLE_CHOICE' && (() => {
          const choices = Array.isArray(question.options)
            ? question.options
            : question.options?.choices || [];
          const multiple = question.options?.multiple || false;

          return (
            <div className="space-y-3">
              {choices.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={`preview-${question.id}`}
                    className="accent-current"
                    style={{ accentColor: theme.primaryColor }}
                    readOnly
                  />
                  <Label className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </div>
          );
        })()}

        {question.type === 'CHECKBOX' && (() => {
          const checkboxOptions = Array.isArray(question.options)
            ? question.options
            : question.options?.choices || [];

          return (
            <div className="space-y-3">
              {checkboxOptions.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`preview-${question.id}-${index}`}
                    className="accent-current"
                    style={{ accentColor: theme.primaryColor }}
                  />
                  <Label htmlFor={`preview-${question.id}-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );
        })()}

        {question.type === 'RATING' && (
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant="outline"
                className="w-12 h-12"
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.textColor,
                  borderRadius: `${theme.borderRadius}px`
                }}
              >
                {rating}
              </Button>
            ))}
          </div>
        )}

        {question.type === 'DATE' && (
          <Input
            type="text"
            placeholder="Seleziona una data..."
            readOnly
            className="w-full"
            style={{ borderColor: theme.accentColor, borderRadius: `${theme.borderRadius}px` }}
          />
        )}

        {question.type === 'LIKERT' && (() => {
          const scale = question.options?.scale || 5;
          const labels = question.options?.labels || [];

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {labels[0] || "Per niente d'accordo"}
                </span>
                <span className="text-sm text-gray-500">
                  {labels[scale - 1] || "Completamente d'accordo"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: scale }, (_, index) => (
                  <div key={index} className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 flex flex-col items-center justify-center"
                      style={{
                        borderColor: theme.primaryColor,
                        color: theme.textColor,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      <span className="text-sm font-medium">{index + 1}</span>
                      {labels[index] && (
                        <span className="text-xs mt-1">{labels[index]}</span>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {question.type === 'NPS' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">0 - Non lo consiglierei</span>
              <span className="text-sm text-gray-500">10 - Lo consiglierei sicuramente</span>
            </div>
            <div className="flex items-center space-x-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant="outline"
                  className="w-10 h-10"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.textColor,
                    borderRadius: `${theme.borderRadius}px`
                  }}
                >
                  {rating}
                </Button>
              ))}
            </div>
          </div>
        )}

        {question.type === 'RANKING' && (() => {
          const rankingOptions = (question.options as string[]) || [];

          return (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">
                Trascina per riordinare in base alla tua preferenza
              </p>
              {rankingOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white border rounded-md cursor-move"
                  style={{ borderColor: theme.accentColor, borderRadius: `${theme.borderRadius}px` }}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-sm">
                    {index + 1}
                  </span>
                  <span>{option}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {question.type === 'FILE_UPLOAD' && (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Trascina un file qui o clicca per selezionare
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              style={{
                borderColor: theme.primaryColor,
                color: theme.textColor,
                borderRadius: `${theme.borderRadius}px`
              }}
            >
              Seleziona file
            </Button>
          </div>
        )}

        {question.type === 'BRANCHING' && (
          <div className="text-sm text-gray-500">
            <p className="mb-2">
              Questa domanda determina il flusso del questionario in base alle tue risposte precedenti.
            </p>
            <p className="font-medium">
              Rispondi alle domande precedenti per vedere le domande successive.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

