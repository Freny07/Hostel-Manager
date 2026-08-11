import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ProfileForm, type ProfileData, type AllocationData } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  // Fetch profile record joined with role
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single();

  // Fallback profile object if trigger hasn't fired yet
  const profile: ProfileData = profileData
    ? (profileData as unknown as ProfileData)
    : {
        id: user.id,
        first_name: user.user_metadata?.first_name || user.email?.split("@")[0] || "User",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
        phone: null,
        avatar_url: user.user_metadata?.avatar_url || null,
        roll_number: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        created_at: user.created_at || new Date().toISOString(),
        roles: { name: "student" },
      };

  // Fetch active room allocation details if assigned
  const { data: allocationData } = await supabase
    .from("room_allocations")
    .select(`
      id,
      start_date,
      status,
      beds (
        bed_label,
        rooms (
          room_number,
          room_type,
          floors (
            floor_number,
            hostels (
              name,
              code
            )
          )
        )
      )
    `)
    .eq("student_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <ProfileForm
          initialProfile={profile}
          initialAllocation={allocationData as unknown as AllocationData | null}
        />
      </main>
      <Footer />
    </div>
  );
}
