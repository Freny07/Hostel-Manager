"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import type { Database } from "@/lib/supabase/types";

export type HostelRow = Database["public"]["Tables"]["hostels"]["Row"];

export interface HostelActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface HostelFormData {
  name: string;
  code: string;
  gender_type: "male" | "female" | "co-ed";
  total_floors: number;
  address?: string;
}

/**
 * Validates hostel form data on the server side.
 */
function validateHostelInput(data: Partial<HostelFormData>): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: HostelFormData;
} {
  const errors: Record<string, string> = {};

  const name = data.name?.trim() || "";
  const code = data.code?.trim().toUpperCase() || "";
  const gender_type = data.gender_type || "co-ed";
  const total_floors = Number(data.total_floors);
  const address = data.address?.trim() || undefined;

  if (!name) {
    errors.name = "Hostel name is required.";
  } else if (name.length > 150) {
    errors.name = "Hostel name must not exceed 150 characters.";
  }

  if (!code) {
    errors.code = "Hostel code is required.";
  } else if (code.length > 20) {
    errors.code = "Hostel code must not exceed 20 characters.";
  } else if (!/^[A-Z0-9_-]+$/.test(code)) {
    errors.code = "Code can only contain uppercase letters, numbers, hyphens, and underscores.";
  }

  if (!["male", "female", "co-ed"].includes(gender_type)) {
    errors.gender_type = "Invalid gender type selected.";
  }

  if (isNaN(total_floors) || total_floors < 1 || !Number.isInteger(total_floors)) {
    errors.total_floors = "Total floors must be a positive integer (at least 1).";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      name,
      code,
      gender_type: gender_type as "male" | "female" | "co-ed",
      total_floors,
      address,
    },
  };
}

/**
 * Server Action: Create a new hostel (Admin only)
 */
export async function createHostelAction(
  formData: HostelFormData
): Promise<HostelActionResult<HostelRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to create hostels.",
    };
  }

  const validation = validateHostelInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check the highlighted form fields.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");

  const { data, error } = await hostelsTable
    .insert({
      name: validation.sanitized.name,
      code: validation.sanitized.code,
      gender_type: validation.sanitized.gender_type,
      total_floors: validation.sanitized.total_floors,
      address: validation.sanitized.address || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Hostel code '${validation.sanitized.code}' already exists. Please use a unique code.`,
        fieldErrors: { code: "This hostel code is already in use." },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to create hostel record."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as HostelRow,
  };
}

/**
 * Server Action: Update an existing hostel (Admin only)
 */
export async function updateHostelAction(
  id: string,
  formData: HostelFormData
): Promise<HostelActionResult<HostelRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to update hostels.",
    };
  }

  if (!id) {
    return { success: false, error: "Hostel ID is required for update." };
  }

  const validation = validateHostelInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check the highlighted form fields.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");

  const { data, error } = await hostelsTable
    .update({
      name: validation.sanitized.name,
      code: validation.sanitized.code,
      gender_type: validation.sanitized.gender_type,
      total_floors: validation.sanitized.total_floors,
      address: validation.sanitized.address || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Hostel code '${validation.sanitized.code}' is already used by another hostel.`,
        fieldErrors: { code: "This hostel code is already in use." },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to update hostel record."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as HostelRow,
  };
}

/**
 * Server Action: Delete a hostel where safe (Admin only)
 * Verifies if dependent floors or rooms exist before proceeding with deletion.
 */
export async function deleteHostelAction(id: string): Promise<HostelActionResult> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to delete hostels.",
    };
  }

  if (!id) {
    return { success: false, error: "Hostel ID is required for deletion." };
  }

  const supabase = await createServerClient();

  // Safety check: Verify whether dependent floors exist
  const { count: floorCount, error: countError } = await supabase
    .from("floors")
    .select("id", { count: "exact", head: true })
    .eq("hostel_id", id);

  if (countError) {
    return {
      success: false,
      error: `Failed safety check query: ${countError.message}`,
    };
  }

  if (floorCount && floorCount > 0) {
    return {
      success: false,
      error: `Cannot safely delete hostel: ${floorCount} floor(s) are currently configured under this hostel. Remove associated sub-entities first or contact system support.`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");
  const { error } = await hostelsTable.delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete hostel because other database records reference it.",
      };
    }
    return {
      success: false,
      error: `Database error: ${error.message || "Failed to delete hostel."}`,
    };
  }

  revalidatePath("/hostels");
  return { success: true };
}
