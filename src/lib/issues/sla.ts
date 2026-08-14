import type { IssuePriority, IssueStatus } from "./workflow";

/**
 * SLA Target Resolution Durations (in minutes)
 */
export const SLA_TARGET_MINUTES: Record<IssuePriority, number> = {
  urgent: 30,
  high: 120, // 2 hours
  medium: 1440, // 24 hours
  low: 4320, // 72 hours
};

export type SlaStatus =
  | "within_sla"
  | "at_risk"
  | "overdue"
  | "resolved_within_sla"
  | "resolved_overdue";

export interface SlaInfo {
  status: SlaStatus;
  targetMinutes: number;
  deadline: Date;
  timeRemainingMs: number;
  isOverdue: boolean;
  isResolved: boolean;
  formattedStatus: string;
  formattedRemaining: string;
}

/**
 * Deterministically calculates SLA deadline date from creation timestamp & priority
 */
export function calculateSlaDeadline(
  createdAt: string | Date,
  priority: IssuePriority
): Date {
  const createdDate = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const targetMinutes = SLA_TARGET_MINUTES[priority] || 1440;
  return new Date(createdDate.getTime() + targetMinutes * 60 * 1000);
}

/**
 * Formats a duration in milliseconds to human readable string (e.g. "1h 45m", "15m", "2d 4h")
 */
export function formatSlaDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const totalMins = Math.floor(absMs / (60 * 1000));
  const days = Math.floor(totalMins / (24 * 60));
  const hours = Math.floor((totalMins % (24 * 60)) / 60);
  const mins = totalMins % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Computes deterministic SLA status and remaining time for a maintenance issue
 */
export function getSlaInfo(
  issue: {
    created_at: string;
    priority: IssuePriority;
    status: IssueStatus;
    sla_deadline?: string | null;
    updated_at?: string | null;
  },
  nowMs: number = Date.now()
): SlaInfo {
  const targetMinutes = SLA_TARGET_MINUTES[issue.priority] || 1440;
  const deadline = issue.sla_deadline
    ? new Date(issue.sla_deadline)
    : calculateSlaDeadline(issue.created_at, issue.priority);

  const isResolved = issue.status === "resolved";

  if (isResolved) {
    const resolvedDate = issue.updated_at ? new Date(issue.updated_at) : new Date();
    const wasResolvedOnTime = resolvedDate.getTime() <= deadline.getTime();
    const diffMs = deadline.getTime() - resolvedDate.getTime();

    return {
      status: wasResolvedOnTime ? "resolved_within_sla" : "resolved_overdue",
      targetMinutes,
      deadline,
      timeRemainingMs: diffMs,
      isOverdue: !wasResolvedOnTime,
      isResolved: true,
      formattedStatus: wasResolvedOnTime ? "Resolved (Within SLA)" : "Resolved (SLA Breached)",
      formattedRemaining: wasResolvedOnTime
        ? `${formatSlaDuration(diffMs)} ahead of deadline`
        : `Breached SLA by ${formatSlaDuration(diffMs)}`,
    };
  }

  const timeRemainingMs = deadline.getTime() - nowMs;
  const totalWindowMs = targetMinutes * 60 * 1000;
  const ratioRemaining = timeRemainingMs / totalWindowMs;

  const isOverdue = timeRemainingMs <= 0;
  const isAtRisk = !isOverdue && ratioRemaining < 0.25;

  let status: SlaStatus = "within_sla";
  let formattedStatus = "On Track";

  if (isOverdue) {
    status = "overdue";
    formattedStatus = "OVERDUE (SLA Breached)";
  } else if (isAtRisk) {
    status = "at_risk";
    formattedStatus = "At Risk (< 25% time left)";
  }

  return {
    status,
    targetMinutes,
    deadline,
    timeRemainingMs,
    isOverdue,
    isResolved: false,
    formattedStatus,
    formattedRemaining: isOverdue
      ? `OVERDUE by ${formatSlaDuration(timeRemainingMs)}`
      : `${formatSlaDuration(timeRemainingMs)} remaining`,
  };
}
