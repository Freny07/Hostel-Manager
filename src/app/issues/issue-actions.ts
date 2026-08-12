"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import type { Database } from "@/lib/supabase/types";
import { isValidStatusTransition, type IssueStatus } from "@/lib/issues/workflow";

export type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

export interface IssueAssignmentDetail {
  id: string;
  status: string;
  notes: string | null;
  assigned_at: string;
  completed_at: string | null;
  assigned_to?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
  assigned_by?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface DetailedIssue extends IssueRow {
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roll_number: string | null;
    phone: string | null;
  } | null;
  hostel?: {
    id: string;
    name: string;
    code: string;
    address: string | null;
  } | null;
  room?: {
    id: string;
    room_number: string;
    room_type: string;
    floor?: {
      id: string;
      floor_number: number;
      name: string | null;
    } | null;
  } | null;
  assignments?: IssueAssignmentDetail[];
}

/**
 * Server Action: Fetch full details for a specific maintenance issue with authorization check
 */
export async function getIssueDetailAction(
  issueId: string
): Promise<IssueActionResult<DetailedIssue>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  const { data: rawIssue, error } = await issuesTable
    .select(`
      *,
      reporter:profiles!issues_reporter_id_fkey (id, first_name, last_name, email, roll_number, phone),
      hostel:hostels!issues_hostel_id_fkey (id, name, code, address),
      room:rooms!issues_room_id_fkey (
        id,
        room_number,
        room_type,
        floor:floors!rooms_floor_id_fkey (
          id,
          floor_number,
          name
        )
      ),
      assignments:issue_assignments!issue_assignments_issue_id_fkey (
        id,
        status,
        notes,
        assigned_at,
        completed_at,
        assigned_to:profiles!issue_assignments_assigned_to_fkey (id, first_name, last_name, email, phone),
        assigned_by:profiles!issue_assignments_assigned_by_fkey (first_name, last_name)
      )
    `)
    .eq("id", issueId)
    .maybeSingle();

  if (error || !rawIssue) {
    return { success: false, error: "Maintenance issue record not found." };
  }

  const issue = rawIssue as DetailedIssue;

  // Authorization check: Students can ONLY access issues they reported
  if (role === "student" && issue.reporter_id !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to view this issue.",
    };
  }

  return { success: true, data: issue };
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
  statusFilter?: string,
  hostelFilter?: string
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

  if (hostelFilter && hostelFilter !== "all") {
    query = query.eq("hostel_id", hostelFilter);
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

export interface IssueUpdateHistory {
  id: string;
  issue_id: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
  changed_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * Server Action: Update issue status (Staff & Admin ONLY)
 * Enforces role-based permissions, server-side status validation, and audit logging.
 */
export async function updateIssueStatusAction({
  issueId,
  newStatus,
  notes,
}: {
  issueId: string;
  newStatus: IssueStatus;
  notes?: string;
}): Promise<IssueActionResult<IssueRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  // RBAC enforcement: Only staff (admin, warden) can update status
  if (!["admin", "warden"].includes(role)) {
    return {
      success: false,
      error: "Unauthorized: Only hostel administration staff can update issue statuses.",
    };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  // Re-fetch current status from database to prevent trusting client status state
  const { data: currentIssue, error: fetchErr } = await issuesTable
    .select("id, status")
    .eq("id", issueId)
    .maybeSingle();

  if (fetchErr || !currentIssue) {
    return { success: false, error: "Maintenance issue record not found." };
  }

  const currentStatus = currentIssue.status as IssueStatus;

  // Validate state machine transition
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid transition: Moving issue status from '${currentStatus}' to '${newStatus}' is not allowed.`,
    };
  }

  // Perform database update
  const resolvedAt = newStatus === "resolved" ? new Date().toISOString() : null;
  const { data: updatedIssue, error: updateErr } = await issuesTable
    .update({
      status: newStatus,
      resolved_at: resolvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId)
    .select()
    .single();

  if (updateErr) {
    return {
      success: false,
      error: `Failed to update status: ${updateErr.message}`,
    };
  }

  // Insert audit record into issue_updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");
  await updatesTable.insert({
    issue_id: issueId,
    changed_by: user.id,
    old_status: currentStatus,
    new_status: newStatus,
    notes: notes?.trim() || null,
  });

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: updatedIssue as IssueRow };
}

/**
 * Server Action: Fetch audit history of status updates for an issue
 */
export async function getIssueStatusHistoryAction(
  issueId: string
): Promise<IssueActionResult<IssueUpdateHistory[]>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");

  const { data, error } = await updatesTable
    .select(`
      id,
      issue_id,
      old_status,
      new_status,
      notes,
      created_at,
      changed_by:profiles!issue_updates_changed_by_fkey (id, first_name, last_name, email)
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as IssueUpdateHistory[] };
}

export interface StaffUserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_name?: string | null;
}

/**
 * Server Action: Fetch maintenance staff & admin profiles for issue assignment
 */
export async function getMaintenanceStaffUsersAction(): Promise<
  IssueActionResult<StaffUserOption[]>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!["admin", "warden"].includes(role)) {
    return { success: false, error: "Unauthorized." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = (supabase as any).from("profiles");

  const { data, error } = await profilesTable
    .select(`
      id,
      first_name,
      last_name,
      email,
      role:roles!profiles_role_id_fkey (name)
    `)
    .order("first_name", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Map staff profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staffUsers: StaffUserOption[] = (data || []).map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    role_name: p.role?.name || null,
  }));

  return { success: true, data: staffUsers };
}

/**
 * Server Action: Assign an issue to a maintenance staff user (Admin/Warden ONLY)
 */
export async function assignIssueAction({
  issueId,
  assignedToId,
  notes,
}: {
  issueId: string;
  assignedToId: string;
  notes?: string;
}): Promise<IssueActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!["admin", "warden"].includes(role)) {
    return {
      success: false,
      error: "Unauthorized: Only hostel administration staff can assign issues.",
    };
  }

  if (!issueId || !assignedToId) {
    return {
      success: false,
      error: "Both Issue ID and Assigned Staff User ID are required.",
    };
  }

  const supabase = await createServerClient();

  // Validate target staff user exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = (supabase as any).from("profiles");
  const { data: staffExists } = await profilesTable
    .select("id")
    .eq("id", assignedToId)
    .maybeSingle();

  if (!staffExists) {
    return {
      success: false,
      error: "Invalid staff user: Target profile was not found.",
    };
  }

  // Mark previous active assignments for this issue as 'reassigned'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignmentsTable = (supabase as any).from("issue_assignments");
  await assignmentsTable
    .update({ status: "reassigned", updated_at: new Date().toISOString() })
    .eq("issue_id", issueId)
    .eq("status", "active");

  // Insert new active assignment record
  const { error: assignErr } = await assignmentsTable.insert({
    issue_id: issueId,
    assigned_to: assignedToId,
    assigned_by: user.id,
    status: "active",
    notes: notes?.trim() || null,
    assigned_at: new Date().toISOString(),
  });

  if (assignErr) {
    return {
      success: false,
      error: `Failed to assign staff: ${assignErr.message}`,
    };
  }

  // Fetch current issue status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");
  const { data: currentIssue } = await issuesTable
    .select("id, status")
    .eq("id", issueId)
    .maybeSingle();

  // If issue is in 'reported' status, automatically update status to 'assigned'
  if (currentIssue && currentIssue.status === "reported") {
    await issuesTable
      .update({
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    // Insert audit update record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatesTable = (supabase as any).from("issue_updates");
    await updatesTable.insert({
      issue_id: issueId,
      changed_by: user.id,
      old_status: "reported",
      new_status: "assigned",
      notes: notes?.trim() ? `Assigned staff: ${notes.trim()}` : "Issue assigned to maintenance staff.",
    });
  }

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: null };
}
