"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import type { Database } from "@/lib/supabase/types";

export type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

export interface DetailedIssue extends IssueRow {
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roll_number: string | null;
  } | null;
  hostel?: {
    id: string;
    name: string;
    code: string;
  } | null;
  room?: {
    id: string;
    room_number: string;
    room_type: string;
  } | null;
}

export interface StudentResidenceContext {
  hostel_id: string;
  hostel_name: string;
  hostel_code: string;
  room_id: string | null;
  room_number: string | null;
}

export interface HostelsOption {
  id: string;
  name: string;
  code: string;
}

export interface IssueActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface IssueFormData {
  title: string;
  description: string;
  category:
    | "plumbing"
    | "electrical"
    | "carpentry"
    | "appliance"
    | "cleaning"
    | "internet"
    | "security"
    | "pest_control"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  hostel_id: string;
  room_id?: string | null;
  location_description?: string | null;
}

/**
 * Server Action: Fetch student's current active residence for auto-prefilling issue location
 */
export async function getStudentActiveResidenceAction(): Promise<
  IssueActionResult<StudentResidenceContext | null>
> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");

  const { data, error } = await allocationsTable
    .select(`
      bed:beds!room_allocations_bed_id_fkey (
        room:rooms!beds_room_id_fkey (
          id,
          room_number,
          floor:floors!rooms_floor_id_fkey (
            hostel:hostels!floors_hostel_id_fkey (
              id,
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

  if (error || !data || !data.bed?.room?.floor?.hostel) {
    return { success: true, data: null };
  }

  const resContext: StudentResidenceContext = {
    hostel_id: data.bed.room.floor.hostel.id,
    hostel_name: data.bed.room.floor.hostel.name,
    hostel_code: data.bed.room.floor.hostel.code,
    room_id: data.bed.room.id,
    room_number: data.bed.room.room_number,
  };

  return { success: true, data: resContext };
}

/**
 * Server Action: Fetch hostels list for issue location dropdown
 */
export async function getHostelsListAction(): Promise<
  IssueActionResult<HostelsOption[]>
> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");

  const { data, error } = await hostelsTable
    .select("id, name, code")
    .order("name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as HostelsOption[] };
}

/**
 * Server Action: Fetch issues for current user (or all if staff)
 */
export async function getIssuesAction(
  statusFilter?: string
): Promise<IssueActionResult<DetailedIssue[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  let query = issuesTable.select(`
    *,
    reporter:profiles!issues_reporter_id_fkey (id, first_name, last_name, email, roll_number),
    hostel:hostels!issues_hostel_id_fkey (id, name, code),
    room:rooms!issues_room_id_fkey (id, room_number, room_type)
  `);

  if (role === "student") {
    // Restrict student query to their own reported issues
    query = query.eq("reporter_id", user.id);
  }

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawIssues, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return { success: false, error: `Failed to fetch issues: ${error.message}` };
  }

  return { success: true, data: (rawIssues || []) as DetailedIssue[] };
}

/**
 * Validates maintenance issue input fields
 */
function validateIssueInput(data: Partial<IssueFormData>): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: IssueFormData;
} {
  const errors: Record<string, string> = {};

  const title = data.title?.trim() || "";
  const description = data.description?.trim() || "";
  const category = data.category || "other";
  const priority = data.priority || "medium";
  const hostel_id = data.hostel_id || "";
  const room_id = data.room_id || null;
  const location_description = data.location_description?.trim() || null;

  if (!title) {
    errors.title = "Issue title is required.";
  } else if (title.length < 3) {
    errors.title = "Title must be at least 3 characters long.";
  } else if (title.length > 200) {
    errors.title = "Title must not exceed 200 characters.";
  }

  if (!description) {
    errors.description = "Detailed issue description is required.";
  } else if (description.length < 10) {
    errors.description = "Description must be at least 10 characters long.";
  } else if (description.length > 2000) {
    errors.description = "Description must not exceed 2000 characters.";
  }

  const validCategories = [
    "plumbing",
    "electrical",
    "carpentry",
    "appliance",
    "cleaning",
    "internet",
    "security",
    "pest_control",
    "other",
  ];
  if (!validCategories.includes(category)) {
    errors.category = "Invalid maintenance category selected.";
  }

  const validPriorities = ["low", "medium", "high", "urgent"];
  if (!validPriorities.includes(priority)) {
    errors.priority = "Invalid priority level selected.";
  }

  if (!hostel_id) {
    errors.hostel_id = "Please select the target hostel location.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      title,
      description,
      category: category as IssueFormData["category"],
      priority: priority as IssueFormData["priority"],
      hostel_id,
      room_id,
      location_description,
    },
  };
}

/**
 * Server Action: Create a new maintenance issue report (Students & Staff)
 */
export async function createIssueAction(
  formData: IssueFormData
): Promise<IssueActionResult<IssueRow>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized: User authentication required to report issues.",
    };
  }

  const validation = validateIssueInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please review your issue report inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();

  // Safety check: Verify hostel exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");
  const { data: hostelExists } = await hostelsTable
    .select("id")
    .eq("id", validation.sanitized.hostel_id)
    .maybeSingle();

  if (!hostelExists) {
    return {
      success: false,
      error: "Invalid location: Target hostel record was not found.",
    };
  }

  // Insert issue record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");
  const { data: newIssue, error: insertErr } = await issuesTable
    .insert({
      title: validation.sanitized.title,
      description: validation.sanitized.description,
      category: validation.sanitized.category,
      priority: validation.sanitized.priority,
      status: "reported",
      reporter_id: user.id,
      hostel_id: validation.sanitized.hostel_id,
      room_id: validation.sanitized.room_id || null,
      location_description: validation.sanitized.location_description || null,
    })
    .select()
    .single();

  if (insertErr) {
    return {
      success: false,
      error: `Database error: ${insertErr.message || "Failed to submit maintenance issue."}`,
    };
  }

  revalidatePath("/issues");
  return {
    success: true,
    data: newIssue as IssueRow,
  };
}
