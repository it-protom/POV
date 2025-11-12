import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Star, Plus, Trash2, FormInput, BarChart3, Share2, CheckSquare, Layout, ChevronDown, File, X } from 'lucide-react';
import { SortableQuestion } from './SortableQuestion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { TemplateSelector } from './TemplateSelector';
import { formTemplates } from '../../lib/form-templates';
import { QuestionType, QuestionFormData, DateOptions, MultipleChoiceOptions } from '../../types/question';

interface QuestionBuilderProps {
  questions: QuestionFormData[];
  onQuestionsChange: (questions: QuestionFormData[]) => void;
  hideHeader?: boolean;
}

// Helper functions per gestire le opzioni multiple choice
const getChoices = (options: string[] | MultipleChoiceOptions | undefined): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return options.choices || [];
};

const getMultiple = (options: string[] | MultipleChoiceOptions | undefined): boolean => {
  if (!options || Array.isArray(options)) return false;
  return options.multiple || false;
};

const getMaxSelections = (options: string[] | MultipleChoiceOptions | undefined): number | undefined => {
  if (!options || Array.isArray(options)) return undefined;
  return options.maxSelections;
};

const setChoices = (options: string[] | MultipleChoiceOptions | undefined, choices: string[]): string[] | MultipleChoiceOptions => {
  if (!options || Array.isArray(options)) {
    return choices;
  }
  return {
    ...options,
    choices
  };
};

const setMultiple = (options: string[] | MultipleChoiceOptions | undefined, multiple: boolean, maxSelections?: number): string[] | MultipleChoiceOptions => {
  const choices = getChoices(options);
  if (!multiple) {
    return choices; // Ritorna array semplice se non è multipla
  }
  return {
    choices,
    multiple: true,
    maxSelections
  };
};

export function QuestionBuilder({ questions, onQuestionsChange, hideHeader = false }: QuestionBuilderProps) {
  const [activeQuestion, setActiveQuestion] = useState<QuestionFormData | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      onQuestionsChange(newQuestions);
    }
  };

  const renderQuestionPreview = (question: QuestionFormData) => {
    if (!question) return null;

    switch (question.type) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <RadioGroup className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case QuestionType.TEXT:
        return <Textarea placeholder="Enter your answer here..." className="w-full" />;
      
      case QuestionType.RATING:
        return (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-6 h-6 text-gray-300 cursor-pointer hover:text-yellow-400"
              />
            ))}
          </div>
        );
      
      case QuestionType.DATE:
        return <Input type="date" className="w-full" />;
      
      case QuestionType.LIKERT:
        return (
          <div className="space-y-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th></th>
                  <th className="text-center p-2">Strongly Disagree</th>
                  <th className="text-center p-2">Disagree</th>
                  <th className="text-center p-2">Neutral</th>
                  <th className="text-center p-2">Agree</th>
                  <th className="text-center p-2">Strongly Agree</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">{question.text}</td>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <td key={value} className="text-center">
                      <RadioGroup>
                        <RadioGroupItem value={value.toString()} />
                      </RadioGroup>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case QuestionType.NPS:
        return (
          <div className="flex justify-between items-center w-full">
            {Array.from({ length: 11 }, (_, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-10 h-10 rounded-full"
              >
                {i}
              </Button>
            ))}
          </div>
        );
      
      case QuestionType.FILE_UPLOAD:
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <p>Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">Support for a single file</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: QuestionFormData = {
      id: uuidv4(),
      type,
      text: '',
      required: false,
      options: type === QuestionType.MULTIPLE_CHOICE ? [''] : undefined,
      dateOptions: type === QuestionType.DATE ? { isRange: false } : undefined
    };

    setActiveQuestion(newQuestion);
    setEditingQuestion(newQuestion);
    setIsAdding(true);
    setIsEditing(true);
  };

  const handleUpdateQuestion = (question: QuestionFormData) => {
    setEditingQuestion({ ...question });
    setIsEditing(true);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    const updatedQuestions = isAdding
      ? [...questions, editingQuestion]
      : questions.map((q) => q.id === editingQuestion.id ? editingQuestion : q);

    onQuestionsChange(updatedQuestions);
    setActiveQuestion(null);
    setEditingQuestion(null);
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleDeleteQuestion = (id: string) => {
    const updatedQuestions = questions.filter((q) => q.id !== id);
    onQuestionsChange(updatedQuestions);
  };

  const handleAddOption = () => {
    if (!editingQuestion || !newOption.trim()) return;

    const currentChoices = getChoices(editingQuestion.options);
    const updatedQuestion = {
      ...editingQuestion,
      options: setChoices(editingQuestion.options, [...currentChoices, newOption.trim()])
    };

    setEditingQuestion(updatedQuestion);
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    if (!editingQuestion) return;

    const currentChoices = getChoices(editingQuestion.options);
    const updatedChoices = currentChoices.filter((_: string, i: number) => i !== index);
    const updatedQuestion = {
      ...editingQuestion,
      options: setChoices(editingQuestion.options, updatedChoices)
    };

    setEditingQuestion(updatedQuestion);
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    if (!editingQuestion) return;

    const updatedQuestion: QuestionFormData = {
      ...editingQuestion,
      type,
      options: type === QuestionType.MULTIPLE_CHOICE ? [''] : undefined,
      dateOptions: type === QuestionType.DATE ? { isRange: false } : undefined
    };

    setEditingQuestion(updatedQuestion);
  };

  const handleBranchingClick = (question: QuestionFormData) => {
    toast("Branching non disponibile", {
      description: "Questa funzionalità sarà disponibile in futuro."
    });
  };

  const handleSelectTemplate = (template: typeof formTemplates[0]) => {
    onQuestionsChange(template.questions);
    setShowTemplates(false);
  };

  if (showTemplates) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-black">Crea un nuovo form</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowTemplates(false)}
            className="bg-white hover:bg-[#FFCD00] hover:text-black border-[#FFCD00] text-[#868789] transition-colors duration-300"
          >
            Crea da zero
          </Button>
        </div>
        <TemplateSelector
          templates={formTemplates}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {!hideHeader && (
          <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-black">Costruisci il tuo form</h2>
            <Button 
              variant="outline" 
              onClick={() => setShowTemplates(true)}
              className="bg-white hover:bg-[#FFCD00] hover:text-black border-[#FFCD00] text-[#868789] transition-colors duration-300"
            >
              Usa un modello predefinito
            </Button>
          </div>
        )}

        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <SortableQuestion
                key={question.id}
                question={question}
                onEdit={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onUpdate={(updatedQuestion) => {
                  handleUpdateQuestion(updatedQuestion);
                  onQuestionsChange(questions.map((q) => q.id === updatedQuestion.id ? updatedQuestion : q));
                }}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false);
          setEditingQuestion(null);
          setIsAdding(false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              {isAdding ? "Aggiungi Domanda" : "Modifica Domanda"}
            </DialogTitle>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text" className="text-[#868789] font-medium">Testo della domanda</Label>
                <Input
                  id="question-text"
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value
                  })}
                  placeholder="Inserisci il testo della domanda"
                  className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#868789] font-medium">Tipo di domanda</Label>
                <Select
                  value={editingQuestion.type}
                  onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]">
                    <SelectValue placeholder="Seleziona il tipo di domanda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuestionType.TEXT}>Testo</SelectItem>
                    <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Scelta Multipla</SelectItem>
                    <SelectItem value={QuestionType.RATING}>Valutazione</SelectItem>
                    <SelectItem value={QuestionType.DATE}>Data</SelectItem>
                    <SelectItem value={QuestionType.LIKERT}>Scala Likert</SelectItem>
                    <SelectItem value={QuestionType.NPS}>NPS</SelectItem>
                    <SelectItem value={QuestionType.FILE_UPLOAD}>Caricamento File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={editingQuestion.required}
                  onCheckedChange={(checked) => setEditingQuestion({
                    ...editingQuestion,
                    required: checked
                  })}
                  className="data-[state=checked]:bg-[#FFCD00]"
                />
                <Label htmlFor="required" className="text-[#868789] font-medium">Obbligatoria</Label>
              </div>

              {editingQuestion.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#868789] font-medium">Opzioni</Label>
                    <div className="space-y-2">
                      {getChoices(editingQuestion.options).map((option: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const currentChoices = getChoices(editingQuestion.options);
                              const newChoices = [...currentChoices];
                              newChoices[index] = e.target.value;
                              setEditingQuestion({
                                ...editingQuestion,
                                options: setChoices(editingQuestion.options, newChoices)
                              });
                            }}
                            placeholder={`Opzione ${index + 1}`}
                            className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(index)}
                            className="hover:bg-red-100 hover:text-red-600"
                            disabled={getChoices(editingQuestion.options).length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Aggiungi una nuova opzione"
                          className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newOption.trim()) {
                              e.preventDefault();
                              handleAddOption();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleAddOption}
                          className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
                          disabled={!newOption.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {getChoices(editingQuestion.options).length === 0 && (
                        <p className="text-sm text-red-500">Aggiungi almeno un'opzione</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="allow-multiple" className="font-medium text-[#868789]">
                          Permetti scelta multipla
                        </Label>
                        <p className="text-sm text-gray-500">
                          Consenti agli utenti di selezionare più opzioni
                        </p>
                      </div>
                      <Switch
                        id="allow-multiple"
                        checked={getMultiple(editingQuestion.options)}
                        onCheckedChange={(checked) => {
                          const currentChoices = getChoices(editingQuestion.options);
                          setEditingQuestion({
                            ...editingQuestion,
                            options: setMultiple(editingQuestion.options, checked, checked ? currentChoices.length : undefined)
                          });
                        }}
                        className="data-[state=checked]:bg-[#FFCD00]"
                      />
                    </div>

                    {getMultiple(editingQuestion.options) && (
                      <div className="space-y-2">
                        <Label htmlFor="max-selections" className="text-[#868789] font-medium">
                          Numero massimo di selezioni
                        </Label>
                        <Input
                          id="max-selections"
                          type="number"
                          min="1"
                          max={getChoices(editingQuestion.options).length}
                          value={getMaxSelections(editingQuestion.options) || getChoices(editingQuestion.options).length}
                          onChange={(e) => {
                            const max = parseInt(e.target.value) || getChoices(editingQuestion.options).length;
                            const currentChoices = getChoices(editingQuestion.options);
                            setEditingQuestion({
                              ...editingQuestion,
                              options: {
                                choices: currentChoices,
                                multiple: true,
                                maxSelections: Math.min(max, currentChoices.length)
                              }
                            });
                          }}
                          placeholder="Numero massimo"
                          className="border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                        />
                        <p className="text-xs text-gray-500">
                          Massimo {getChoices(editingQuestion.options).length} selezioni possibili
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingQuestion.type === QuestionType.DATE && (
                <div className="space-y-2">
                  <Label className="text-[#868789] font-medium">Opzioni Data</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="date-range"
                      checked={editingQuestion.dateOptions?.isRange || false}
                      onCheckedChange={(checked) => setEditingQuestion({
                        ...editingQuestion,
                        dateOptions: {
                          ...(editingQuestion.dateOptions || { isRange: false }),
                          isRange: checked
                        }
                      })}
                      className="data-[state=checked]:bg-[#FFCD00]"
                    />
                    <Label htmlFor="date-range" className="text-[#868789] font-medium">Intervallo di date</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditingQuestion(null);
                setIsAdding(false);
              }}
              className="bg-white hover:bg-gray-100 border-gray-200 text-[#868789]"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSaveQuestion}
              className="bg-[#FFCD00] hover:bg-[#FFCD00]/90 text-black"
            >
              {isAdding ? "Aggiungi" : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#FFCD00] hover:text-black border-[#FFCD00] text-[#868789] transition-colors duration-300"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Domanda
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white border border-gray-100">
          <DropdownMenuItem 
            onClick={() => handleAddQuestion(QuestionType.TEXT)}
            className="hover:bg-[#FFCD00]/10 focus:bg-[#FFCD00]/10 cursor-pointer"
          >
            <FormInput className="w-4 h-4 mr-2 text-[#FFCD00]" />
            Testo
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddQuestion(QuestionType.MULTIPLE_CHOICE)}
            className="hover:bg-[#FFCD00]/10 focus:bg-[#FFCD00]/10 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 mr-2 text-[#FFCD00]" />
            Scelta Multipla
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddQuestion(QuestionType.RATING)}
            className="hover:bg-[#FFCD00]/10 focus:bg-[#FFCD00]/10 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 mr-2 text-[#FFCD00]" />
            Valutazione
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddQuestion(QuestionType.DATE)}
            className="hover:bg-[#FFCD00]/10 focus:bg-[#FFCD00]/10 cursor-pointer"
          >
            <Layout className="w-4 h-4 mr-2 text-[#FFCD00]" />
            Data
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleAddQuestion(QuestionType.LIKERT)}
            className="hover:bg-[#FFCD00]/10 focus:bg-[#FFCD00]/10 cursor-pointer"
          >
            <File className="w-4 h-4 mr-2 text-[#FFCD00]" />
            Scala Likert
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DndContext>
  );
} 