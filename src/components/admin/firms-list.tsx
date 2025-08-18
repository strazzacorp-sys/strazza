"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function FirmsList() {
  const { user } = useUser();
  const firms = useQuery(api.firms.getAllFirms);
  const activeTokens = useQuery(api.tokens.getAllActiveTokens);
  const generateToken = useMutation(api.tokens.generateOnboardingToken);
  
  const [loadingTokens, setLoadingTokens] = useState<Record<string, boolean>>({});
  const [generatedTokens, setGeneratedTokens] = useState<Record<string, string>>({});
  const [copiedTokens, setCopiedTokens] = useState<Record<string, boolean>>({});

  // Helper to get active token for a firm
  const getActiveFirmToken = (firmId: string) => {
    if (!activeTokens) return null;
    return activeTokens.find(token => 
      token.firmId === firmId && 
      token.expiresAt > Date.now()
    );
  };

  // Helper to get expired token for a firm
  const getExpiredFirmToken = (firmId: string) => {
    if (!activeTokens) return null;
    return activeTokens.find(token => 
      token.firmId === firmId && 
      token.expiresAt <= Date.now()
    );
  };

  const handleGenerateToken = async (firmId: string) => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    setLoadingTokens(prev => ({ ...prev, [firmId]: true }));
    
    try {
      const result = await generateToken({
        firmId: firmId as any,
        generatedByEmail: user.primaryEmailAddress.emailAddress,
      });
      
      const baseUrl = window.location.origin;
      const onboardingLink = `${baseUrl}/firm-signup?token=${result.token}`;
      setGeneratedTokens(prev => ({ ...prev, [firmId]: onboardingLink }));
    } catch (error) {
      console.error('Failed to generate token:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate token');
    } finally {
      setLoadingTokens(prev => ({ ...prev, [firmId]: false }));
    }
  };

  const copyToClipboard = async (firmId: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedTokens(prev => ({ ...prev, [firmId]: true }));
      setTimeout(() => {
        setCopiedTokens(prev => ({ ...prev, [firmId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (firms === undefined) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">All Firms</h2>
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
      <h2 className="text-xl font-semibold mb-4">All Firms ({firms.length})</h2>
      
      {firms.length === 0 ? (
        <p className="text-muted-foreground">No firms created yet.</p>
      ) : (
        <div className="space-y-4">
          {firms.map((firm) => (
            <div key={firm._id} className="p-4 border rounded-lg bg-background">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{firm.name}</h3>
                  <p className="text-sm text-muted-foreground">{firm.email}</p>
                  {firm.contactPerson && (
                    <p className="text-sm text-muted-foreground">Contact: {firm.contactPerson}</p>
                  )}
                  {firm.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {firm.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    firm.hasCompletedOnboarding 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {firm.hasCompletedOnboarding ? 'Active' : 'Pending'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(firm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Token Generation Section */}
              <div className="border-t pt-3">
                {!firm.hasCompletedOnboarding && (
                  <div className="space-y-2">
                    {(() => {
                      const activeToken = getActiveFirmToken(firm._id);
                      const expiredToken = getExpiredFirmToken(firm._id);
                      
                      if (activeToken) {
                        // Show existing active token
                        const timeLeft = activeToken.expiresAt - Date.now();
                        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                        const onboardingLink = `${baseUrl}/firm-signup?token=${activeToken.token}`;
                        
                        return (
                          <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                            <p className="text-sm font-medium text-green-800 mb-2">
                              Active Token (expires in {hours}h {minutes}m)
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                                {onboardingLink}
                              </code>
                              <Button
                                onClick={() => copyToClipboard(firm._id, onboardingLink)}
                                size="sm"
                                variant="ghost"
                                className="shrink-0"
                              >
                                {copiedTokens[firm._id] ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      } else {
                        // Show generate button
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleGenerateToken(firm._id)}
                                disabled={loadingTokens[firm._id]}
                                size="sm"
                                variant="outline"
                              >
                                {loadingTokens[firm._id] ? "Generating..." : "Generate Onboarding Link"}
                              </Button>
                            </div>
                            
                            {expiredToken && (
                              <p className="text-xs text-yellow-600">
                                Previous token expired. Generate a new one.
                              </p>
                            )}
                            
                            {generatedTokens[firm._id] && (
                              <div className="bg-muted p-3 rounded-md">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Onboarding Link (expires in 24 hours):
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                                    {generatedTokens[firm._id]}
                                  </code>
                                  <Button
                                    onClick={() => copyToClipboard(firm._id, generatedTokens[firm._id])}
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0"
                                  >
                                    {copiedTokens[firm._id] ? (
                                      <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                
                {firm.hasCompletedOnboarding && (
                  <p className="text-sm text-green-600">✓ Firm has completed onboarding</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}