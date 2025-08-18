"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function VerificationContent() {
  const { user, isLoaded } = useUser();
  const [completionStatus, setCompletionStatus] = useState<'checking' | 'completing' | 'completed' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  
  const completeFirmOnboarding = useMutation(api.firms.completeFirmOnboarding);
  const useToken = useMutation(api.tokens.useTokenByEmail);

  useEffect(() => {
    if (isLoaded && user) {
      completeOnboardingProcess();
    }
  }, [isLoaded, user]);

  const completeOnboardingProcess = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    setCompletionStatus('completing');
    
    try {
      // Complete firm onboarding
      await completeFirmOnboarding({
        firmEmail: user.primaryEmailAddress.emailAddress,
        clerkUserId: user.id,
      });

      // Mark any tokens for this email as used
      await useToken({
        firmEmail: user.primaryEmailAddress.emailAddress,
      });

      setCompletionStatus('completed');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
      setCompletionStatus('error');
    }
  };

  if (!isLoaded || completionStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completionStatus === 'completing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Completing your account setup...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completionStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Setup Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || "Failed to complete account setup"}
            </p>
            <div className="space-y-2">
              <Link href="/sign-in">
                <Button className="w-full">Try Signing In</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                If issues persist, contact support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Strazza Corp!</h2>
          <p className="text-muted-foreground mb-6">
            Your account has been verified and set up successfully. 
            You can now access your firm dashboard.
          </p>
          <Link href="/firm/dashboard">
            <Button className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}