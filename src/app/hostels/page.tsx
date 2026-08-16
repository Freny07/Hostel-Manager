"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HostelManagement } from "@/components/hostels/HostelManagement";
import type { HostelWithCounts } from "@/components/hostels/HostelCard";

export default async function HostelsPage() {
  const { user, role } = await getUserRoleAndProfile();

  const effectiveRole = role || "admin";
  const canManage = hasPermissionInRole(effectiveRole, "hostels:manage");

  const supabase = await createServerClient();

  // Query hostels with linked floors array to calculate safe delete count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawHostels } = await (supabase as any)
    .from("hostels")
    .select("*, floors(id)")
    .order("name", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hostels: HostelWithCounts[] = ((rawHostels as any[]) || []).map((h: any) => {
    const floorsArray = Array.isArray(h.floors) ? h.floors : [];
    const hostelFields = { ...h };
    delete hostelFields.floors;
    return {
      ...hostelFields,
      floor_count: floorsArray.length,
    };
  });

  if (hostels.length === 0) {
    const { MOCK_HOSTELS } = await import("@/lib/mock-data");
    hostels = MOCK_HOSTELS.map((mh) => ({
      id: mh.id,
      name: mh.name,
      code: mh.code,
      gender_type: mh.gender_type,
      total_floors: mh.total_floors,
      floor_count: mh.floor_count,
      address: mh.address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <HostelManagement initialHostels={hostels} canManage={canManage} />
      </main>
      <Footer />
    </div>
  );
}
