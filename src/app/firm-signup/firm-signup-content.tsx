"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordSetupForm } from "@/components/firm/password-setup-form";
import Link from "next/link";

export default function FirmSignupContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [validationChecked, setValidationChecked] = useState(false);
  
  // Validate the token
  const tokenValidation = useQuery(
    api.tokens.validateToken,
    token ? { token } : "skip"
  );

  useEffect(() => {
    if (tokenValidation !== undefined) {
      setValidationChecked(true);
    }
  }, [tokenValidation]);

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Access</CardTitle>
            <CardDescription>
              No token provided. You need a valid onboarding link to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading validation
  if (!validationChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Validating token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Token</CardTitle>
            <CardDescription>
              {tokenValidation?.error || "This token is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the administrator for a new onboarding link.
            </p>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show firm signup form
  const { firm } = tokenValidation;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to Strazza Corp</CardTitle>
          <CardDescription>
            Complete your firm's onboarding process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordSetupForm
            token={token}
            firmEmail={firm?.email ?? ""}
            firmName={firm?.name ?? ""}
          />
          
          <div className="pt-6 mt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact support at{" "}
              <a href="mailto:support@strazzacorp.com" className="underline">
                support@strazzacorp.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}