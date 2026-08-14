"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";

export interface RoomMapTile {
  id: string;
  floor_id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  floor_number: number;
  hostel_id: string;
  hostel_name: string;
  issue_state: "no_issues" | "has_active_issue" | "has_critical";
  active_issue_count: number;
  critical_issue_count: number;
  active_issues_summary: {
    id: string;
    title: string;
    priority: string;
    category: string;
    status: string;
  }[];
}

export interface HostelMapFloor {
  id: string;
  floor_number: number;
  name: string | null;
  rooms: RoomMapTile[];
}

export interface HostelMapData {
  hostels: { id: string; name: string; code: string }[];
  selectedHostel: { id: string; name: string; code: string } | null;
  floors: HostelMapFloor[];
  summary: {
    totalRooms: number;
    cleanRooms: number;
    nonCriticalRooms: number;
    criticalRooms: number;
  };
}

export interface RoomOccupantDetail {
  bed_id: string;
  bed_number: string;
  student: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface RoomMapDetails {
  room: {
    id: string;
    room_number: string;
    room_type: string;
    capacity: number;
    floor_number: number;
    hostel_name: string;
  };
  occupants: RoomOccupantDetail[];
  activeIssues: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    sla_deadline: string | null;
  }[];
  recentComplaints: {
    id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
  }[];
}

export interface MapActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Fetches real database floor plan and room issue states for Visual Hostel Map.
 */
export async function getHostelMapDataAction(
  targetHostelId?: string
): Promise<MapActionResult<HostelMapData>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();

  try {
    // 1. Fetch all hostels
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hostelsTable = (supabase as any).from("hostels");
    const { data: hostelsData, error: hostelsErr } = await hostelsTable
      .select("id, name, code")
      .order("name", { ascending: true });

    if (hostelsErr) {
      return { success: false, error: hostelsErr.message };
    }

    const hostels = (hostelsData || []) as { id: string; name: string; code: string }[];
    if (hostels.length === 0) {
      return {
        success: true,
        data: {
          hostels: [],
          selectedHostel: null,
          floors: [],
          summary: { totalRooms: 0, cleanRooms: 0, nonCriticalRooms: 0, criticalRooms: 0 },
        },
      };
    }

    // Select specified hostel or default to first
    const selectedHostel =
      hostels.find((h) => h.id === targetHostelId) || hostels[0];

    // 2. Fetch floors for selected hostel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const floorsTable = (supabase as any).from("floors");
    const { data: floorsData } = await floorsTable
      .select("id, floor_number, name")
      .eq("hostel_id", selectedHostel.id)
      .order("floor_number", { ascending: true });

    const rawFloors = (floorsData || []) as { id: string; floor_number: number; name: string | null }[];

    // 3. Fetch rooms for selected hostel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomsTable = (supabase as any).from("rooms");
    const { data: roomsData } = await roomsTable
      .select("id, floor_id, room_number, room_type, capacity, floor:floors!rooms_floor_id_fkey(floor_number)")
      .in(
        "floor_id",
        rawFloors.map((f) => f.id)
      )
      .order("room_number", { ascending: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawRooms = (roomsData || []) as any[];

    // 4. Fetch active issues for selected hostel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issuesTable = (supabase as any).from("issues");
    const { data: activeIssuesData } = await issuesTable
      .select("id, room_id, status, priority, title, category")
      .eq("hostel_id", selectedHostel.id)
      .neq("status", "resolved");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeIssues = (activeIssuesData || []) as any[];

    // Map issues by room_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomIssuesMap: Record<string, any[]> = {};
    activeIssues.forEach((issue) => {
      if (issue.room_id) {
        if (!roomIssuesMap[issue.room_id]) roomIssuesMap[issue.room_id] = [];
        roomIssuesMap[issue.room_id].push(issue);
      }
    });

    let totalRooms = 0;
    let cleanRooms = 0;
    let nonCriticalRooms = 0;
    let criticalRooms = 0;

    // Group rooms into floors
    const floorMap: Record<string, RoomMapTile[]> = {};
    rawFloors.forEach((f) => {
      floorMap[f.id] = [];
    });

    rawRooms.forEach((rm) => {
      totalRooms++;
      const rIssues = roomIssuesMap[rm.id] || [];
      const activeCount = rIssues.length;
      const criticalCount = rIssues.filter(
        (i) => i.priority === "critical" || i.priority === "urgent"
      ).length;

      let state: "no_issues" | "has_active_issue" | "has_critical" = "no_issues";
      if (criticalCount > 0) {
        state = "has_critical";
        criticalRooms++;
      } else if (activeCount > 0) {
        state = "has_active_issue";
        nonCriticalRooms++;
      } else {
        cleanRooms++;
      }

      const tile: RoomMapTile = {
        id: rm.id,
        floor_id: rm.floor_id,
        room_number: rm.room_number,
        room_type: rm.room_type || "standard",
        capacity: rm.capacity || 2,
        floor_number: rm.floor?.floor_number ?? 1,
        hostel_id: selectedHostel.id,
        hostel_name: selectedHostel.name,
        issue_state: state,
        active_issue_count: activeCount,
        critical_issue_count: criticalCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        active_issues_summary: rIssues.map((i: any) => ({
          id: i.id,
          title: i.title,
          priority: i.priority,
          category: i.category,
          status: i.status,
        })),
      };

      if (floorMap[rm.floor_id]) {
        floorMap[rm.floor_id].push(tile);
      }
    });

    const floors: HostelMapFloor[] = rawFloors.map((f) => ({
      id: f.id,
      floor_number: f.floor_number,
      name: f.name,
      rooms: floorMap[f.id] || [],
    }));

    return {
      success: true,
      data: {
        hostels,
        selectedHostel,
        floors,
        summary: {
          totalRooms,
          cleanRooms,
          nonCriticalRooms,
          criticalRooms,
        },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load visual map data.",
    };
  }
}

/**
 * Server Action: Fetches detailed room inspection info (occupants, active issues, recent complaints).
 */
export async function getRoomMapDetailsAction(
  roomId: string
): Promise<MapActionResult<RoomMapDetails>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!roomId) {
    return { success: false, error: "Room ID is required." };
  }

  const supabase = await createServerClient();

  try {
    // 1. Fetch room details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomsTable = (supabase as any).from("rooms");
    const { data: rmData, error: rmErr } = await roomsTable
      .select(`
        id,
        room_number,
        room_type,
        capacity,
        floor:floors!rooms_floor_id_fkey(
          floor_number,
          hostel:hostels!floors_hostel_id_fkey(name)
        )
      `)
      .eq("id", roomId)
      .maybeSingle();

    if (rmErr || !rmData) {
      return { success: false, error: "Room inspection record not found." };
    }

    // 2. Fetch bed occupants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bedsTable = (supabase as any).from("beds");
    const { data: bedsData } = await bedsTable
      .select(`
        id,
        bed_number,
        allocations:allocations!allocations_bed_id_fkey(
          status,
          student:profiles!allocations_student_id_fkey(id, full_name, email)
        )
      `)
      .eq("room_id", roomId);

    const isStaff = ["admin", "warden", "staff"].includes(role || "");

    const occupants: RoomOccupantDetail[] = [];
    if (bedsData && Array.isArray(bedsData)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bedsData.forEach((b: any) => {
        const allocs = Array.isArray(b.allocations) ? b.allocations : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeAlloc = allocs.find((a: any) => a.status === "active");

        let studentInfo = null;
        if (activeAlloc?.student) {
          const isSelf = activeAlloc.student.id === user.id;
          if (isStaff || isSelf) {
            studentInfo = {
              id: activeAlloc.student.id,
              full_name: activeAlloc.student.full_name,
              email: activeAlloc.student.email,
            };
          } else {
            // Redact PII for other students inspecting the room
            studentInfo = {
              id: activeAlloc.student.id,
              full_name: "Occupied Bed",
              email: "Resident Student",
            };
          }
        }

        occupants.push({
          bed_id: b.id,
          bed_number: b.bed_number,
          student: studentInfo,
        });
      });
    }

    // 3. Fetch active issues for room
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issuesTable = (supabase as any).from("issues");
    const { data: activeData } = await issuesTable
      .select("id, title, description, category, priority, status, created_at, sla_deadline")
      .eq("room_id", roomId)
      .neq("status", "resolved")
      .order("created_at", { ascending: false });

    // 4. Fetch recent complaints for room (last 10)
    const { data: recentData } = await issuesTable
      .select("id, title, category, priority, status, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      success: true,
      data: {
        room: {
          id: rmData.id,
          room_number: rmData.room_number,
          room_type: rmData.room_type || "standard",
          capacity: rmData.capacity || 2,
          floor_number: rmData.floor?.floor_number ?? 1,
          hostel_name: rmData.floor?.hostel?.name || "Hostel",
        },
        occupants,
        activeIssues: (activeData || []) as RoomMapDetails["activeIssues"],
        recentComplaints: (recentData || []) as RoomMapDetails["recentComplaints"],
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load room details.",
    };
  }
}
