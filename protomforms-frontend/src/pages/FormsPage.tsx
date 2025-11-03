import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileText, Users, Calendar, MoreVertical } from 'lucide-react';

const FormsPage: React.FC = () => {
  // Solo dati reali - nessun mock
  const forms: any[] = [];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forms</h1>
          <p className="text-gray-600">Manage your forms and surveys</p>
        </div>
        <Button className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Create New Form
        </Button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length > 0 ? forms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{form.title}</CardTitle>
                  <CardDescription className="text-sm">{form.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    form.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{form.responses} responses</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Link to={`/admin/forms/${form.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="col-span-full text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun form disponibile</h3>
              <p className="text-gray-600">Non ci sono form disponibili al momento.</p>
            </CardContent>
          </Card>
        )}

        {/* Create New Form Card */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-[#FFCD00] transition-colors duration-300 cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-12 h-12 bg-[#FFCD00]/10 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[#FFCD00]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Form</h3>
            <p className="text-sm text-gray-600 mb-4">Start building your next survey or questionnaire</p>
            <Button className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-semibold">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormsPage;


