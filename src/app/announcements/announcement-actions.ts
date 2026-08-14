"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { createNotificationInternal } from "@/app/notifications/notification-actions";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export interface AnnouncementRow {
  id: string;
  author_id: string;
  title: string;
  content: string;
  target_type: "everyone" | "hostel" | "floor" | "room";
  target_hostel_id: string | null;
  target_floor_id: string | null;
  target_room_id: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string | null;
    email: string;
  } | null;
  target_hostel?: { name: string } | null;
  target_floor?: { floor_number: number; hostel?: { name: string } | null } | null;
  target_room?: { room_number: string; floor?: { floor_number: number; hostel?: { name: string } | null } | null } | null;
}

export interface AnnouncementActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Create a new targeted announcement.
 */
export async function createAnnouncementAction({
  title,
  content,
  targetType,
  targetHostelId,
  targetFloorId,
  targetRoomId,
  isPublished = true,
}: {
  title: string;
  content: string;
  targetType: "everyone" | "hostel" | "floor" | "room";
  targetHostelId?: string | null;
  targetFloorId?: string | null;
  targetRoomId?: string | null;
  isPublished?: boolean;
}): Promise<AnnouncementActionResult<AnnouncementRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!["admin", "warden", "staff"].includes(role || "")) {
    return { success: false, error: "Access Restricted: Warden privileges required." };
  }

  const cleanedTitle = title?.trim() || "";
  const cleanedContent = content?.trim() || "";

  if (cleanedTitle.length < 3) {
    return { success: false, error: "Announcement title must be at least 3 characters long." };
  }

  if (cleanedContent.length < 5) {
    return { success: false, error: "Announcement body content must be at least 5 characters long." };
  }

  // Target validation
  if (targetType === "hostel" && !targetHostelId) {
    return { success: false, error: "Hostel selection is required for hostel-targeted announcements." };
  }
  if (targetType === "floor" && !targetFloorId) {
    return { success: false, error: "Floor selection is required for floor-targeted announcements." };
  }
  if (targetType === "room" && !targetRoomId) {
    return { success: false, error: "Room selection is required for room-targeted announcements." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("announcements");

  const { data: newRecord, error: insertErr } = await table
    .insert({
      author_id: user.id,
      title: cleanedTitle,
      content: cleanedContent,
      target_type: targetType,
      target_hostel_id: targetType === "hostel" ? targetHostelId : null,
      target_floor_id: targetType === "floor" ? targetFloorId : null,
      target_room_id: targetType === "room" ? targetRoomId : null,
      is_published: isPublished,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr || !newRecord) {
    return { success: false, error: insertErr?.message || "Failed to create announcement." };
  }

  // Send in-app notifications if published
  if (isPublished) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = (supabase as any).from("profiles");

    if (targetType === "everyone") {
      const { data: allProfiles } = await profilesTable.select("id");
      if (allProfiles && Array.isArray(allProfiles)) {
        for (const p of allProfiles) {
          if (p.id !== user.id) {
            await createNotificationInternal({
              userId: p.id,
              title: "📢 New Announcement Published",
              message: `Broadcast: '${cleanedTitle}'`,
              type: "announcement_published",
              actorUserId: user.id,
            });
          }
        }
      }
    } else {
      // Find students matching targeted hostel, floor, or room
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allocationsTable = (supabase as any).from("allocations");
      const { data: allocs } = await allocationsTable
        .select(`
          student_id,
          bed:beds!allocations_bed_id_fkey(
            room_id,
            room:rooms!beds_room_id_fkey(
              floor_id,
              floor:floors!rooms_floor_id_fkey(hostel_id)
            )
          )
        `)
        .eq("status", "active");

      if (allocs && Array.isArray(allocs)) {
        for (const a of allocs) {
          const sId = a.student_id;
          const roomId = a.bed?.room_id;
          const floorId = a.bed?.room?.floor_id;
          const hostelId = a.bed?.room?.floor?.hostel_id;

          let isMatch = false;
          if (targetType === "hostel" && hostelId === targetHostelId) isMatch = true;
          if (targetType === "floor" && floorId === targetFloorId) isMatch = true;
          if (targetType === "room" && roomId === targetRoomId) isMatch = true;

          if (isMatch && sId && sId !== user.id) {
            await createNotificationInternal({
              userId: sId,
              title: "📢 Targeted Announcement Published",
              message: `Notice for your block: '${cleanedTitle}'`,
              type: "announcement_published",
              actorUserId: user.id,
            });
          }
        }
      }
    }
  }

  // Log Audit Event
  await logAuditEvent({
    actorId: user.id,
    action: "announcement.created",
    targetType: "announcement",
    targetId: newRecord.id,
    metadata: {
      title: cleanedTitle,
      target_type: targetType,
      is_published: isPublished,
    },
  });

  revalidatePath("/announcements");
  return { success: true, data: newRecord as AnnouncementRow };
}

/**
 * Server Action: Retrieve announcements relevant to user.
 * Staff sees all announcements; Students see targeted published announcements.
 */
export async function getAnnouncementsAction(): Promise<
  AnnouncementActionResult<AnnouncementRow[]>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("announcements");

  const isStaff = ["admin", "warden", "staff"].includes(role || "");

  if (isStaff) {
    const { data, error } = await table
      .select(`
        id,
        author_id,
        title,
        content,
        target_type,
        target_hostel_id,
        target_floor_id,
        target_room_id,
        is_published,
        published_at,
        created_at,
        updated_at,
        author:profiles!announcements_author_id_fkey(full_name, email),
        target_hostel:hostels!announcements_target_hostel_id_fkey(name),
        target_floor:floors!announcements_target_floor_id_fkey(floor_number, hostel:hostels!floors_hostel_id_fkey(name)),
        target_room:rooms!announcements_target_room_id_fkey(room_number, floor:floors!rooms_floor_id_fkey(floor_number, hostel:hostels!floors_hostel_id_fkey(name)))
      `)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []) as AnnouncementRow[] };
  }

  // Student view: Find active bed allocation to get hostel_id, floor_id, room_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("allocations");
  const { data: alloc } = await allocationsTable
    .select(`
      bed:beds!allocations_bed_id_fkey(
        room_id,
        room:rooms!beds_room_id_fkey(
          floor_id,
          floor:floors!rooms_floor_id_fkey(hostel_id)
        )
      )
    `)
    .eq("student_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const studentRoomId = alloc?.bed?.room_id || null;
  const studentFloorId = alloc?.bed?.room?.floor_id || null;
  const studentHostelId = alloc?.bed?.room?.floor?.hostel_id || null;

  // Fetch published announcements matching everyone OR student's location
  const { data: studentAnnouncements, error: sErr } = await table
    .select(`
      id,
      author_id,
      title,
      content,
      target_type,
      target_hostel_id,
      target_floor_id,
      target_room_id,
      is_published,
      published_at,
      created_at,
      updated_at,
      author:profiles!announcements_author_id_fkey(full_name, email),
      target_hostel:hostels!announcements_target_hostel_id_fkey(name),
      target_floor:floors!announcements_target_floor_id_fkey(floor_number, hostel:hostels!floors_hostel_id_fkey(name)),
      target_room:rooms!announcements_target_room_id_fkey(room_number, floor:floors!rooms_floor_id_fkey(floor_number, hostel:hostels!floors_hostel_id_fkey(name)))
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (sErr) return { success: false, error: sErr.message };

  const all = (studentAnnouncements || []) as AnnouncementRow[];
  const relevant = all.filter((item) => {
    if (item.target_type === "everyone") return true;
    if (item.target_type === "hostel" && item.target_hostel_id === studentHostelId) return true;
    if (item.target_type === "floor" && item.target_floor_id === studentFloorId) return true;
    if (item.target_type === "room" && item.target_room_id === studentRoomId) return true;
    return false;
  });

  return { success: true, data: relevant };
}

/**
 * Server Action: Update or toggle publish state of an announcement.
 */
export async function updateAnnouncementAction({
  id,
  title,
  content,
  isPublished,
}: {
  id: string;
  title?: string;
  content?: string;
  isPublished?: boolean;
}): Promise<AnnouncementActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !["admin", "warden", "staff"].includes(role || "")) {
    return { success: false, error: "Warden privileges required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("announcements");

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.content = content.trim();
  if (isPublished !== undefined) updates.is_published = isPublished;

  const { error } = await table.update(updates).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/announcements");
  return { success: true, data: null };
}

/**
 * Server Action: Delete an announcement.
 */
export async function deleteAnnouncementAction(
  id: string
): Promise<AnnouncementActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !["admin", "warden", "staff"].includes(role || "")) {
    return { success: false, error: "Warden privileges required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabase as any).from("announcements");

  const { error } = await table.delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/announcements");
  return { success: true, data: null };
}

export interface TargetingOptions {
  hostels: { id: string; name: string; code: string }[];
  floors: { id: string; floor_number: number; hostel_name: string }[];
  rooms: { id: string; room_number: string; floor_number: number; hostel_name: string }[];
}

/**
 * Server Action: Fetch target options (hostels, floors, rooms) for announcement creation modal.
 */
export async function getTargetingOptionsAction(): Promise<
  AnnouncementActionResult<TargetingOptions>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !["admin", "warden", "staff"].includes(role || "")) {
    return { success: false, error: "Warden privileges required." };
  }

  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");

  const { data: hostelsData } = await hostelsTable.select("id, name, code").order("name");
  const { data: floorsData } = await floorsTable
    .select("id, floor_number, hostel:hostels!floors_hostel_id_fkey(name)")
    .order("floor_number");
  const { data: roomsData } = await roomsTable
    .select("id, room_number, floor:floors!rooms_floor_id_fkey(floor_number, hostel:hostels!floors_hostel_id_fkey(name))")
    .order("room_number");

  const hostels = (hostelsData || []) as { id: string; name: string; code: string }[];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floors = (floorsData || []).map((f: any) => ({
    id: f.id,
    floor_number: f.floor_number,
    hostel_name: f.hostel?.name || "Hostel",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rooms = (roomsData || []).map((r: any) => ({
    id: r.id,
    room_number: r.room_number,
    floor_number: r.floor?.floor_number || 0,
    hostel_name: r.floor?.hostel?.name || "Hostel",
  }));

  return {
    success: true,
    data: { hostels, floors, rooms },
  };
}
