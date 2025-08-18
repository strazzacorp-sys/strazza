"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface RegenerateTokenButtonProps {
  firmId: string;
  firmName: string;
  onTokenGenerated?: (token: string) => void;
}

export function RegenerateTokenButton({ 
  firmId, 
  firmName, 
  onTokenGenerated 
}: RegenerateTokenButtonProps) {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const forceGenerateToken = useMutation(api.tokens.forceGenerateOnboardingToken);

  const handleForceGenerate = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    setIsGenerating(true);
    
    try {
      const result = await forceGenerateToken({
        firmId: firmId as any,
        generatedByEmail: user.primaryEmailAddress.emailAddress,
      });
      
      const baseUrl = window.location.origin;
      const onboardingLink = `${baseUrl}/firm-signup?token=${result.token}`;
      onTokenGenerated?.(onboardingLink);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(onboardingLink);
      alert(`New token generated and copied to clipboard!\n\n${onboardingLink}`);
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate token');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleForceGenerate}
      disabled={isGenerating}
      size="sm"
      variant="destructive"
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Force New Token"}
    </Button>
  );
}