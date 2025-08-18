"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Copy, Check, Clock, AlertTriangle } from "lucide-react";
import { RegenerateTokenButton } from "./regenerate-token-button";
import { useState } from "react";

export function ActiveTokensList() {
  const tokens = useQuery(api.tokens.getAllActiveTokens);
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (tokenId: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedTokens(prev => ({ ...prev, [tokenId]: true }));
      setTimeout(() => {
        setCopiedTokens(prev => ({ ...prev, [tokenId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) {
      return "Expired";
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const isExpiringSoon = (expiresAt: number) => {
    const now = Date.now();
    const timeLeft = expiresAt - now;
    const oneHour = 60 * 60 * 1000;
    return timeLeft <= oneHour && timeLeft > 0;
  };

  if (tokens === undefined) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Active Onboarding Tokens</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">
        Active Onboarding Tokens ({tokens.length})
      </h2>
      
      {tokens.length === 0 ? (
        <p className="text-muted-foreground">No active onboarding tokens.</p>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const onboardingLink = `${baseUrl}/firm-signup?token=${token.token}`;
            const timeRemaining = formatTimeRemaining(token.expiresAt);
            const isExpired = token.expiresAt <= Date.now();
            const expiringSoon = isExpiringSoon(token.expiresAt);
            
            return (
              <div 
                key={token._id} 
                className={`p-4 border rounded-lg ${
                  isExpired ? 'bg-red-50 border-red-200' : 
                  expiringSoon ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-background'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{token.firm?.name}</h3>
                    <p className="text-sm text-muted-foreground">{token.firm?.email}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm font-medium ${
                        isExpired ? 'text-red-600' :
                        expiringSoon ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {timeRemaining}
                      </span>
                      {expiringSoon && !isExpired && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(token.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(token.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!isExpired && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Onboarding Link:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                        {onboardingLink}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(token._id, onboardingLink)}
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                      >
                        {copiedTokens[token._id] ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {isExpired && (
                  <div className="bg-red-100 border border-red-200 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-red-700 font-medium">
                        This token has expired and can no longer be used.
                      </p>
                      <RegenerateTokenButton
                        firmId={token.firmId}
                        firmName={token.firm?.name || "Unknown"}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}