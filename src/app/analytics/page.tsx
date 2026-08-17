import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { AdminAnalyticsDashboard } from "@/components/analytics/AdminAnalyticsDashboard";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Operational Analytics & Reports | Hostel Manager",
  description: "Operational analytics dashboard for hostel management, bed occupancy, and maintenance issue SLAs.",
};

export default async function AnalyticsPage() {
  const { role } = await getUserRoleAndProfile();
  const isStudent = role === "student";

  if (isStudent) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 py-16 px-4 max-w-xl mx-auto text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-slate-400 text-sm mb-6">
            Occupancy analytics and operational SLA reports are restricted to Wardens and Administration staff.
          </p>
          <Link href="/hostels">
            <Button variant="outline">Return to Hostel Dashboard</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <AdminAnalyticsDashboard />
      </main>
      <Footer />
    </div>
  );
}
