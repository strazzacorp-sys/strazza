"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const ADMIN_EMAIL = "harrisonyenwe@gmail.com";

export default function AuthRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checkingFirm, setCheckingFirm] = useState(false);

  // Query to check if user email exists in firms table
  const firm = useQuery(
    api.firms.getFirmByEmail,
    user?.primaryEmailAddress?.emailAddress 
      ? { email: user.primaryEmailAddress.emailAddress }
      : "skip"
  );

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      
      if (!userEmail) {
        router.replace("/access-denied");
        return;
      }

      if (userEmail === ADMIN_EMAIL) {
        // Admin user, redirect to admin dashboard
        router.replace("/admin/dashboard");
        return;
      }

      // For non-admin users, check if they're a firm
      if (firm !== undefined) {
        if (firm) {
          // User is a valid firm, redirect to firm dashboard
          router.replace("/firm/dashboard");
        } else {
          // User is not a firm, redirect to access denied
          router.replace("/access-denied");
        }
      }
    } else if (isLoaded && !user) {
      // Not authenticated, redirect to sign-in
      router.replace("/sign-in");
    }
  }, [user, isLoaded, router, firm]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}