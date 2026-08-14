"use client";

import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { getSlaInfo } from "@/lib/issues/sla";
import type { IssuePriority, IssueStatus } from "@/lib/issues/workflow";

interface SlaBadgeProps {
  createdAt: string;
  priority: IssuePriority;
  status: IssueStatus;
  slaDeadline?: string | null;
  updatedAt?: string | null;
  showIconOnly?: boolean;
}

export function SlaBadge({
  createdAt,
  priority,
  status,
  slaDeadline,
  updatedAt,
  showIconOnly = false,
}: SlaBadgeProps) {
  const sla = getSlaInfo({
    created_at: createdAt,
    priority,
    status,
    sla_deadline: slaDeadline,
    updated_at: updatedAt,
  });

  const getStyleClasses = () => {
    switch (sla.status) {
      case "overdue":
        return "bg-rose-950/90 text-rose-300 border-rose-800 shadow-rose-950/50 animate-pulse";
      case "resolved_overdue":
        return "bg-rose-950/40 text-rose-400 border-rose-900/60";
      case "at_risk":
        return "bg-amber-950/90 text-amber-300 border-amber-800 shadow-amber-950/50";
      case "resolved_within_sla":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/80";
      case "within_sla":
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  const getIcon = () => {
    switch (sla.status) {
      case "overdue":
        return <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
      case "resolved_overdue":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
      case "at_risk":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-bounce" />;
      case "resolved_within_sla":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
      case "within_sla":
      default:
        return <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />;
    }
  };

  if (showIconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center p-1 rounded-full border ${getStyleClasses()}`}
        title={`SLA: ${sla.formattedStatus} (${sla.formattedRemaining})`}
      >
        {getIcon()}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all shadow-sm ${getStyleClasses()}`}
      title={`Target SLA Window: ${sla.targetMinutes} minutes. Deadline: ${sla.deadline.toLocaleString()}`}
    >
      {getIcon()}
      <span className="font-mono">{sla.formattedRemaining}</span>
    </span>
  );
}
