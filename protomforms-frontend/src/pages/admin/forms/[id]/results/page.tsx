import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// notFound removed;
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Question } from '@prisma/client';

interface ResultsPageProps {
  params: {
    id: string;
  };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    navigate('/api/auth/signin');
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    navigate('/');
  }

  // Fetch the form first to check if it's anonymous
  const form = await prisma.form.findUnique({
    where: {
      id: params.id,
    },
    include: {
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  // Check if form exists
  if (!form) {
    // notFound() removed;
  }

  // Fetch responses separately based on anonymity
  const responses = await prisma.response.findMany({
    where: {
      formId: params.id,
    },
    include: {
      user: form.isAnonymous ? false : true,
      answers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Check if form exists
  if (!form) {
    // notFound() removed;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{form.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {responses.length} responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link to={`/admin/forms/${form.id}/edit`}>
            <Button variant="outline">Edit Form</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="responses">Individual Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {form.questions.map((question: Question) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{question.text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400">
                      Chart placeholder for {question.type} question
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="responses">
          {responses.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Responses Yet</CardTitle>
                <CardDescription>
                  This form hasn't received any responses yet.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-6">
              {responses.map((response: any) => (
                <Card key={response.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Response from {form.isAnonymous ? 'Anonymous' : (response.user?.name || 'Anonymous')}
                    </CardTitle>
                    <CardDescription>
                      Submitted on {new Date(response.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {form.questions.map((question: Question) => {
                        const answer = response.answers.find(
                          (a: any) => a.questionId === question.id
                        );
                        return (
                          <div key={question.id} className="border-b pb-4 last:border-0">
                            <h3 className="font-medium mb-1">{question.text}</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                              {answer
                                ? JSON.stringify(answer.value)
                                : 'No answer provided'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 