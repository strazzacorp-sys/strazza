import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Admin Registration</h1>
          <p className="text-muted-foreground">
            Registration restricted to harrisonyenwe@gmail.com only
          </p>
        </div>
        <SignUp 
          redirectUrl="/auth-redirect"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    </div>
  );
}