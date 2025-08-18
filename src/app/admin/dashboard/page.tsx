import { UserButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/auth";
import { CreateFirmForm } from "@/components/admin/create-firm-form";
import { FirmsList } from "@/components/admin/firms-list";
import { ActiveTokensList } from "@/components/admin/active-tokens-list";

export default async function AdminDashboard() {
  // Ensure only admin can access
  await requireAdmin();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <UserButton />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Firm Form */}
          <div>
            <CreateFirmForm />
          </div>
          
          {/* Firms List */}
          <div>
            <FirmsList />
          </div>
        </div>
        
        {/* Active Tokens Section */}
        <div className="mt-8">
          <ActiveTokensList />
        </div>
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Manage Clients</h2>
            <p className="text-muted-foreground mb-4">
              Create client accounts for firms
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
              Add New Client
            </button>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">System Overview</h2>
            <p className="text-muted-foreground mb-4">
              View system statistics and audit logs
            </p>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90">
              View Reports
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}