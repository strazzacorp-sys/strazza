# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant booking and client management platform with three distinct user roles:
- **Public visitors** who can book calls via Calendly integration
- **Admin** (harrisonyenwe@gmail.com only) who manages firms and their clients
- **Firms** who can log in to manage their dashboard and clients

## Tech Stack

**Frontend:**
- Next.js (App Router)
- Tailwind CSS
- shadcn/ui components

**Backend:**
- Next.js API routes
- Convex database
- Clerk authentication

## Environment Configuration

Required environment variables:
```
CONVEX_DEPLOYMENT=dev:tidy-firefly-660
NEXT_PUBLIC_CONVEX_URL=https://tidy-firefly-660.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHJlY2lzZS1iaXJkLTIuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_aeMd0YIfVU6yjWlkh4JB5ONBTFPe09bZpqbqOpR9tF
```

## Architecture Components

### User Flow Architecture
1. **Public Landing Page**: Simple page with Calendly booking link (https://calendly.com/strazza-corp/book-a-call)
2. **Admin Portal**: Restricted to harrisonyenwe@gmail.com for firm and client management
3. **Firm Onboarding**: Token-based first-time login system
4. **Firm Dashboard**: Regular email/password authentication post-onboarding

### Authentication Strategy
- **Admin**: Clerk authentication with email restriction
- **Firms**: 
  - First login: Single-use token validation → password creation
  - Regular login: Email/password via Clerk
- **Clients**: Username/password (managed by firms)

### Data Models (Convex)
Key entities to implement:
- `firms`: Store firm details, email, token status
- `clients`: Username/password pairs per firm
- `tokens`: Single-use tokens for firm onboarding
- `admin_users`: Restricted admin access control

## Development Commands

Since this is a new Next.js project, typical commands will be:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking (if configured)
```

## Key Implementation Notes

- Admin signup/login must be restricted to harrisonyenwe@gmail.com only
- Token system requires single-use validation and cleanup
- Firm password creation must invalidate the original token
- Client management is scoped per firm
- Calendly integration should be a simple redirect/link

## Security Considerations

- Implement proper token expiration and cleanup
- Ensure firm isolation (clients belong only to their firm)
- Admin email restriction must be enforced at API level
- Never expose Clerk secret keys in client-side code