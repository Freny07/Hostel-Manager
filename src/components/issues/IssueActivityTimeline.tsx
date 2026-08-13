"use client";

import { useState, useEffect } from "react";
import {
  History,
  PlusCircle,
  RefreshCw,
  UserCheck,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowUpDown,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  getIssueActivityTimelineAction,
  type IssueTimelineEvent,
  type TimelineEventType,
} from "@/app/issues/issue-actions";
import { STATUS_LABELS, type IssueStatus } from "@/lib/issues/workflow";

interface IssueActivityTimelineProps {
  issueId: string;
}

export function IssueActivityTimeline({ issueId }: IssueActivityTimelineProps) {
  const [events, setEvents] = useState<IssueTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(false); // Default: Newest first

  const fetchTimeline = async (asc: boolean) => {
    setIsLoading(true);
    try {
      const res = await getIssueActivityTimelineAction(issueId, asc);
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getIssueActivityTimelineAction(issueId, sortAsc)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setEvents(res.data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueId, sortAsc]);

  // Scoped Supabase Realtime subscription for issue_updates timeline events
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`realtime_timeline_${issueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "issue_updates",
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          getIssueActivityTimelineAction(issueId, sortAsc).then((res) => {
            if (res.success && res.data) {
              setEvents(res.data);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, sortAsc]);

  const toggleSort = () => {
    const nextSort = !sortAsc;
    setSortAsc(nextSort);
    fetchTimeline(nextSort);
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getEventBadgeAndIcon = (type: TimelineEventType) => {
    switch (type) {
      case "issue_created":
        return {
          icon: <PlusCircle className="h-3.5 w-3.5 text-amber-400" />,
          label: "Ticket Created",
          badgeClass: "bg-amber-950/70 text-amber-300 border-amber-800/80",
          dotColor: "bg-amber-500",
        };
      case "assignment_changed":
        return {
          icon: <UserCheck className="h-3.5 w-3.5 text-violet-400" />,
          label: "Staff Assignment",
          badgeClass: "bg-violet-950/70 text-violet-300 border-violet-800/80",
          dotColor: "bg-violet-500",
        };
      case "attachment_added":
        return {
          icon: <Paperclip className="h-3.5 w-3.5 text-sky-400" />,
          label: "Attachment Uploaded",
          badgeClass: "bg-sky-950/70 text-sky-300 border-sky-800/80",
          dotColor: "bg-sky-500",
        };
      case "resolution":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
          label: "Issue Resolved",
          badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80",
          dotColor: "bg-emerald-500",
        };
      case "priority_changed":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />,
          label: "Priority Updated",
          badgeClass: "bg-rose-950/70 text-rose-300 border-rose-800/80",
          dotColor: "bg-rose-500",
        };
      case "progress_update":
        return {
          icon: <FileText className="h-3.5 w-3.5 text-blue-400" />,
          label: "Progress Note",
          badgeClass: "bg-blue-950/70 text-blue-300 border-blue-800/80",
          dotColor: "bg-blue-500",
        };
      case "status_changed":
      default:
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />,
          label: "Status Changed",
          badgeClass: "bg-indigo-950/70 text-indigo-300 border-indigo-800/80",
          dotColor: "bg-indigo-500",
        };
    }
  };

  return (
    <Card className="glass-card border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm font-bold text-white">
            Immutable Activity Timeline
          </CardTitle>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-1.5 text-xs text-slate-300 hover:text-white border-slate-800"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span>{sortAsc ? "Oldest First" : "Newest First"}</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Loading activity timeline...
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No recorded activity events for this ticket yet.
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {events.map((event) => {
              const meta = getEventBadgeAndIcon(event.event_type);

              return (
                <div key={event.id} className="relative space-y-1.5 text-xs">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full ${meta.dotColor} border-2 border-slate-900 shadow-sm`}
                  />

                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                      </span>

                      {event.new_status && event.event_type === "status_changed" && (
                        <span className="text-slate-300 font-medium">
                          to &quot;{STATUS_LABELS[event.new_status as IssueStatus] || event.new_status}&quot;
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Clock className="h-3 w-3 text-slate-600" />
                      <span>{formatDateTime(event.created_at)}</span>
                    </div>
                  </div>

                  {/* Actor Details */}
                  <p className="text-slate-400 text-[11px]">
                    Action by:{" "}
                    <strong className="text-slate-200">
                      {event.changed_by
                        ? `${event.changed_by.first_name} ${event.changed_by.last_name}`
                        : "System User"}
                    </strong>
                    {event.changed_by?.email && (
                      <span className="text-slate-500 font-mono text-[10px] ml-1">
                        ({event.changed_by.email})
                      </span>
                    )}
                  </p>

                  {/* Event Notes */}
                  {event.notes && (
                    <p className="text-slate-300 bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 leading-relaxed text-[11px] whitespace-pre-line">
                      {event.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
