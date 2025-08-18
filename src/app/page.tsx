import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Strazza Corp</h1>
        <p className="text-lg mb-8">Multi-tenant booking and client management platform</p>
        
        <div className="space-y-4">
          <div>
            <a
              href="https://calendly.com/strazza-corp/book-a-call"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Book a Call
            </a>
          </div>
          
          <div className="text-sm space-x-4">
            <Link 
              href="/admin/dashboard"
              className="text-muted-foreground hover:text-foreground underline"
            >
              Admin Portal
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="/sign-in"
              className="text-muted-foreground hover:text-foreground underline"
            >
              Firm Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}