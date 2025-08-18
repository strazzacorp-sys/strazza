"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useSignUp, useSignIn } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof passwordSchema>;

interface PasswordSetupFormProps {
  token: string;
  firmEmail: string;
  firmName: string;
  onSuccess?: () => void;
}

export function PasswordSetupForm({ token, firmEmail, firmName, onSuccess }: PasswordSetupFormProps) {
  const router = useRouter();
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useToken = useMutation(api.tokens.useToken);
  const completeFirmOnboarding = useMutation(api.firms.completeFirmOnboarding);
  
  const form = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const [signupStep, setSignupStep] = useState<'form' | 'verification' | 'complete'>('form');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const onSubmit = async (data: FormData) => {
    if (!signUp) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Clerk user account (this may require verification)
      console.log("Creating Clerk user for:", firmEmail);
      const signUpAttempt = await signUp.create({
        emailAddress: firmEmail,
        password: data.password,
      });

      console.log("Clerk signup result:", signUpAttempt);
      console.log("Status:", signUpAttempt.status);
      console.log("Verification:", signUpAttempt.verifications);

      // Get the user ID from the right property
      let userId = signUpAttempt.createdUserId || signUpAttempt.id;
      
      if (signUpAttempt.status === "complete" && userId) {
        // Account is fully created and verified
        console.log("Signup complete with user ID:", userId);
        await completeOnboarding(userId);
      } else if (signUpAttempt.status === "missing_requirements") {
        // Email verification is required
        console.log("Email verification required");
        console.log("Email verification status:", signUpAttempt.verifications.emailAddress.status);
        
        // Send verification email regardless of current status
        console.log("Preparing email verification...");
        await signUpAttempt.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        
        console.log("Email verification prepared, updating UI");
        // Update UI to show verification step
        setSignupStep('verification');
        setPendingVerification(true);
      } else {
        console.log("Signup not complete, status:", signUpAttempt.status);
        throw new Error(`Account creation incomplete. Status: ${signUpAttempt.status}`);
      }

    } catch (error) {
      console.error("Signup error:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to complete signup. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("email_address_taken") || error.message.includes("identifier_already_exists")) {
          errorMessage = "An account with this email already exists. Please contact support.";
        } else if (error.message.includes("password")) {
          errorMessage = "Password does not meet requirements. Please check the requirements below.";
        } else if (error.message.includes("Token has already been used")) {
          errorMessage = "This onboarding link has already been used. Please contact the administrator for a new link.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeOnboarding = async (userId: string) => {
    try {
      // Step 2: Update firm record in Convex with Clerk user ID
      console.log("Completing firm onboarding with user ID:", userId);
      await completeFirmOnboarding({
        firmEmail,
        clerkUserId: userId,
      });

      // Step 3: Mark token as used (only after successful onboarding)
      console.log("Marking token as used");
      await useToken({
        token,
        usedByEmail: firmEmail,
      });

      // Step 4: Update UI to complete state
      setSignupStep('complete');
    } catch (error) {
      console.error("Onboarding completion error:", error);
      throw error;
    }
  };

  const handleResendVerification = async () => {
    if (!signUp) return;
    
    setIsResending(true);
    setError(null);
    
    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      
      // Show success message briefly
      setError("Verification email sent! Please check your inbox.");
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error("Failed to resend verification:", error);
      setError("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signUp || !verificationCode) return;

    setIsVerifying(true);
    setError(null);

    try {
      // Attempt to verify the email with the code
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      console.log("Verification result:", completeSignUp);

      if (completeSignUp.status === "complete") {
        // Get the user ID
        const userId = completeSignUp.createdUserId;
        if (userId) {
          console.log("Email verified, completing onboarding with user ID:", userId);
          await completeOnboarding(userId);
          // Redirect to firm dashboard
          router.push('/firm');
        } else {
          throw new Error("User ID not found after verification");
        }
      } else {
        throw new Error("Verification not complete");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      let errorMessage = "Invalid verification code. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("expired")) {
          errorMessage = "Verification code has expired. Please request a new one.";
        } else if (error.message.includes("attempts")) {
          errorMessage = "Too many attempts. Please request a new verification code.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Show verification waiting screen
  if (signupStep === 'verification') {
    return (
      <div className="space-y-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">{firmName}</h3>
          <p className="text-sm text-muted-foreground">{firmEmail}</p>
        </div>
        
        {/* Success message */}
        <div className="text-center bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Password Created Successfully!</h3>
          <p className="text-green-700 text-sm">
            Your account has been created with your secure password.
          </p>
        </div>
        
        {/* Verification section */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Verify Your Email</h3>
            <p className="text-blue-700 mb-4">
              We've sent a verification code to <strong>{firmEmail}</strong>. 
              Enter the code below to complete your account setup.
            </p>
          </div>
          
          {error && (
            <div className={`p-3 rounded-md mb-4 text-sm ${
              error.includes("sent!") 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {error}
            </div>
          )}
          
          {/* Verification code input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-blue-900 mb-2">
                Verification Code
              </label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
            
            <div className="text-center">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                variant="ghost"
                size="sm"
                className="gap-2 text-blue-600"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <a href="mailto:support@strazzacorp.com" className="underline text-blue-600">
              contact support
            </a>.
          </p>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (signupStep === 'complete') {
    return (
      <div className="space-y-6">
        <div className="text-center p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-lg">{firmName}</h3>
          <p className="text-sm text-muted-foreground">{firmEmail}</p>
        </div>
        
        <div className="text-center bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Account Created Successfully!</h3>
          <p className="text-green-700 mb-4">
            Your firm account has been set up. You can now sign in to access your dashboard.
          </p>
          <Button 
            onClick={() => router.push('/sign-in')} 
            className="bg-green-600 hover:bg-green-700"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Firm Information Display */}
      <div className="text-center p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-lg">{firmName}</h3>
        <p className="text-sm text-muted-foreground">{firmEmail}</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a secure password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, and a number.
                </p>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full" 
            size="lg"
          >
            {isSubmitting ? "Setting up your account..." : "Complete Setup & Sign In"}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}