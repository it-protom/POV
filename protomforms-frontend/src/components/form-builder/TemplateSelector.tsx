import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FormTemplate } from '../../lib/form-templates';
import { ClipboardList, FileText, Heart, GraduationCap } from 'lucide-react';

interface TemplateSelectorProps {
  templates: FormTemplate[];
  onSelectTemplate: (template: FormTemplate) => void;
}

const getTemplateIcon = (templateId: string) => {
  switch (templateId) {
    case 'satisfaction':
      return <Heart className="w-6 h-6 text-[#FFCD00]" />;
    case 'digital-transformation':
      return <FileText className="w-6 h-6 text-[#FFCD00]" />;
    case 'wellbeing':
      return <ClipboardList className="w-6 h-6 text-[#FFCD00]" />;
    case 'training':
      return <GraduationCap className="w-6 h-6 text-[#FFCD00]" />;
    default:
      return <FileText className="w-6 h-6 text-[#FFCD00]" />;
  }
};

export function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((template) => (
        <Card 
          key={template.id} 
          className="hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#FFCD00] bg-white"
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-3 bg-[#FFCD00]/10 rounded-lg shadow-sm">
              {getTemplateIcon(template.id)}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-black">{template.title}</CardTitle>
              <CardDescription className="text-[#868789]">{template.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-[#868789] font-medium">
                {template.questions.length} domande
              </p>
              <Button
                variant="outline"
                className="w-full bg-white hover:bg-[#FFCD00] hover:text-black border-[#FFCD00] text-[#868789] transition-colors duration-300"
                onClick={() => onSelectTemplate(template)}
              >
                Usa questo modello
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 