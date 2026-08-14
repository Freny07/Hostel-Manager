"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Wrench,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  User,
  Flame,
  AlertTriangle,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  FileText,
  UserCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateStatusModal } from "./UpdateStatusModal";
import { AssignStaffModal } from "./AssignStaffModal";
import { IssueAttachmentsSection } from "./IssueAttachmentsSection";
import { IssueActivityTimeline } from "./IssueActivityTimeline";
import { IssueCommentsSection } from "./IssueCommentsSection";
import { AffectedStudentsBadge } from "./AffectedStudentsBadge";
import { SlaBadge } from "./SlaBadge";
import { RelatedIssuesSuggestions } from "./RelatedIssuesSuggestions";
import { RecurringIssueBadge } from "./RecurringIssueBadge";
import { getSlaInfo } from "@/lib/issues/sla";
import {
  claimIssueTaskAction,
  type DetailedIssue,
} from "@/app/issues/issue-actions";
import { type IssueStatus } from "@/lib/issues/workflow";

interface IssueDetailViewProps {
  issue: DetailedIssue;
  isStudent: boolean;
}

export function IssueDetailView({ issue, isStudent }: IssueDetailViewProps) {
  const router = useRouter();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const hostel = issue.hostel;
  const room = issue.room;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floor = (room as any)?.floor;
  const reporter = issue.reporter;
  const activeAssignment = issue.assignments?.find((a) => a.status === "active") || issue.assignments?.[0];

  const slaInfo = getSlaInfo({
    created_at: issue.created_at,
    priority: issue.priority,
    status: issue.status,
    sla_deadline: issue.sla_deadline,
    updated_at: issue.updated_at,
  });

  const [isClaiming, setIsClaiming] = useState(false);

  // Scoped Supabase Realtime subscription for single issue
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`realtime_issue_detail_${issue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
          filter: `id=eq.${issue.id}`,
        },
        () => {
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issue_assignments",
          filter: `issue_id=eq.${issue.id}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issue.id, router]);

  const handleClaimTask = async () => {
    setIsClaiming(true);
    try {
      const res = await claimIssueTaskAction({
        issueId: issue.id,
        notes: "Technician claimed task and commenced investigation.",
      });
      if (res.success) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setIsClaiming(false);
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "plumbing":
        return "🚰";
      case "electrical":
        return "⚡";
      case "carpentry":
        return "🔨";
      case "appliance":
        return "🔌";
      case "cleaning":
        return "🧹";
      case "internet":
        return "🌐";
      case "security":
        return "🛡️";
      case "pest_control":
        return "🪲";
      case "other":
      default:
        return "📌";
    }
  };

  const getStatusBadge = (status: DetailedIssue["status"]) => {
    switch (status) {
      case "reported":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1.5 py-1 px-3">
            <Clock className="h-3.5 w-3.5" /> Reported
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300 gap-1.5 py-1 px-3">
            <User className="h-3.5 w-3.5 text-indigo-400" /> Assigned
          </Badge>
        );
      case "investigating":
        return (
          <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30 gap-1.5 py-1 px-3">
            <Wrench className="h-3.5 w-3.5 text-violet-400" /> Investigating
          </Badge>
        );
      case "repair_scheduled":
        return (
          <Badge variant="secondary" className="bg-teal-500/20 text-teal-300 border-teal-500/30 gap-1.5 py-1 px-3">
            <Calendar className="h-3.5 w-3.5 text-teal-400" /> Repair Scheduled
          </Badge>
        );
      case "resolved":
      default:
        return (
          <Badge variant="success" className="gap-1.5 py-1 px-3">
            <CheckCircle className="h-3.5 w-3.5" /> Resolved
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: DetailedIssue["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            <Flame className="h-3.5 w-3.5 text-rose-400" /> Urgent Priority
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-orange-950 text-orange-300 border border-orange-800">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-400" /> High Priority
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-900 text-amber-300 border border-slate-800">
            Medium Priority
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
            Low Priority
          </span>
        );
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Back Navigation & Staff Controls Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/issues">
          <Button variant="outline" size="sm" className="gap-2 text-xs text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            Back to Issues Directory
          </Button>
        </Link>

        {!isStudent && (
          <div className="flex flex-wrap items-center gap-3">
            {(issue.status === "reported" || issue.status === "assigned") && (
              <Button
                onClick={handleClaimTask}
                disabled={isClaiming}
                variant="outline"
                className="gap-2 text-xs font-semibold border-amber-500/30 text-amber-300 hover:bg-amber-950/40 hover:text-white"
              >
                {isClaiming ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                  <Wrench className="h-4 w-4 text-amber-400" />
                )}
                Claim / Accept Task
              </Button>
            )}
            <Button
              onClick={() => setIsAssignModalOpen(true)}
              variant="outline"
              className="gap-2 text-xs font-semibold border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40 hover:text-white"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" />
              Assign Maintenance Staff
            </Button>
            <Button
              onClick={() => setIsUpdateModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Update Issue Status
            </Button>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="glass-card border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Hash className="h-3.5 w-3.5 text-amber-400" />
            <span>Ticket ID: {issue.id.slice(0, 13)}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {issue.is_escalated && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 shadow-md animate-pulse">
                🚨 ESCALATED
              </span>
            )}
            {getStatusBadge(issue.status)}
            {getPriorityBadge(issue.priority)}
            <SlaBadge
              createdAt={issue.created_at}
              priority={issue.priority}
              status={issue.status}
              slaDeadline={issue.sla_deadline}
              updatedAt={issue.updated_at}
            />
          </div>
        </div>

        <div className="flex items-start gap-4 pt-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 text-2xl shadow-md">
            {getCategoryEmoji(issue.category)}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-xs text-slate-400 capitalize font-mono">
                Category: {issue.category.replace("_", " ")}
              </p>
              <AffectedStudentsBadge issueId={issue.id} isStudent={isStudent} />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                Issue Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {issue.description}
              </p>
            </CardContent>
          </Card>

          {/* Location & Facility Info */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-400" />
                Hostel & Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-1">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Hostel Name</span>
                  <span className="text-base font-bold text-white flex items-center gap-2">
                    {hostel?.name || "N/A"}
                    {hostel?.code && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                        {hostel.code}
                      </span>
                    )}
                  </span>
                  {hostel?.address && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 pt-1">
                      <MapPin className="h-3 w-3 text-indigo-400" /> {hostel.address}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-1">
                  <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Floor & Room Unit</span>
                  <span className="text-base font-bold text-white flex items-center gap-2">
                    {floor ? `Floor ${floor.floor_number}` : "Floor Level N/A"}
                    {room?.room_number ? ` • Room ${room.room_number}` : ""}
                  </span>
                  {room?.room_type && (
                    <p className="text-xs text-slate-400 capitalize pt-1">
                      Type: {room.room_type} room
                    </p>
                  )}
                </div>
              </div>

              {issue.location_description && (
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3.5 flex items-start gap-2.5 text-xs text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200 block">Specific Location Details:</span>
                    <span className="text-slate-300">{issue.location_description}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recurring Issue Detection Banner (Staff / Wardens ONLY) */}
          {!isStudent && <RecurringIssueBadge issueId={issue.id} />}

          {/* ML Related Issues Suggestions (Staff / Wardens ONLY) */}
          {!isStudent && <RelatedIssuesSuggestions issueId={issue.id} />}

          {/* Attachments Section */}
          <IssueAttachmentsSection issueId={issue.id} />

          {/* Discussion & Comments Section */}
          <IssueCommentsSection issueId={issue.id} isStudent={isStudent} />

          {/* Immutable Activity Timeline */}
          <IssueActivityTimeline issueId={issue.id} />

          {/* Assignment Information */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-400" />
                Technician / Staff Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {activeAssignment && activeAssignment.assigned_to ? (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">Assigned Technician</span>
                      <span className="text-base font-bold text-white">
                        {activeAssignment.assigned_to.first_name} {activeAssignment.assigned_to.last_name}
                      </span>
                    </div>
                    <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300">
                      Active Assignment
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{activeAssignment.assigned_to.email}</span>
                    </div>
                    {activeAssignment.assigned_to.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{activeAssignment.assigned_to.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-900 flex items-center justify-between">
                    <span>Assigned Date: {formatDate(activeAssignment.assigned_at)}</span>
                    {activeAssignment.assigned_by && (
                      <span>Assigned by: {activeAssignment.assigned_by.first_name} {activeAssignment.assigned_by.last_name}</span>
                    )}
                  </div>

                  {activeAssignment.notes && (
                    <p className="text-xs text-slate-300 italic pt-1">
                      &quot;{activeAssignment.notes}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 mx-auto">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Pending Assignment</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This ticket is currently queued. Hostel maintenance administration will assign a qualified technician shortly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Sidebar Meta) */}
        <div className="space-y-6">
          {/* SLA Tracking Card */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>SLA Target & Status</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400 font-mono">Priority Target:</span>
                <span className="font-semibold text-white capitalize">
                  {issue.priority} ({slaInfo.targetMinutes < 60 ? `${slaInfo.targetMinutes}m` : `${slaInfo.targetMinutes / 60}h`})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400 font-mono">Target Deadline:</span>
                <span className="font-mono text-slate-200">
                  {formatDate(slaInfo.deadline.toISOString())}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-mono">Current Status:</span>
                <SlaBadge
                  createdAt={issue.created_at}
                  priority={issue.priority}
                  status={issue.status}
                  slaDeadline={issue.sla_deadline}
                  updatedAt={issue.updated_at}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reporter Profile */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400" />
                Reporter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Student Name</span>
                <span className="text-sm font-bold text-white">
                  {reporter ? `${reporter.first_name} ${reporter.last_name}` : "Student"}
                </span>
              </div>

              {reporter?.roll_number && (
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px]">Roll Number</span>
                  <span className="font-mono text-slate-200 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 inline-block">
                    {reporter.roll_number}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block uppercase font-mono text-[10px]">Email Address</span>
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {reporter?.email || "N/A"}
                </span>
              </div>

              {reporter?.phone && (
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[10px]">Contact Phone</span>
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    {reporter.phone}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps Timeline */}
          <Card className="glass-card border-slate-800">
            <CardHeader className="border-b border-slate-800/80 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-400" />
                Timestamps & Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Reported Date</span>
                  <span className="text-slate-200 font-medium">{formatDate(issue.created_at)}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Last Updated</span>
                  <span className="text-slate-200 font-medium">{formatDate(issue.updated_at)}</span>
                </div>
              </div>

              {issue.resolved_at && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px]">Resolved Date</span>
                    <span className="text-emerald-300 font-medium">{formatDate(issue.resolved_at)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security & Access Notice */}
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 space-y-1 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>RLS Protected Record</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {isStudent
                ? "This ticket view is restricted to your authenticated student profile."
                : "Staff administrative view."}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Update Status & Assignment Modals */}
      {!isStudent && (
        <>
          <UpdateStatusModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            issueId={issue.id}
            currentStatus={issue.status as IssueStatus}
            issueTitle={issue.title}
            onSuccess={() => {
              router.refresh();
            }}
          />

          <AssignStaffModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            issueId={issue.id}
            issueTitle={issue.title}
            onSuccess={() => {
              router.refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
