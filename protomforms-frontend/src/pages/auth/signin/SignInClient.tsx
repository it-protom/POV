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
          <CardTitle>Benvenuto su Protom Forms</CardTitle>
          <CardDescription>
            Accedi con il tuo account Protom per continuare
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
              Accedi con Microsoft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
