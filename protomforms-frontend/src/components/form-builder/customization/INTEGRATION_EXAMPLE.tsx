/**
 * Integration Example for FormCustomizationV2
 *
 * This file demonstrates how to integrate the new customization system
 * into an existing form builder page.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormCustomizationV2 } from './FormCustomizationV2';
import { ThemeV2 } from '../../../types/theme';
import { toast } from 'sonner';

/**
 * Example 1: Basic Integration
 * Replace existing FormCustomization with FormCustomizationV2
 */
export function FormBuilderWithCustomizationV2() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing form with theme
  useEffect(() => {
    async function loadForm() {
      try {
        const response = await fetch(`/api/forms/${id}`);
        const data = await response.json();
        setForm(data);

        // Parse existing theme (could be old format)
        if (data.theme) {
          setTheme(typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme);
        }
      } catch (error) {
        console.error('Failed to load form:', error);
        toast.error('Failed to load form');
      }
    }

    if (id) {
      loadForm();
    }
  }, [id]);

  // Handle theme changes (auto-save or debounced)
  const handleThemeChange = (newTheme: Partial<ThemeV2>) => {
    setTheme(newTheme);
    // Optionally auto-save here
  };

  // Handle explicit save
  const handleSave = async (finalTheme: Partial<ThemeV2>) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: finalTheme,
        }),
      });

      if (response.ok) {
        toast.success('Theme saved successfully!');
        setTheme(finalTheme);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  if (!form) {
    return <div>Loading...</div>;
  }

  return (
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={handleThemeChange}
      onSave={handleSave}
    />
  );
}

/**
 * Example 2: With Custom Preview Content
 * Show actual form questions in the preview
 */
export function FormBuilderWithCustomPreview() {
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});
  const [questions, setQuestions] = useState([
    {
      id: '1',
      text: 'How would you rate our service?',
      type: 'MULTIPLE_CHOICE',
      options: ['Excellent', 'Good', 'Fair', 'Poor'],
    },
    {
      id: '2',
      text: 'What can we improve?',
      type: 'TEXT',
    },
  ]);

  return (
    <FormCustomizationV2
      initialTheme={theme}
      onThemeChange={setTheme}
      previewContent={
        <FormPreviewRenderer
          questions={questions}
          theme={theme}
        />
      }
    />
  );
}

/**
 * Custom Preview Renderer Component
 */
interface FormPreviewRendererProps {
  questions: any[];
  theme: Partial<ThemeV2>;
}

function FormPreviewRenderer({ questions, theme }: FormPreviewRendererProps) {
  return (
    <div
      className="min-h-screen p-8"
      style={{
        fontFamily: theme.fontFamily || 'Inter, system-ui, sans-serif',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: theme.questionBackgroundColor || '#f9fafb',
              borderColor: theme.questionBorderColor || '#e5e7eb',
              borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
              padding: theme.cardPadding ? `${theme.cardPadding}px` : '24px',
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                style={{
                  backgroundColor: theme.primaryColor || '#3b82f6',
                  color: '#ffffff',
                }}
              >
                {index + 1}
              </div>
              <h3
                style={{
                  color: theme.questionTextColor || theme.textColor,
                  fontSize: theme.questionFontSize ? `${theme.questionFontSize}px` : '18px',
                  fontWeight: theme.questionFontWeight === 'bold' ? 700 : 600,
                }}
              >
                {question.text}
              </h3>
            </div>

            {question.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {question.options.map((option: string) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer"
                    style={{
                      borderColor: theme.optionBorderColor || '#d1d5db',
                      borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
                      fontSize: theme.optionFontSize ? `${theme.optionFontSize}px` : '16px',
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      style={{ accentColor: theme.primaryColor }}
                    />
                    <span style={{ color: theme.optionTextColor || theme.textColor }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'TEXT' && (
              <textarea
                placeholder="Type your response here..."
                rows={4}
                className="w-full p-4 rounded-lg border resize-none"
                style={{
                  borderColor: theme.optionBorderColor || '#d1d5db',
                  borderRadius: theme.borderRadius ? `${theme.borderRadius}px` : '8px',
                  fontSize: theme.optionFontSize ? `${theme.optionFontSize}px` : '16px',
                  fontFamily: theme.fontFamily,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 3: Standalone Customization Page
 * Use as a separate route for theme editing
 */
export function ThemeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});

  const handleSave = async (finalTheme: Partial<ThemeV2>) => {
    // Save to API
    await fetch(`/api/forms/${id}/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: finalTheme }),
    });

    toast.success('Theme saved!');
    navigate(`/forms/${id}`);
  };

  return (
    <div className="h-screen">
      <FormCustomizationV2
        initialTheme={theme}
        onThemeChange={setTheme}
        onSave={handleSave}
      />
    </div>
  );
}

/**
 * Example 4: Embedding in Tab System
 * Use within existing form builder tabs
 */
export function FormBuilderTabs() {
  const [activeTab, setActiveTab] = useState('questions');
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});
  const [questions, setQuestions] = useState([]);

  return (
    <div className="h-screen flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 ${activeTab === 'questions' ? 'border-b-2 border-blue-600' : ''}`}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab('customize')}
          className={`px-6 py-3 ${activeTab === 'customize' ? 'border-b-2 border-blue-600' : ''}`}
        >
          Customize
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 ${activeTab === 'settings' ? 'border-b-2 border-blue-600' : ''}`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'questions' && (
          <div className="p-8">
            {/* Existing question builder */}
          </div>
        )}

        {activeTab === 'customize' && (
          <FormCustomizationV2
            initialTheme={theme}
            onThemeChange={setTheme}
          />
        )}

        {activeTab === 'settings' && (
          <div className="p-8">
            {/* Form settings */}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 5: Modal/Dialog Integration
 * Open customization in a modal
 */
export function FormBuilderWithModal() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [theme, setTheme] = useState<Partial<ThemeV2>>({});

  return (
    <div>
      {/* Main form builder */}
      <div className="p-8">
        <button
          onClick={() => setIsCustomizing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Customize Theme
        </button>

        {/* Your form builder content */}
      </div>

      {/* Fullscreen Modal */}
      {isCustomizing && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Customize Theme</h2>
            <button
              onClick={() => setIsCustomizing(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
          <div className="h-[calc(100vh-64px)]">
            <FormCustomizationV2
              initialTheme={theme}
              onThemeChange={setTheme}
              onSave={(finalTheme) => {
                setTheme(finalTheme);
                setIsCustomizing(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Routes Configuration Example
 */
export const customizationRoutes = [
  {
    path: '/forms/:id/customize',
    element: <FormBuilderWithCustomizationV2 />,
  },
  {
    path: '/forms/:id/theme',
    element: <ThemeEditorPage />,
  },
];

/**
 * API Integration Helpers
 */
export const themeAPI = {
  // Load theme
  async loadTheme(formId: string): Promise<Partial<ThemeV2>> {
    const response = await fetch(`/api/forms/${formId}/theme`);
    const data = await response.json();
    return data.theme;
  },

  // Save theme
  async saveTheme(formId: string, theme: Partial<ThemeV2>): Promise<void> {
    await fetch(`/api/forms/${formId}/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
  },

  // Load presets (if server-side presets exist)
  async loadPresets(): Promise<any[]> {
    const response = await fetch('/api/themes/presets');
    return response.json();
  },
};
