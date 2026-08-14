"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import type { Database } from "@/lib/supabase/types";
import { isValidStatusTransition, type IssueStatus } from "@/lib/issues/workflow";
import { createNotificationInternal } from "@/app/notifications/notification-actions";
import {
  fetchTextEmbedding,
  calculateCosineSimilarity,
  computeCompositeSimilarity,
} from "@/lib/ml/similarity";

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
  sla_deadline?: string | null;
  is_overdue?: boolean;
  is_escalated?: boolean;
  sla_breached_at?: string | null;
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

  // Log immutable timeline event: issue_created
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");
  await updatesTable.insert({
    issue_id: newIssue.id,
    changed_by: user.id,
    old_status: null,
    new_status: "reported",
    event_type: "issue_created",
    notes: `Maintenance issue ticket reported under '${validation.sanitized.category}' category with ${validation.sanitized.priority} priority.`,
  });

  // Trigger notification for hostel staff on new ticket
  const isUrgent = validation.sanitized.priority === "urgent";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffProfiles } = await (supabase as any)
    .from("profiles")
    .select("id");
  if (staffProfiles && Array.isArray(staffProfiles)) {
    for (const staff of staffProfiles) {
      if (staff.id !== user.id) {
        await createNotificationInternal({
          userId: staff.id,
          title: isUrgent ? "🚨 Urgent Maintenance Ticket" : "New Maintenance Ticket Reported",
          message: `New ${validation.sanitized.priority} priority ${validation.sanitized.category} ticket '${validation.sanitized.title}' reported.`,
          type: isUrgent ? "issue_escalated" : "issue_created",
          issueId: newIssue.id,
          actorUserId: user.id,
        });
      }
    }
  }

  // Trigger background ML similarity analysis
  analyzeRelatedIssuesAction(newIssue.id).catch(() => {});

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

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();

  // Authorization enforcement: Admin, Warden, or active assigned technician
  const isStaffAdmin = ["admin", "warden"].includes(role);
  let isAssignedTechnician = false;

  if (!isStaffAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentsTable = (supabase as any).from("issue_assignments");
    const { data: assignment } = await assignmentsTable
      .select("id")
      .eq("issue_id", issueId)
      .eq("assigned_to", user.id)
      .eq("status", "active")
      .maybeSingle();

    isAssignedTechnician = !!assignment;
  }

  if (!isStaffAdmin && !isAssignedTechnician) {
    return {
      success: false,
      error:
        "Unauthorized: Only authorized staff or assigned technicians can update this issue's status.",
    };
  }

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
  const eventType = newStatus === "resolved" ? "resolution" : "status_changed";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");
  await updatesTable.insert({
    issue_id: issueId,
    changed_by: user.id,
    old_status: currentStatus,
    new_status: newStatus,
    event_type: eventType,
    notes: notes?.trim() || null,
  });

  // Trigger notification for ticket reporter
  const { data: fullIssue } = await issuesTable
    .select("reporter_id, title")
    .eq("id", issueId)
    .maybeSingle();

  if (fullIssue?.reporter_id) {
    const isResolved = newStatus === "resolved";
    await createNotificationInternal({
      userId: fullIssue.reporter_id,
      title: isResolved ? "Maintenance Ticket Resolved" : "Ticket Status Updated",
      message: isResolved
        ? `Your maintenance ticket '${fullIssue.title || "Issue"}' has been marked as resolved.`
        : `Your ticket '${fullIssue.title || "Issue"}' status changed to '${newStatus.replace("_", " ")}'.`,
      type: isResolved ? "issue_resolved" : "issue_status_changed",
      issueId,
      actorUserId: user.id,
    });
  }

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: updatedIssue as IssueRow };
}

/**
 * Server Action: Claim/Accept an issue task and move status to 'investigating'
 */
export async function claimIssueTaskAction({
  issueId,
  notes,
}: {
  issueId: string;
  notes?: string;
}): Promise<IssueActionResult<IssueRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (role === "student") {
    return {
      success: false,
      error: "Unauthorized: Students cannot claim maintenance tasks.",
    };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignmentsTable = (supabase as any).from("issue_assignments");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  // Fetch current issue
  const { data: currentIssue } = await issuesTable
    .select("id, status")
    .eq("id", issueId)
    .maybeSingle();

  if (!currentIssue) {
    return { success: false, error: "Issue record not found." };
  }

  // Verify if active assignment exists for another user
  const { data: activeAssign } = await assignmentsTable
    .select("id, assigned_to")
    .eq("issue_id", issueId)
    .eq("status", "active")
    .maybeSingle();

  if (!activeAssign) {
    // Self-assign task
    await assignmentsTable.insert({
      issue_id: issueId,
      assigned_to: user.id,
      assigned_by: user.id,
      status: "active",
      notes: "Task claimed by technician.",
      assigned_at: new Date().toISOString(),
    });
  }

  const currentStatus = currentIssue.status as IssueStatus;
  let targetStatus: IssueStatus = "investigating";

  if (currentStatus === "reported" || currentStatus === "assigned") {
    targetStatus = "investigating";
  } else if (isValidStatusTransition(currentStatus, "investigating")) {
    targetStatus = "investigating";
  } else {
    targetStatus = currentStatus;
  }

  // Update status to investigating if allowed
  if (targetStatus !== currentStatus && isValidStatusTransition(currentStatus, targetStatus)) {
    await issuesTable
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issueId);

    // Insert audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatesTable = (supabase as any).from("issue_updates");
    await updatesTable.insert({
      issue_id: issueId,
      changed_by: user.id,
      old_status: currentStatus,
      new_status: targetStatus,
      notes: notes?.trim() || "Technician claimed task and commenced investigation.",
    });
  }

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  const { data: updatedIssue } = await issuesTable
    .select()
    .eq("id", issueId)
    .single();

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
      event_type: "assignment_changed",
      notes: notes?.trim() ? `Assigned staff: ${notes.trim()}` : "Issue assigned to maintenance staff.",
    });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatesTable = (supabase as any).from("issue_updates");
    await updatesTable.insert({
      issue_id: issueId,
      changed_by: user.id,
      old_status: currentIssue?.status || "assigned",
      new_status: currentIssue?.status || "assigned",
      event_type: "assignment_changed",
      notes: notes?.trim() ? `Reassigned staff: ${notes.trim()}` : "Issue reassigned to maintenance staff.",
    });
  }

  // Trigger notification for assigned staff member
  await createNotificationInternal({
    userId: assignedToId,
    title: "Maintenance Task Assigned",
    message: `You have been assigned to maintenance task '${currentIssue?.title || "Issue"}'.`,
    type: "issue_assigned",
    issueId,
    actorUserId: user.id,
  });

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: null };
}

export interface AttachmentWithSignedUrl {
  id: string;
  issue_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string | null;
  uploader?: {
    first_name: string;
    last_name: string;
  } | null;
}

/**
 * Server Action: Upload file/image attachment for a maintenance issue
 */
export async function uploadIssueAttachmentAction(
  formData: FormData
): Promise<IssueActionResult<AttachmentWithSignedUrl>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  const issueId = formData.get("issueId") as string;
  const file = formData.get("file") as File | null;

  if (!issueId || !file) {
    return { success: false, error: "Issue ID and valid file are required." };
  }

  const supabase = await createServerClient();

  // Verify target issue exists and authorization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");
  const { data: issue } = await issuesTable
    .select("id, reporter_id")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) {
    return { success: false, error: "Target issue record not found." };
  }

  // Authorization check: Students can ONLY upload to their own reported issues
  if (role === "student" && issue.reporter_id !== user.id) {
    return { success: false, error: "Unauthorized access." };
  }

  // Server-side File Validation
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: "File size exceeds the 5 MB maximum limit.",
    };
  }

  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error:
        "Unsupported file type. Please upload a JPEG, PNG, WebP, GIF photo or PDF document.",
    };
  }

  // Construct storage path: issueId/uploaderId_timestamp_filename
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${issueId}/${user.id}_${Date.now()}_${sanitizedFileName}`;

  // Read file ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage private bucket 'issue-attachments'
  const { error: storageErr } = await supabase.storage
    .from("issue-attachments")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageErr) {
    return {
      success: false,
      error: `Storage upload failed: ${storageErr.message}`,
    };
  }

  // Insert metadata record into public.issue_attachments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachmentsTable = (supabase as any).from("issue_attachments");
  const { data: insertedRecord, error: dbErr } = await attachmentsTable
    .insert({
      issue_id: issueId,
      uploader_id: user.id,
      file_name: file.name,
      file_path: storagePath,
      file_type: file.type,
      file_size: file.size,
    })
    .select(`
      *,
      uploader:profiles!issue_attachments_uploader_id_fkey (first_name, last_name)
    `)
    .single();

  if (dbErr) {
    // Rollback storage upload if DB insert fails
    await supabase.storage.from("issue-attachments").remove([storagePath]);
    return {
      success: false,
      error: `Database metadata record failed: ${dbErr.message}`,
    };
  }

  // Log immutable timeline event: attachment_added
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");
  await updatesTable.insert({
    issue_id: issueId,
    changed_by: user.id,
    old_status: null,
    new_status: issue.status || "reported",
    event_type: "attachment_added",
    notes: `Uploaded attachment file '${file.name}' (${(file.size / 1024).toFixed(1)} KB).`,
  });

  // Generate 60-minute signed URL for immediate view
  const { data: signedData } = await supabase.storage
    .from("issue-attachments")
    .createSignedUrl(storagePath, 3600);

  const resultAttachment: AttachmentWithSignedUrl = {
    ...insertedRecord,
    signed_url: signedData?.signedUrl || null,
  };

  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: resultAttachment };
}

/**
 * Server Action: Fetch authorized attachments with signed access URLs for an issue
 */
export async function getIssueAttachmentsAction(
  issueId: string
): Promise<IssueActionResult<AttachmentWithSignedUrl[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachmentsTable = (supabase as any).from("issue_attachments");

  const { data: records, error } = await attachmentsTable
    .select(`
      *,
      uploader:profiles!issue_attachments_uploader_id_fkey (first_name, last_name)
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  // Generate 60-minute signed access URLs for each file
  const attachmentsWithUrls: AttachmentWithSignedUrl[] = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (records || []).map(async (att: any) => {
      const { data: signedData } = await supabase.storage
        .from("issue-attachments")
        .createSignedUrl(att.file_path, 3600);

      return {
        ...att,
        signed_url: signedData?.signedUrl || null,
      };
    })
  );

  return { success: true, data: attachmentsWithUrls };
}

/**
 * Server Action: Delete an issue attachment file (Uploader or Staff ONLY)
 */
export async function deleteIssueAttachmentAction(
  attachmentId: string
): Promise<IssueActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!attachmentId) {
    return { success: false, error: "Attachment ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachmentsTable = (supabase as any).from("issue_attachments");

  const { data: att } = await attachmentsTable
    .select("id, issue_id, uploader_id, file_path")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!att) {
    return { success: false, error: "Attachment record not found." };
  }

  // Authorization check: Uploader OR staff/admin
  const isUploader = att.uploader_id === user.id;
  const isStaff = ["admin", "warden"].includes(role);

  if (!isUploader && !isStaff) {
    return {
      success: false,
      error: "Unauthorized: You can only delete attachments uploaded by yourself.",
    };
  }

  // Remove from Supabase Storage
  await supabase.storage.from("issue-attachments").remove([att.file_path]);

  // Remove from Database
  await attachmentsTable.delete().eq("id", attachmentId);

  revalidatePath(`/issues/${att.issue_id}`);

  return { success: true, data: null };
}

export type TimelineEventType =
  | "issue_created"
  | "status_changed"
  | "assignment_changed"
  | "priority_changed"
  | "progress_update"
  | "resolution"
  | "attachment_added";

export interface IssueTimelineEvent {
  id: string;
  issue_id: string;
  event_type: TimelineEventType;
  old_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  created_at: string;
  changed_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * Server Action: Fetch chronological activity timeline events for an issue
 */
export async function getIssueActivityTimelineAction(
  issueId: string,
  sortAsc: boolean = true
): Promise<IssueActionResult<IssueTimelineEvent[]>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");

  const { data, error } = await updatesTable
    .select(`
      id,
      issue_id,
      event_type,
      old_status,
      new_status,
      notes,
      created_at,
      changed_by:profiles!issue_updates_changed_by_fkey (id, first_name, last_name, email)
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: sortAsc });

  if (error) {
    return { success: false, error: error.message };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineEvents: IssueTimelineEvent[] = (data || []).map((item: any) => ({
    id: item.id,
    issue_id: item.issue_id,
    event_type: (item.event_type as TimelineEventType) || "status_changed",
    old_status: item.old_status,
    new_status: item.new_status,
    notes: item.notes,
    created_at: item.created_at,
    changed_by: item.changed_by || null,
  }));

  return { success: true, data: timelineEvents };
}

export interface DetailedIssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: {
      name: string;
    } | null;
  } | null;
}

/**
 * Server Action: Post a comment on a maintenance issue
 */
export async function addIssueCommentAction({
  issueId,
  content,
  isInternal = false,
}: {
  issueId: string;
  content: string;
  isInternal?: boolean;
}): Promise<IssueActionResult<DetailedIssueComment>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  const trimmedContent = content?.trim() || "";
  if (!trimmedContent) {
    return { success: false, error: "Comment content cannot be empty." };
  }

  if (trimmedContent.length > 2000) {
    return {
      success: false,
      error: "Comment content exceeds the maximum allowed 2000 characters.",
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");
  const { data: issue } = await issuesTable
    .select("id, reporter_id, status")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) {
    return { success: false, error: "Target maintenance issue not found." };
  }

  // Authorization check: Students can ONLY comment on their own reported issues
  if (role === "student" && issue.reporter_id !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You can only comment on issues reported by you.",
    };
  }

  // Enforce that students cannot post internal staff notes
  const effectiveIsInternal = role === "student" ? false : isInternal;

  // Insert comment record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsTable = (supabase as any).from("issue_comments");
  const { data: insertedComment, error: commentErr } = await commentsTable
    .insert({
      issue_id: issueId,
      author_id: user.id,
      content: trimmedContent,
      is_internal: effectiveIsInternal,
    })
    .select(`
      *,
      author:profiles!issue_comments_author_id_fkey (
        id,
        first_name,
        last_name,
        email,
        role:roles!profiles_role_id_fkey (name)
      )
    `)
    .single();

  if (commentErr) {
    return {
      success: false,
      error: `Failed to post comment: ${commentErr.message}`,
    };
  }

  // Log timeline event: progress_update
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatesTable = (supabase as any).from("issue_updates");
  await updatesTable.insert({
    issue_id: issueId,
    changed_by: user.id,
    old_status: null,
    new_status: issue.status || "reported",
    event_type: "progress_update",
    notes: `Added ${effectiveIsInternal ? "internal staff note" : "comment"}: "${trimmedContent.slice(0, 80)}${trimmedContent.length > 80 ? "..." : ""}"`,
  });

  // Trigger notification for issue reporter
  if (!effectiveIsInternal && issue.reporter_id && issue.reporter_id !== user.id) {
    await createNotificationInternal({
      userId: issue.reporter_id,
      title: "New Comment on Maintenance Ticket",
      message: `New comment added: "${trimmedContent.slice(0, 50)}${trimmedContent.length > 50 ? "..." : ""}"`,
      type: "issue_commented",
      issueId,
      actorUserId: user.id,
    });
  }

  revalidatePath(`/issues/${issueId}`);

  return { success: true, data: insertedComment as DetailedIssueComment };
}

/**
 * Server Action: Fetch comments for a maintenance issue
 */
export async function getIssueCommentsAction(
  issueId: string
): Promise<IssueActionResult<DetailedIssueComment[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsTable = (supabase as any).from("issue_comments");

  let query = commentsTable
    .select(`
      *,
      author:profiles!issue_comments_author_id_fkey (
        id,
        first_name,
        last_name,
        email,
        role:roles!profiles_role_id_fkey (name)
      )
    `)
    .eq("issue_id", issueId);

  // If user is student, hide internal staff notes
  if (role === "student") {
    query = query.eq("is_internal", false);
  }

  const { data: comments, error } = await query.order("created_at", {
    ascending: true,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (comments || []) as DetailedIssueComment[] };
}

/**
 * Server Action: Delete an issue comment (Author or Staff ONLY)
 */
export async function deleteIssueCommentAction(
  commentId: string
): Promise<IssueActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return { success: false, error: "Authentication required." };
  }

  if (!commentId) {
    return { success: false, error: "Comment ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsTable = (supabase as any).from("issue_comments");

  const { data: comment } = await commentsTable
    .select("id, issue_id, author_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment) {
    return { success: false, error: "Comment record not found." };
  }

  // Authorization check: Author or staff/admin
  const isAuthor = comment.author_id === user.id;
  const isStaff = ["admin", "warden"].includes(role);

  if (!isAuthor && !isStaff) {
    return {
      success: false,
      error: "Unauthorized: You can only delete comments created by yourself.",
    };
  }

  await commentsTable.delete().eq("id", commentId);

  revalidatePath(`/issues/${comment.issue_id}`);

  return { success: true, data: null };
}

export interface AffectedStudentInfo {
  id: string;
  student_id: string;
  created_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roll_number?: string | null;
  } | null;
}

export interface AffectedSummary {
  count: number;
  isUserAffected: boolean;
  students: AffectedStudentInfo[];
}

/**
 * Server Action: Toggle "I'm Affected Too" status for a student on an issue
 */
export async function toggleAffectedStatusAction(
  issueId: string
): Promise<IssueActionResult<{ isAffected: boolean; count: number }>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const affectedTable = (supabase as any).from("issue_affected_students");

  // Check if student has already indicated affected status
  const { data: existing } = await affectedTable
    .select("id")
    .eq("issue_id", issueId)
    .eq("student_id", user.id)
    .maybeSingle();

  let isAffected = false;

  if (existing) {
    // Unmark / remove
    await affectedTable.delete().eq("id", existing.id);
    isAffected = false;
  } else {
    // Mark as affected
    const { error: insertErr } = await affectedTable.insert({
      issue_id: issueId,
      student_id: user.id,
    });

    if (insertErr) {
      return {
        success: false,
        error: `Failed to mark affected status: ${insertErr.message}`,
      };
    }
    isAffected = true;
  }

  // Count total affected students for this issue
  const { count } = await affectedTable
    .select("id", { count: "exact", head: true })
    .eq("issue_id", issueId);

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  return {
    success: true,
    data: { isAffected, count: count || 0 },
  };
}

/**
 * Server Action: Get affected count, caller affected status, and affected student list
 */
export async function getIssueAffectedDetailsAction(
  issueId: string
): Promise<IssueActionResult<AffectedSummary>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const affectedTable = (supabase as any).from("issue_affected_students");

  const { data: records, error } = await affectedTable
    .select(`
      id,
      student_id,
      created_at,
      student:profiles!issue_affected_students_student_id_fkey (
        id,
        first_name,
        last_name,
        email,
        roll_number
      )
    `)
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const affectedList = (records || []) as AffectedStudentInfo[];
  const isUserAffected = affectedList.some((item) => item.student_id === user.id);

  return {
    success: true,
    data: {
      count: affectedList.length,
      isUserAffected,
      students: affectedList,
    },
  };
}

/**
 * Server Action: Background / Idempotent SLA Escalation Processor
 * Scans active issues past SLA deadline that haven't been escalated yet.
 */
export async function processSlaEscalationsAction(): Promise<
  IssueActionResult<{ processedCount: number; escalatedIssueIds: string[] }>
> {
  const supabase = await createServerClient();
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  // Query active (non-resolved) issues where sla_deadline < now AND is_escalated = false
  const { data: overdueIssues, error } = await issuesTable
    .select("id, title, priority, status, reporter_id, sla_deadline")
    .neq("status", "resolved")
    .eq("is_escalated", false)
    .lt("sla_deadline", nowIso);

  if (error) {
    return { success: false, error: error.message };
  }

  if (!overdueIssues || overdueIssues.length === 0) {
    return {
      success: true,
      data: { processedCount: 0, escalatedIssueIds: [] },
    };
  }

  const escalatedIds: string[] = [];

  // Fetch staff profiles for notification targets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffProfiles } = await (supabase as any)
    .from("profiles")
    .select("id");

  for (const issue of overdueIssues) {
    // 1. Mark issue as overdue & escalated
    const { error: updateErr } = await issuesTable
      .update({
        is_overdue: true,
        is_escalated: true,
        sla_breached_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", issue.id);

    if (updateErr) continue;

    escalatedIds.push(issue.id);

    // 2. Insert timeline record in issue_updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatesTable = (supabase as any).from("issue_updates");
    await updatesTable.insert({
      issue_id: issue.id,
      changed_by: null,
      old_status: issue.status,
      new_status: issue.status,
      event_type: "issue_escalated",
      notes: `Automatic SLA breach escalation: Issue surpassed its ${issue.priority} priority resolution target.`,
    });

    // 3. Find active assigned technician (if any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentsTable = (supabase as any).from("issue_assignments");
    const { data: assignment } = await assignmentsTable
      .select("assigned_to")
      .eq("issue_id", issue.id)
      .eq("status", "active")
      .maybeSingle();

    if (assignment?.assigned_to) {
      await createNotificationInternal({
        userId: assignment.assigned_to,
        title: "🚨 SLA Deadline Breached",
        message: `Assigned ticket '${issue.title}' has breached its SLA deadline and was escalated to management.`,
        type: "issue_escalated",
        issueId: issue.id,
      });
    }

    // 4. Notify staff & wardens
    if (staffProfiles && Array.isArray(staffProfiles)) {
      for (const staff of staffProfiles) {
        if (staff.id !== assignment?.assigned_to) {
          await createNotificationInternal({
            userId: staff.id,
            title: "🚨 Urgent SLA Breach Escalated",
            message: `Ticket '${issue.title}' (${issue.priority.toUpperCase()} priority) breached SLA resolution deadline.`,
            type: "issue_escalated",
            issueId: issue.id,
          });
        }
      }
    }

    revalidatePath(`/issues/${issue.id}`);
  }

  revalidatePath("/issues");

  return {
    success: true,
    data: {
      processedCount: escalatedIds.length,
      escalatedIssueIds: escalatedIds,
    },
  };
}

export interface IssueRelationSuggestion {
  id: string;
  source_issue_id: string;
  target_issue_id: string;
  similarity_score: number;
  relation_type: "suggested_duplicate" | "confirmed_related" | "dismissed";
  created_at: string;
  target_issue?: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    hostel?: { name: string; code: string } | null;
    room?: { room_number: string } | null;
  } | null;
}

/**
 * Server Action: Analyze an issue against existing active issues using ML embeddings & similarity scoring.
 */
export async function analyzeRelatedIssuesAction(
  issueId: string
): Promise<IssueActionResult<number>> {
  if (!issueId) return { success: false, error: "Issue ID is required." };

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  // 1. Fetch source issue
  const { data: sourceIssue } = await issuesTable
    .select("id, title, description, category, hostel_id, room_id")
    .eq("id", issueId)
    .maybeSingle();

  if (!sourceIssue || !sourceIssue.description) {
    return { success: true, data: 0 };
  }

  // 2. Fetch source issue embedding from Python ML Service
  const sourceEmbedding = await fetchTextEmbedding(
    sourceIssue.title || "",
    sourceIssue.description
  );

  if (!sourceEmbedding) {
    // Graceful fallback if ML service is offline
    return { success: true, data: 0 };
  }

  // 3. Fetch candidate active issues (non-resolved, non-source)
  const { data: candidateIssues } = await issuesTable
    .select("id, title, description, category, hostel_id, room_id")
    .neq("id", issueId)
    .neq("status", "resolved")
    .limit(30);

  if (!candidateIssues || candidateIssues.length === 0) {
    return { success: true, data: 0 };
  }

  let suggestionsFound = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relationsTable = (supabase as any).from("issue_relations");

  // 4. Compare source against each candidate
  for (const candidate of candidateIssues) {
    const candidateEmbedding = await fetchTextEmbedding(
      candidate.title || "",
      candidate.description || ""
    );

    if (!candidateEmbedding) continue;

    const baseCosine = calculateCosineSimilarity(sourceEmbedding, candidateEmbedding);
    const sameCategory = sourceIssue.category === candidate.category;
    const sameRoom = Boolean(sourceIssue.room_id && sourceIssue.room_id === candidate.room_id);
    const sameHostel = Boolean(sourceIssue.hostel_id && sourceIssue.hostel_id === candidate.hostel_id);

    const score = computeCompositeSimilarity({
      baseSimilarity: baseCosine,
      sameCategory,
      sameRoom,
      sameHostel,
    });

    // If similarity score >= 0.65, record suggestion
    if (score >= 0.65) {
      await relationsTable.upsert(
        {
          source_issue_id: issueId,
          target_issue_id: candidate.id,
          similarity_score: Math.round(score * 100) / 100,
          relation_type: "suggested_duplicate",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_issue_id,target_issue_id" }
      );
      suggestionsFound++;
    }
  }

  revalidatePath(`/issues/${issueId}`);
  return { success: true, data: suggestionsFound };
}

/**
 * Server Action: Get related issue suggestions for staff review
 */
export async function getRelatedIssueSuggestionsAction(
  issueId: string
): Promise<IssueActionResult<IssueRelationSuggestion[]>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relationsTable = (supabase as any).from("issue_relations");

  const { data: records, error } = await relationsTable
    .select(`
      id,
      source_issue_id,
      target_issue_id,
      similarity_score,
      relation_type,
      created_at,
      target_issue:issues!issue_relations_target_issue_id_fkey (
        id,
        title,
        description,
        category,
        status,
        priority,
        created_at,
        hostel:hostels!issues_hostel_id_fkey (name, code),
        room:rooms!issues_room_id_fkey (room_number)
      )
    `)
    .eq("source_issue_id", issueId)
    .neq("relation_type", "dismissed")
    .order("similarity_score", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (records || []) as IssueRelationSuggestion[] };
}

/**
 * Server Action: Confirm a suggested related issue
 */
export async function confirmRelatedIssueAction(
  relationId: string
): Promise<IssueActionResult<null>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!relationId) {
    return { success: false, error: "Relation ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relationsTable = (supabase as any).from("issue_relations");

  const { data: rel } = await relationsTable
    .select("id, source_issue_id")
    .eq("id", relationId)
    .maybeSingle();

  if (!rel) {
    return { success: false, error: "Relation record not found." };
  }

  await relationsTable
    .update({
      relation_type: "confirmed_related",
      updated_at: new Date().toISOString(),
    })
    .eq("id", relationId);

  revalidatePath(`/issues/${rel.source_issue_id}`);
  return { success: true, data: null };
}

/**
 * Server Action: Dismiss a suggested related issue
 */
export async function dismissRelatedIssueAction(
  relationId: string
): Promise<IssueActionResult<null>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!relationId) {
    return { success: false, error: "Relation ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relationsTable = (supabase as any).from("issue_relations");

  const { data: rel } = await relationsTable
    .select("id, source_issue_id")
    .eq("id", relationId)
    .maybeSingle();

  if (!rel) {
    return { success: false, error: "Relation record not found." };
  }

  await relationsTable
    .update({
      relation_type: "dismissed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", relationId);

  revalidatePath(`/issues/${rel.source_issue_id}`);
  return { success: true, data: null };
}

/**
 * Server Action: Deterministically detects whether an issue is part of a recurring pattern.
 */
export async function detectRecurringIssueAction(
  issueId: string
): Promise<IssueActionResult<import("@/lib/issues/recurring-detector").RecurringAnalysisResult>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!issueId) {
    return { success: false, error: "Issue ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issuesTable = (supabase as any).from("issues");

  // 1. Fetch target issue
  const { data: targetIssue, error: targetErr } = await issuesTable
    .select(`
      id,
      room_id,
      hostel_id,
      category,
      created_at,
      title,
      status,
      priority,
      room:rooms!issues_room_id_fkey(room_number),
      hostel:hostels!issues_hostel_id_fkey(name)
    `)
    .eq("id", issueId)
    .maybeSingle();

  if (targetErr || !targetIssue) {
    return { success: false, error: targetErr?.message || "Issue not found." };
  }

  // 2. Query historical issues for the same room or hostel
  let query = issuesTable
    .select(`
      id,
      room_id,
      hostel_id,
      category,
      created_at,
      title,
      status,
      priority,
      room:rooms!issues_room_id_fkey(room_number),
      hostel:hostels!issues_hostel_id_fkey(name)
    `)
    .neq("id", issueId);

  if (targetIssue.room_id) {
    query = query.eq("room_id", targetIssue.room_id);
  } else if (targetIssue.hostel_id) {
    query = query.eq("hostel_id", targetIssue.hostel_id);
  } else {
    // If no room or hostel, return default no recurrence
    const { analyzeRecurringPattern } = await import("@/lib/issues/recurring-detector");
    return {
      success: true,
      data: analyzeRecurringPattern(targetIssue, []),
    };
  }

  const { data: history } = await query.order("created_at", { ascending: false }).limit(50);

  const { analyzeRecurringPattern } = await import("@/lib/issues/recurring-detector");
  const result = analyzeRecurringPattern(targetIssue, history || []);

  return { success: true, data: result };
}
