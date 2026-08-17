import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAuditLogsAction } from "@/app/admin/audit-actions";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";

export const metadata = {
  title: "Application Audit Logs | Hostel Manager",
  description: "Administrative audit trail of security and system events.",
};

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AuditLogsPage() {
  const { user, role } = await getUserRoleAndProfile();
  const isStudentOrWarden = user && ["student", "warden"].includes((role || "").toLowerCase());

  if (isStudentOrWarden) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 py-16 px-4 max-w-xl mx-auto text-center flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-slate-400 text-sm mb-6">
            Audit logs and user role assignment controls are restricted exclusively to System Administrators.
          </p>
          <Link href="/hostels">
            <Button variant="outline">Return to Hostel Dashboard</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const res = await getAuditLogsAction();
  const initialLogs = res.success && res.data ? res.data : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <AuditLogsViewer initialLogs={initialLogs} />
      </main>
      <Footer />
    </div>
  );
}
