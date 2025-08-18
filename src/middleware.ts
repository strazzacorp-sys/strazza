import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isFirmRoute = createRouteMatcher(['/firm(.*)']);
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isDebugRoute = createRouteMatcher(['/debug-auth(.*)']);
const isAuthRedirectRoute = createRouteMatcher(['/auth-redirect(.*)']);
const isFirmSignupRoute = createRouteMatcher(['/firm-signup(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  
  // Allow debug route, auth redirect, and firm signup without restrictions
  if (isDebugRoute(req) || isAuthRedirectRoute(req) || isFirmSignupRoute(req)) {
    return NextResponse.next();
  }

  // If accessing admin routes
  if (isAdminRoute(req)) {
    // Redirect to sign-in if not authenticated
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Let the page-level auth handle email verification
    // This allows us to use currentUser() properly in server components
  }

  // If accessing firm routes
  if (isFirmRoute(req)) {
    // Redirect to sign-in if not authenticated
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Let the page handle firm-specific authentication
  }

  // If user is authenticated and accessing auth pages, redirect to auth handler
  if (isAuthRoute(req) && userId) {
    const authRedirectUrl = new URL('/auth-redirect', req.url);
    return NextResponse.redirect(authRedirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};