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
