import React from 'react';
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Send, Eye, EyeOff, Smartphone, Monitor, Tablet } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Tipi per le domande
type QuestionType = "MULTIPLE_CHOICE" | "TEXT" | "RATING" | "DATE" | "RANKING" | "LIKERT" | "FILE_UPLOAD" | "NPS" | "BRANCHING" | "CHECKBOX";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: any; // Can be string[], or object with choices, scale, labels, etc.
  order: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  questions: Question[];
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

export default function PreviewFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showAnswers, setShowAnswers] = useState(false);

  // Carica i dati del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        const data = await response.json();
        setForm(data);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [params.id]);

  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/forms/${params.id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: form.id,
          answers: Object.entries(responses).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast.success("Form submitted successfully");
      navigate(`/admin/forms/${params.id}/responses`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  // Gestisce il cambio di risposta
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Renderizza il componente appropriato per il tipo di domanda
  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        // Handle both old format (string[]) and new format ({choices: string[], multiple?: boolean})
        const choices = Array.isArray(question.options) 
          ? question.options 
          : question.options?.choices || [];
        const isMultiple = question.options?.multiple || false;
        
        if (isMultiple) {
          return (
            <div className="space-y-2">
              {choices.map((choice: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${index}`}
                    checked={(responses[question.id] || []).includes(choice)}
                    onCheckedChange={(checked) => {
                      const currentValues = responses[question.id] || [];
                      if (checked) {
                        handleResponseChange(question.id, [...currentValues, choice]);
                      } else {
                        handleResponseChange(
                          question.id,
                          currentValues.filter((v: string) => v !== choice)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`${question.id}-${index}`}>{choice}</Label>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => handleResponseChange(question.id, value)}
              className="space-y-2"
            >
              {choices.map((choice: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={choice} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`}>{choice}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        }
      case "LIKERT":
        const scale = question.options?.scale || 5;
        const labels = question.options?.labels || [];
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: scale }, (_, index) => (
                <div key={index} className="text-center">
                  <RadioGroup
                    value={responses[question.id] || ""}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="flex flex-col items-center space-y-2"
                  >
                    <RadioGroupItem 
                      value={labels[index] || (index + 1).toString()} 
                      id={`${question.id}-${index}`} 
                    />
                    <Label 
                      htmlFor={`${question.id}-${index}`} 
                      className="text-xs text-center"
                    >
                      {labels[index] || (index + 1)}
                    </Label>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
        );
      case "TEXT":
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="form-input"
          />
        );
      case "RATING":
        return (
          <div className="space-y-4">
            <Slider
              value={[responses[question.id] || 0]}
              onValueChange={(value) => handleResponseChange(question.id, value[0])}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        );
      case "CHECKBOX":
        const checkboxOptions = Array.isArray(question.options) 
          ? question.options 
          : question.options?.choices || [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(responses[question.id] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || [];
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option]);
                    } else {
                      handleResponseChange(
                        question.id,
                        currentValues.filter((v: string) => v !== option)
                      );
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-blue-700 text-lg">Loading form preview...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-red-600 text-lg">Form not found</p>
        </div>
      </div>
    );
  }

  // Applica il tema del form
  const formStyle = {
    "--primary-color": form.theme?.primaryColor || "#3B82F6",
    "--background-color": form.theme?.backgroundColor || "#FFFFFF",
    "--font-family": form.theme?.fontFamily || "Inter",
  } as React.CSSProperties;

  return (
    <div className="form-page min-h-screen bg-gray-50" style={formStyle}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/admin/forms/${params.id}`}>
              <Button variant="ghost" className="form-button-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Form
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-blue-900">Form Preview</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              size="icon"
              onClick={() => setPreviewMode("desktop")}
              className="h-9 w-9"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === "tablet" ? "default" : "outline"}
              size="icon"
              onClick={() => setPreviewMode("tablet")}
              className="h-9 w-9"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              size="icon"
              onClick={() => setPreviewMode("mobile")}
              className="h-9 w-9"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAnswers(!showAnswers)}
              className="h-9 w-9"
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className={`mx-auto transition-all duration-300 ${
          previewMode === "desktop" ? "max-w-4xl" :
          previewMode === "tablet" ? "max-w-2xl" :
          "max-w-md"
        }`}>
          <Card className="form-card shadow-lg animate-slide-in" style={{
            backgroundColor: form.theme?.backgroundColor || "#FFFFFF",
            fontFamily: form.theme?.fontFamily || "Inter",
          }}>
            <CardHeader className="form-card-header border-b">
              <CardTitle className="text-2xl font-bold" style={{ color: form.theme?.primaryColor || "#3B82F6" }}>
                {form.title}
              </CardTitle>
              {form.description && (
                <CardDescription className="text-base mt-2">
                  {form.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="space-y-4 p-4 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <Label className="text-lg font-medium">
                        {index + 1}. {question.text}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {showAnswers && (
                        <div className="text-sm text-gray-500">
                          {responses[question.id] ? (
                            <span className="text-green-600">Answered</span>
                          ) : (
                            <span className="text-gray-400">Not answered</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      {renderQuestionInput(question)}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="form-button-primary"
                    style={{
                      backgroundColor: form.theme?.primaryColor || "#3B82F6",
                    }}
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Form
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 