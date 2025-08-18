# this is the core .md file of the project

<idea>
Part 1: The Public Landing Page
Imagine someone lands on the site. They should see a simple page with a clear call to action: "Book a Call." This button should link directly to my Calendly at https://calendly.com/strazza-corp/book-a-call.

Part 2: The Admin's Journey
I need an admin portal where I can log in(make it so only harrisonyenwe@gmail.com can signup/log in). Once inside, I should be able to do two things:

Add a new firm: I'll input their name, email, etc. When I save, the system needs to give me a special, single-use token for that specific firm. This token is crucial for their first time logging in.

Add a client: For each firm, I need to be able to create client accounts. I'll just need to provide a username and password for each one.

Part 3: The Firm's First Login
A new firm receives their token from me. When they visit the site's login page, they'll see an option for first-time login where they enter their token. After the token is validated, they'll be asked to create their own secure password.

Part 4: The Firm's Regular Login
Once a firm has set their password, they'll always log in with their email and the password they created and be redirected to dashboard
</idea>

## Tech stack

Frontend
Next.js (app router) + tailwind css + shadcn/ui

Backend
Next.js api routes + convex for database + clerk for authentification

## Keys/Urls

CONVEX_DEPLOYMENT=dev:tidy-firefly-660 # team: strazzacorp-sys, project: strazza

NEXT_PUBLIC_CONVEX_URL=https://tidy-firefly-660.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cHJlY2lzZS1iaXJkLTIuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_aeMd0YIfVU6yjWlkh4JB5ONBTFPe09bZpqbqOpR9tF
