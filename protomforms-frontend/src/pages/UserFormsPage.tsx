import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Clock, CheckCircle, Users } from 'lucide-react';

const UserFormsPage: React.FC = () => {
  // Solo dati reali - nessun mock
  const availableForms: any[] = [];
  const completedForms: any[] = [];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Forms</h1>
        <p className="text-gray-600">Complete surveys and questionnaires</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Forms */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Forms</h2>
          <div className="space-y-4">
            {availableForms.length > 0 ? (
              availableForms.map((form) => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <CardDescription>{form.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Form Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{form.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{form.questions} questions</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold">
                        Start Survey
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms available</h3>
                  <p className="text-gray-600">Check back later for new surveys and questionnaires.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Completed Forms */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Forms</h2>
          <div className="space-y-4">
            {completedForms.length > 0 ? (
              completedForms.map((form) => (
                <Card key={form.id} className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                          {form.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{form.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Completed on {new Date(form.completedAt).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        View Response
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed forms</h3>
                  <p className="text-gray-600">Your completed surveys will appear here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-[#FFCD00] mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{availableForms.length}</p>
              <p className="text-sm text-gray-600">Available Forms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{completedForms.length}</p>
              <p className="text-sm text-gray-600">Completed Forms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {((completedForms.length / (availableForms.length + completedForms.length)) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserFormsPage;


