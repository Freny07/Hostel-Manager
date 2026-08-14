import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { AdminAnalyticsDashboard } from "@/components/analytics/AdminAnalyticsDashboard";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Admin Analytics | HostelOS",
  description: "Operational analytics dashboard for hostel management, bed occupancy, and maintenance issue SLAs.",
};

export default async function AnalyticsPage() {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    redirect("/login");
  }

  if (role !== "admin") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <Card className="glass-card border-rose-500/30 bg-rose-950/10 p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-xs text-rose-300 mb-6">
            Admin privileges are required to view the operational analytics dashboard.
          </p>
          <Link href="/issues">
            <Button variant="outline" className="border-rose-500/40 text-rose-200">
              Return to Issues Page
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AdminAnalyticsDashboard />
      </div>
    </main>
  );
}
