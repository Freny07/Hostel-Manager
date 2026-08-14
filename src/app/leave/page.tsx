import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getLeaveRequestsAction } from "@/app/leave/leave-actions";
import { StudentLeaveList } from "@/components/leave/StudentLeaveList";
import { WardenLeaveManagement } from "@/components/leave/WardenLeaveManagement";

export const metadata = {
  title: "Student Leave Management | HostelOS",
  description: "Submit and manage student leave applications with warden approval workflows.",
};

export default async function LeavePage() {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    redirect("/login?next=/leave");
  }

  const res = await getLeaveRequestsAction();
  const initialRequests = res.success && res.data ? res.data : [];

  const isStudent = role === "student";

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {isStudent ? (
          <StudentLeaveList initialRequests={initialRequests} />
        ) : (
          <WardenLeaveManagement initialRequests={initialRequests} />
        )}
      </main>
      <Footer />
    </div>
  );
}
