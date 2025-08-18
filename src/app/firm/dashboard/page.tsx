import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function FirmDashboard() {
  const user = await currentUser();
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  // Get firm email
  const firmEmail = user.primaryEmailAddress?.emailAddress;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Firm Dashboard</h1>
            <p className="text-sm text-muted-foreground">{firmEmail}</p>
          </div>
          <UserButton />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="bg-card p-6 rounded-lg shadow-sm border mb-8">
            <h2 className="text-2xl font-semibold mb-2">Welcome to Your Dashboard!</h2>
            <p className="text-muted-foreground">
              Your firm account has been successfully created. You can now access all the features 
              and manage your clients through this portal.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">Clients</h3>
              <p className="text-muted-foreground mb-4">
                Manage your client accounts and permissions
              </p>
              <div className="text-2xl font-bold text-primary">0</div>
              <p className="text-sm text-muted-foreground">Total clients</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
              <p className="text-muted-foreground mb-4">
                Update your firm information and preferences
              </p>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 text-sm">
                Manage Settings
              </button>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-2">Support</h3>
              <p className="text-muted-foreground mb-4">
                Get help or contact our support team
              </p>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 text-sm">
                Contact Support
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Account created successfully</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No additional activity yet.</p>
                <p className="text-xs">Start by exploring the features above.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}