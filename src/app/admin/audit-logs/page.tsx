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

export default async function AuditLogsPage() {
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
