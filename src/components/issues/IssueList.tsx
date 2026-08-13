"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle,
  MapPin,
  RefreshCw,
  User,
  History,
  Layers,
  GraduationCap,
  Mail,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportIssueModal } from "./ReportIssueModal";
import { UpdateStatusModal } from "./UpdateStatusModal";
import { AssignStaffModal } from "./AssignStaffModal";
import { AffectedStudentsBadge } from "./AffectedStudentsBadge";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  getHostelsListAction,
  type DetailedIssue,
  type StudentResidenceContext,
  type HostelsOption,
} from "@/app/issues/issue-actions";
import { type IssueStatus } from "@/lib/issues/workflow";

interface IssueListProps {
  initialIssues: DetailedIssue[];
  residenceContext: StudentResidenceContext | null;
  isStudent: boolean;
  hostelsList?: HostelsOption[];
}

export function IssueList({
  initialIssues,
  residenceContext,
  isStudent,
  hostelsList: initialHostels,
}: IssueListProps) {
  const router = useRouter();

  // Hostels list for filter
  const [hostels, setHostels] = useState<HostelsOption[]>(initialHostels || []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [hostelFilter, setHostelFilter] = useState<string>("all");

  // Modal & Toast state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIssueForUpdate, setSelectedIssueForUpdate] = useState<DetailedIssue | null>(null);
  const [selectedIssueForAssign, setSelectedIssueForAssign] = useState<DetailedIssue | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Supabase Realtime subscription for issues directory
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel("realtime_issues_directory")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
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
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    if (!initialHostels || initialHostels.length === 0) {
      getHostelsListAction().then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setHostels(res.data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialHostels]);

  // Filtered issues calculation
  const filteredIssues = useMemo(() => {
    return initialIssues.filter((issue) => {
      const hostel = issue.hostel;
      const room = issue.room;
      const reporter = issue.reporter;

      const searchStr = `${issue.title} ${issue.description} ${issue.category} ${hostel?.name || ""} ${room?.room_number || ""} ${issue.location_description || ""} ${reporter?.first_name || ""} ${reporter?.last_name || ""} ${reporter?.roll_number || ""}`.toLowerCase();

      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;
      const matchesHostel = hostelFilter === "all" || issue.hostel_id === hostelFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesHostel;
    });
  }, [initialIssues, searchTerm, statusFilter, priorityFilter, categoryFilter, hostelFilter]);

  // Summary Statistics
  const openIssuesCount = useMemo(() => {
    return initialIssues.filter((i) => i.status !== "resolved").length;
  }, [initialIssues]);

  const resolvedIssuesCount = useMemo(() => {
    return initialIssues.filter((i) => i.status === "resolved").length;
  }, [initialIssues]);

  const getStatusBadge = (status: DetailedIssue["status"]) => {
    switch (status) {
      case "reported":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1 py-1">
            <Clock className="h-3 w-3" /> Reported
          </Badge>
        );
      case "assigned":
        return (
          <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300 gap-1 py-1">
            <User className="h-3 w-3 text-indigo-400" /> Assigned
          </Badge>
        );
      case "investigating":
        return (
          <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30 gap-1 py-1">
            <Wrench className="h-3 w-3 text-violet-400" /> Investigating
          </Badge>
        );
      case "repair_scheduled":
        return (
          <Badge variant="secondary" className="bg-teal-500/20 text-teal-300 border-teal-500/30 gap-1 py-1">
            <Calendar className="h-3 w-3 text-teal-400" /> Scheduled
          </Badge>
        );
      case "resolved":
      default:
        return (
          <Badge variant="success" className="gap-1 py-1">
            <CheckCircle className="h-3 w-3" /> Resolved
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: DetailedIssue["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
            <Flame className="h-3 w-3 text-rose-400" /> Urgent
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800">
            <AlertTriangle className="h-3 w-3 text-orange-400" /> High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
            Medium
          </span>
        );
      case "low":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            Low
          </span>
        );
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

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setHostelFilter("all");
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isStudent ? "My Reported Issues" : "Warden Maintenance Management"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {initialIssues.length} {initialIssues.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isStudent
              ? "Track, manage, and view the progress of your reported campus repair tickets."
              : "Review reported maintenance requests across campus hostels, update ticket statuses, and coordinate repairs."}
          </p>
        </div>

        <Button
          onClick={() => setIsReportModalOpen(true)}
          size="lg"
          className="gap-2 self-start md:self-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 font-semibold"
        >
          <Plus className="h-5 w-5" />
          Report Maintenance Issue
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-slate-800 p-2">
          <CardHeader className="py-2 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Total Reported</p>
              <CardTitle className="text-2xl font-bold text-white mt-1">{initialIssues.length}</CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="glass-card border-slate-800 p-2">
          <CardHeader className="py-2 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Open / Pending</p>
              <CardTitle className="text-2xl font-bold text-white mt-1">{openIssuesCount}</CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="glass-card border-slate-800 p-2">
          <CardHeader className="py-2 flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Resolved</p>
              <CardTitle className="text-2xl font-bold text-white mt-1">{resolvedIssuesCount}</CardTitle>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Control Bar: Multi-Criteria Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by title, student name, roll number, hostel, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 focus:border-amber-500 text-slate-100 placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Reset Button */}
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" || hostelFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="gap-1.5 text-xs text-slate-400 border-slate-800 hover:text-white shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Filters
            </Button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${!isStudent ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3 pt-2 border-t border-slate-800/80`}>
          {/* Hostel Select (Staff Only) */}
          {!isStudent && (
            <div className="space-y-1">
              <label htmlFor="hostel_filter" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3 text-amber-400" /> Hostel Filter
              </label>
              <select
                id="hostel_filter"
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Campus Hostels</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Select */}
          <div className="space-y-1">
            <label htmlFor="status_filter" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3 text-indigo-400" /> Status Filter
            </label>
            <select
              id="status_filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="assigned">Assigned</option>
              <option value="investigating">Investigating</option>
              <option value="repair_scheduled">Repair Scheduled</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Select */}
          <div className="space-y-1">
            <label htmlFor="priority_filter" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" /> Priority Filter
            </label>
            <select
              id="priority_filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          {/* Category Select */}
          <div className="space-y-1">
            <label htmlFor="category_filter" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-3 w-3 text-violet-400" /> Category Filter
            </label>
            <select
              id="category_filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none capitalize"
            >
              <option value="all">All Categories</option>
              <option value="plumbing">🚰 Plumbing & Water</option>
              <option value="electrical">⚡ Electrical & Power</option>
              <option value="carpentry">🔨 Furniture & Carpentry</option>
              <option value="appliance">🔌 Appliances</option>
              <option value="cleaning">🧹 Housekeeping</option>
              <option value="internet">🌐 Wi-Fi & Internet</option>
              <option value="security">🛡️ Locks & Security</option>
              <option value="pest_control">🪲 Pest Control</option>
              <option value="other">📌 Other General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Grid / List */}
      {filteredIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIssues.map((issue) => {
            const hostel = issue.hostel;
            const room = issue.room;
            const reporter = issue.reporter;
            const isUpdatedLater = issue.updated_at && issue.updated_at !== issue.created_at;

            return (
              <Card
                key={issue.id}
                className="glass-card border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Bar: Title, Category Emoji, Status & Priority */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-xl">
                        {getCategoryEmoji(issue.category)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                          {issue.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[11px] text-slate-400 capitalize font-mono">
                            Category: {issue.category.replace("_", " ")}
                          </span>
                          <AffectedStudentsBadge issueId={issue.id} isStudent={isStudent} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(issue.status)}
                      {getPriorityBadge(issue.priority)}
                    </div>
                  </div>

                  {/* Description Box */}
                  <p className="text-xs text-slate-300 leading-relaxed rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5">
                    {issue.description}
                  </p>

                  {/* Location Info Box */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {hostel?.name || "Hostel"}
                        {hostel?.code ? ` (${hostel.code})` : ""}
                        {room?.room_number ? ` → Room ${room.room_number}` : ""}
                      </span>
                    </div>

                    {issue.location_description && (
                      <span className="flex items-center gap-1 text-slate-400 text-[11px] italic">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        {issue.location_description}
                      </span>
                    )}
                  </div>

                  {/* Reporter Details (Prominent for Wardens/Staff) */}
                  {!isStudent && reporter && (
                    <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/20 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-indigo-200">
                        <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="font-bold">
                          {reporter.first_name} {reporter.last_name}
                        </span>
                        {reporter.roll_number && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50 text-indigo-300">
                            {reporter.roll_number}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{reporter.email}</span>
                      </div>
                    </div>
                  )}

                  {/* Timestamps (Created & Updated) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Reported: <strong className="text-slate-200">{formatDate(issue.created_at)}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-indigo-400" />
                      <span>
                        Last update:{" "}
                        <strong className="text-slate-200">
                          {isUpdatedLater ? formatDateTime(issue.updated_at) : formatDate(issue.created_at)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                    {!isStudent ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIssueForAssign(issue)}
                          className="gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:bg-indigo-950/40 hover:text-white"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-indigo-400" /> Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIssueForUpdate(issue)}
                          className="gap-1.5 text-xs text-violet-300 border-violet-500/30 hover:bg-violet-950/40 hover:text-white"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-violet-400" /> Status
                        </Button>
                      </div>
                    ) : (
                      <div />
                    )}

                    <Link href={`/issues/${issue.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs text-amber-400 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-300">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : initialIssues.length === 0 ? (
        /* Empty State: No Issues Reported */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wrench className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No Maintenance Issues Reported Yet</h3>
            <p className="text-slate-400 text-sm">
              {isStudent
                ? "You currently have no maintenance or repair tickets logged."
                : "No maintenance requests have been logged in the hostel database."}
            </p>
          </div>
          <Button
            onClick={() => setIsReportModalOpen(true)}
            className="gap-2 mt-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Report New Maintenance Issue
          </Button>
        </div>
      ) : (
        /* Empty State: Filter returned 0 results */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <p className="text-slate-300 text-sm font-medium">
            No maintenance issues match your active filter criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllFilters}
            className="gap-1.5 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-950/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear & Reset Filters
          </Button>
        </div>
      )}

      {/* Report Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        residenceContext={residenceContext}
        onSuccess={() => {
          showNotification("success", "Maintenance issue report submitted successfully.");
          router.refresh();
        }}
      />

      {/* Staff Quick Status Update Modal */}
      {selectedIssueForUpdate && (
        <UpdateStatusModal
          isOpen={!!selectedIssueForUpdate}
          onClose={() => setSelectedIssueForUpdate(null)}
          issueId={selectedIssueForUpdate.id}
          currentStatus={selectedIssueForUpdate.status as IssueStatus}
          issueTitle={selectedIssueForUpdate.title}
          onSuccess={() => {
            showNotification("success", "Issue status updated successfully.");
            router.refresh();
          }}
        />
      )}

      {/* Staff Quick Assign Modal */}
      {selectedIssueForAssign && (
        <AssignStaffModal
          isOpen={!!selectedIssueForAssign}
          onClose={() => setSelectedIssueForAssign(null)}
          issueId={selectedIssueForAssign.id}
          issueTitle={selectedIssueForAssign.title}
          onSuccess={() => {
            showNotification("success", "Maintenance staff assigned successfully.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
