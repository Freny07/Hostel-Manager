/**
 * Centralized Issue Status Transition Workflow
 * 
 * Defines valid status state transitions and helper utilities.
 * Allowed flow: Reported -> Assigned -> Investigating -> Repair Scheduled -> Resolved
 */

export type IssuePriority = "low" | "medium" | "high" | "urgent";

export type IssueStatus =
  | "reported"
  | "assigned"
  | "investigating"
  | "repair_scheduled"
  | "resolved";

export const ALLOWED_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported: ["assigned", "investigating"],
  assigned: ["investigating", "repair_scheduled", "resolved"],
  investigating: ["repair_scheduled", "resolved", "assigned"],
  repair_scheduled: ["resolved", "investigating"],
  resolved: ["investigating"], // Re-open
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  reported: "Reported",
  assigned: "Assigned",
  investigating: "Investigating",
  repair_scheduled: "Repair Scheduled",
  resolved: "Resolved",
};

/**
 * Validates whether a status transition from currentStatus to targetStatus is allowed.
 */
export function isValidStatusTransition(
  currentStatus: IssueStatus,
  targetStatus: IssueStatus
): boolean {
  if (currentStatus === targetStatus) return false;
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowedNext ? allowedNext.includes(targetStatus) : false;
}

/**
 * Returns array of allowed target statuses for a given current status.
 */
export function getAllowedNextStatuses(currentStatus: IssueStatus): IssueStatus[] {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
}
