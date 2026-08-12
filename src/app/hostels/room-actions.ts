"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import type { Database } from "@/lib/supabase/types";

export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];

export interface RoomWithBedCount extends RoomRow {
  bed_count?: number;
}

export interface RoomActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface RoomFormData {
  room_number: string;
  room_type: "single" | "double" | "triple" | "dormitory";
  capacity: number;
  status: "available" | "occupied" | "full" | "under_maintenance" | "inactive";
  monthly_rent?: number | null;
}

/**
 * Server Action: Fetch all rooms for a given floor
 */
export async function getRoomsForFloorAction(
  floorId: string
): Promise<RoomActionResult<RoomWithBedCount[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:read")) {
    return {
      success: false,
      error: "Unauthorized: Access permissions required to view rooms.",
    };
  }

  if (!floorId) {
    return { success: false, error: "Floor ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");

  const { data: rawRooms, error } = await roomsTable
    .select("*, beds(id)")
    .eq("floor_id", floorId)
    .order("room_number", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch rooms: ${error.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rooms: RoomWithBedCount[] = (rawRooms || []).map((r: any) => {
    const bedsArray = Array.isArray(r.beds) ? r.beds : [];
    const roomObj = { ...r };
    delete roomObj.beds;
    return {
      ...(roomObj as RoomRow),
      bed_count: bedsArray.length,
    };
  });

  return { success: true, data: rooms };
}

/**
 * Validates room input data
 */
function validateRoomInput(data: Partial<RoomFormData>): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: RoomFormData;
} {
  const errors: Record<string, string> = {};

  const room_number = data.room_number?.trim() || "";
  const room_type = data.room_type || "double";
  const capacity = Number(data.capacity);
  const status = data.status || "available";
  const monthly_rent =
    data.monthly_rent !== undefined && data.monthly_rent !== null && data.monthly_rent !== ("" as unknown)
      ? Number(data.monthly_rent)
      : null;

  if (!room_number) {
    errors.room_number = "Room number is required.";
  } else if (room_number.length > 20) {
    errors.room_number = "Room number must not exceed 20 characters.";
  }

  if (!["single", "double", "triple", "dormitory"].includes(room_type)) {
    errors.room_type = "Invalid room type selected.";
  }

  if (isNaN(capacity) || capacity <= 0 || !Number.isInteger(capacity)) {
    errors.capacity = "Capacity must be a positive integer (at least 1).";
  }

  if (!["available", "occupied", "full", "under_maintenance", "inactive"].includes(status)) {
    errors.status = "Invalid room status selected.";
  }

  if (monthly_rent !== null && (isNaN(monthly_rent) || monthly_rent < 0)) {
    errors.monthly_rent = "Monthly rent must be a non-negative number.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      room_number,
      room_type: room_type as "single" | "double" | "triple" | "dormitory",
      capacity,
      status: status as "available" | "occupied" | "full" | "under_maintenance" | "inactive",
      monthly_rent,
    },
  };
}

/**
 * Server Action: Create a new room under a floor (Admin only)
 */
export async function createRoomAction(
  floorId: string,
  formData: RoomFormData
): Promise<RoomActionResult<RoomRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to create rooms.",
    };
  }

  if (!floorId) {
    return { success: false, error: "Floor ID is required." };
  }

  const validation = validateRoomInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();

  // Safety check: Ensure the referenced floor actually exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");
  const { data: floorExists, error: floorErr } = await floorsTable
    .select("id, floor_number, name")
    .eq("id", floorId)
    .maybeSingle();

  if (floorErr || !floorExists) {
    return {
      success: false,
      error: "Invalid floor reference: Target floor record was not found.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");
  const { data, error } = await roomsTable
    .insert({
      floor_id: floorId,
      room_number: validation.sanitized.room_number,
      room_type: validation.sanitized.room_type,
      capacity: validation.sanitized.capacity,
      status: validation.sanitized.status,
      monthly_rent: validation.sanitized.monthly_rent,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Room '${validation.sanitized.room_number}' already exists on Floor ${floorExists.floor_number}. Room numbers must be unique within each floor.`,
        fieldErrors: { room_number: `Room ${validation.sanitized.room_number} already exists on this floor.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to create room."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as RoomRow,
  };
}

/**
 * Server Action: Update an existing room (Admin only)
 */
export async function updateRoomAction(
  roomId: string,
  formData: RoomFormData
): Promise<RoomActionResult<RoomRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to update rooms.",
    };
  }

  if (!roomId) {
    return { success: false, error: "Room ID is required." };
  }

  const validation = validateRoomInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");

  const { data, error } = await roomsTable
    .update({
      room_number: validation.sanitized.room_number,
      room_type: validation.sanitized.room_type,
      capacity: validation.sanitized.capacity,
      status: validation.sanitized.status,
      monthly_rent: validation.sanitized.monthly_rent,
    })
    .eq("id", roomId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Room number '${validation.sanitized.room_number}' is already used by another room on this floor.`,
        fieldErrors: { room_number: `Room ${validation.sanitized.room_number} is already taken on this floor.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to update room."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as RoomRow,
  };
}

/**
 * Server Action: Delete a room when safe (Admin only)
 * Checks if beds exist before allowing deletion.
 */
export async function deleteRoomAction(roomId: string): Promise<RoomActionResult> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to delete rooms.",
    };
  }

  if (!roomId) {
    return { success: false, error: "Room ID is required for deletion." };
  }

  const supabase = await createServerClient();

  // Safety check: Verify whether beds exist for this room
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");
  const { count: bedCount, error: countErr } = await bedsTable
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);

  if (countErr) {
    return {
      success: false,
      error: `Failed safety check query: ${countErr.message}`,
    };
  }

  if (bedCount && bedCount > 0) {
    return {
      success: false,
      error: `Cannot delete room: ${bedCount} bed(s) are currently configured in this room. Delete associated beds first.`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");
  const { error } = await roomsTable.delete().eq("id", roomId);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete room because sub-entities (beds/allocations) reference it.",
      };
    }
    return {
      success: false,
      error: `Database error: ${error.message || "Failed to delete room."}`,
    };
  }

  revalidatePath("/hostels");
  return { success: true };
}
