import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Edit, Share, BarChart3, Users, Calendar, FileText } from 'lucide-react';

const FormDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Solo dati reali - nessun mock
  const form: any = null;

  if (!form) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Form non trovato</h3>
            <p className="text-gray-600">Il form richiesto non esiste o non è disponibile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forms
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{form.title}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </div>
                <>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </>
              </div>
            </CardHeader>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions ({form.questions.length})</CardTitle>
              <CardDescription>Form structure and questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-[#FFCD00] text-black text-sm font-medium rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-medium">{question.text}</span>
                      </div>
                      {question.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="ml-8">
                      <span className="text-sm text-gray-600 capitalize">
                        {question.type.replace('_', ' ')}
                      </span>
                      {question.options && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Options:</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside">
                            {question.options.map((option, idx) => (
                              <li key={idx}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Responses</span>
                </div>
                <span className="font-semibold">{form.responses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <span className="font-semibold">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Status</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  form.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {form.status === 'active' ? 'Active' : 'Draft'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                View Responses
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="w-4 h-4 mr-2" />
                Share Form
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FormDetailPage;


