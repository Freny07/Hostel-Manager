import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getAnnouncementsAction } from "@/app/announcements/announcement-actions";
import { StudentAnnouncementFeed } from "@/components/announcements/StudentAnnouncementFeed";
import { WardenAnnouncementList } from "@/components/announcements/WardenAnnouncementList";

export const metadata = {
  title: "Campus Notices & Announcements | Hostel Manager",
  description: "Targeted hostel notices and official announcements.",
};

export default async function AnnouncementsPage() {
  const { user, role } = await getUserRoleAndProfile();

  const effectiveRole = role || "warden";
  const res = await getAnnouncementsAction();
  const initialAnnouncements = res.success && res.data ? res.data : [];

  const isStudent = effectiveRole === "student";

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {isStudent ? (
          <StudentAnnouncementFeed initialAnnouncements={initialAnnouncements} />
        ) : (
          <WardenAnnouncementList initialAnnouncements={initialAnnouncements} />
        )}
      </main>
      <Footer />
    </div>
  );
}
