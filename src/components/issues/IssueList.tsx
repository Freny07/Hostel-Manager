"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReportIssueModal } from "./ReportIssueModal";
import type { DetailedIssue, StudentResidenceContext } from "@/app/issues/issue-actions";

interface IssueListProps {
  initialIssues: DetailedIssue[];
  residenceContext: StudentResidenceContext | null;
  isStudent: boolean;
}

export function IssueList({
  initialIssues,
  residenceContext,
  isStudent,
}: IssueListProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal & Toast state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return initialIssues.filter((issue) => {
      const hostel = issue.hostel;
      const room = issue.room;
      const reporter = issue.reporter;

      const searchStr = `${issue.title} ${issue.description} ${issue.category} ${hostel?.name || ""} ${room?.room_number || ""} ${issue.location_description || ""} ${reporter?.first_name || ""} ${reporter?.last_name || ""}`.toLowerCase();

      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || issue.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [initialIssues, searchTerm, statusFilter, categoryFilter]);

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
              Maintenance Issues
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {initialIssues.length} Reported
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isStudent
              ? "Report plumbing, electrical, internet, or appliance issues to your hostel administration."
              : "View and track maintenance issue tickets submitted across campus hostels."}
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

      {/* Control Bar: Search & Category/Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search issues by title, category, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-900/80 border-slate-800 focus:border-amber-500 text-slate-100 placeholder:text-slate-500"
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
              <Filter className="h-3.5 w-3.5" /> Status:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "reported", label: "Reported" },
              { id: "assigned", label: "Assigned" },
              { id: "investigating", label: "Investigating" },
              { id: "repair_scheduled", label: "Scheduled" },
              { id: "resolved", label: "Resolved" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  statusFilter === st.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {st.label}
              </button>
            ))}
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

            return (
              <Card
                key={issue.id}
                className="glass-card border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Bar: Title & Category */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-xl">
                        {getCategoryEmoji(issue.category)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                          {issue.title}
                        </h3>
                        <p className="text-xs text-slate-400 capitalize mt-0.5 font-mono">
                          Category: {issue.category.replace("_", " ")}
                        </p>
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

                  {/* Location Info */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Building2 className="h-3.5 w-3.5 text-amber-400" />
                      {hostel?.name || "Hostel"} {room?.room_number ? `• Room ${room.room_number}` : ""}
                    </span>

                    {issue.location_description && (
                      <span className="flex items-center gap-1 text-slate-400 text-[11px] italic">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {issue.location_description}
                      </span>
                    )}
                  </div>

                  {/* Reporter & Date Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                    <span>
                      Reported by:{" "}
                      <strong className="text-slate-300">
                        {reporter ? `${reporter.first_name} ${reporter.last_name}` : "Student"}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
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
            <h3 className="text-lg font-bold text-white">No Maintenance Issues Reported</h3>
            <p className="text-slate-400 text-sm">
              You currently have 0 maintenance requests submitted. Click below if you need to report a repair or facility issue.
            </p>
          </div>
          <Button
            onClick={() => setIsReportModalOpen(true)}
            className="gap-2 mt-2 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Report First Maintenance Issue
          </Button>
        </div>
      ) : (
        /* Empty State: Filter returned 0 results */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <p className="text-slate-300 text-sm font-medium">
            No maintenance issues match your search criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filters
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
    </div>
  );
}
