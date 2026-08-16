"use client";

import { useState } from "react";
import {
  ShieldCheck,
  User,
  Clock,
  Code,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAuditLogsAction,
  assignUserRoleAction,
  type AuditLogRow,
} from "@/app/admin/audit-actions";

interface AuditLogsViewerProps {
  initialLogs: AuditLogRow[];
}

export function AuditLogsViewer({ initialLogs }: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>(initialLogs);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admin Role Management Form State
  const [roleEmail, setRoleEmail] = useState("");
  const [targetRole, setTargetRole] = useState<"admin" | "warden" | "student">("warden");
  const [roleMessage, setRoleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const handleFilterChange = async (filter: string) => {
    setActionFilter(filter);
    setLoading(true);
    try {
      const res = await getAuditLogsAction(filter);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogsAction(actionFilter);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEmail.trim()) return;

    setIsSubmittingRole(true);
    setRoleMessage(null);

    try {
      const res = await assignUserRoleAction({
        targetEmail: roleEmail.trim(),
        newRole: targetRole,
      });

      if (res.success) {
        setRoleMessage({
          type: "success",
          text: res.error || `Successfully assigned '${targetRole.toUpperCase()}' role to ${roleEmail.trim()}.`,
        });
        setRoleEmail("");
      } else {
        setRoleMessage({
          type: "error",
          text: res.error || "Failed to assign user role.",
        });
      }
    } catch {
      setRoleMessage({
        type: "error",
        text: "An error occurred while updating user role.",
      });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" /> System Audit & Access Control
          </div>
          <h1 className="text-2xl font-extrabold text-white">Application Audit & User Roles</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage administrative role assignments and inspect server security event trails.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          className="gap-2 border-slate-800 text-slate-300 hover:text-white shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Trail
        </Button>
      </div>

      {/* Admin Role Assignment Panel */}
      <Card className="glass-card border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Grant Admin or Warden Privileges</h2>
        </div>
        <p className="text-xs text-slate-400">
          Enter an email address to assign <strong>Warden</strong> or <strong>Admin</strong> privileges. Default signups automatically receive the <strong>Student</strong> role (unless using default administrative email rules).
        </p>

        <form onSubmit={handleAssignRoleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="email"
            required
            placeholder="Enter user email (e.g. warden@campus.edu)"
            value={roleEmail}
            onChange={(e) => setRoleEmail(e.target.value)}
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as "admin" | "warden" | "student")}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="warden">Warden Role</option>
            <option value="admin">Admin Role</option>
            <option value="student">Student Role</option>
          </select>

          <Button type="submit" disabled={isSubmittingRole} variant="glow" className="text-xs py-2">
            {isSubmittingRole ? "Assigning..." : "Assign Role"}
          </Button>
        </form>

        {roleMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              roleMessage.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            {roleMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{roleMessage.text}</span>
          </div>
        )}
      </Card>

      {/* Action Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "All Actions" },
          { id: "leave.reviewed", label: "Leave Reviews" },
          { id: "announcement.created", label: "Announcements" },
          { id: "issue.status_changed", label: "Issue Updates" },
          { id: "issue.assigned", label: "Issue Assignments" },
          { id: "allocation.changed", label: "Allocations" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleFilterChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              actionFilter === tab.id
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <Card className="glass-card border-slate-800 text-center py-12 p-6">
          <ShieldCheck className="h-10 w-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Audit Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No audit log events recorded under the selected action filter.
          </p>
        </Card>
      ) : (
        <div className="glass-card border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table aria-label="Audit Logs Table" className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const actorName =
                    log.actor?.full_name || log.actor?.email?.split("@")[0] || "System Actor";

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {log.created_at.replace("T", " ").split(".")[0]}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-indigo-400 font-bold font-mono text-[11px] shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-snug">
                              {actorName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {log.actor?.role || "user"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <ActionBadge action={log.action} />
                      </td>

                      <td className="p-4 whitespace-nowrap font-mono text-slate-300">
                        <span className="capitalize">{log.target_type}</span>
                        {log.target_id && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                            ID: {log.target_id.slice(0, 8)}...
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
                        >
                          <Code className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Payload</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="mt-2 text-left p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto max-w-xs ml-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  switch (action) {
    case "leave.reviewed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
          leave.reviewed
        </span>
      );
    case "announcement.created":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
          announcement.created
        </span>
      );
    case "issue.status_changed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          issue.status_changed
        </span>
      );
    case "issue.assigned":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
          issue.assigned
        </span>
      );
    case "user.role_changed":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
          user.role_changed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
          {action}
        </span>
      );
  }
}
