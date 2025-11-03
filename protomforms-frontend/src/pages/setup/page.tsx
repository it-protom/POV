import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/setup-admin-and-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup admin and form');
      }
      
      setResult(data);
      toast.success('Setup completed successfully!');
    } catch (error) {
      console.error('Error during setup:', error);
      toast.error('Failed to setup admin and form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Setup Admin and Example Form</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>
            This page will create an admin user and an example form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Click the button below to create an admin user with the following credentials:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Email: admin@protom.com</li>
            <li>Password: Password123!</li>
          </ul>
          <p className="mb-4">
            It will also create an example form for the admin user.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSetup} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Setup Admin and Form'}
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Setup Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 