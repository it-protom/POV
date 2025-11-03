import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// next-auth removed - needs custom auth;
import { Icons } from "@/components/icons";
import { getBaseUrl } from "@/lib/utils";

export default function SignInClient() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Protom Forms</CardTitle>
          <CardDescription>
            Sign in with your Protom account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn("azure-ad", { callbackUrl: `${getBaseUrl()}/` })}
            >
              <Icons.microsoft className="mr-2 h-4 w-4" />
              Sign in with Microsoft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
