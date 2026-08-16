"use server";

import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AllocationManagement } from "@/components/hostels/AllocationManagement";
import { getAllocationsAction } from "./allocation-actions";

export default async function AllocationsPage() {
  const { role } = await getUserRoleAndProfile();
  const effectiveRole = role || "admin";
  const isStudentView = effectiveRole === "student";
  const canManage = hasPermissionInRole(effectiveRole, "allocations:manage");

  const res = await getAllocationsAction("all");
  const allocations = res.success && res.data ? res.data : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <AllocationManagement
          initialAllocations={allocations}
          canManage={canManage}
          isStudentView={isStudentView}
        />
      </main>
      <Footer />
    </div>
  );
}
