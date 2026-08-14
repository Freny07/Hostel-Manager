"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Plus,
  Loader2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitLeaveModal } from "./SubmitLeaveModal";
import {
  cancelLeaveRequestAction,
  type LeaveRequestRow,
} from "@/app/leave/leave-actions";

interface StudentLeaveListProps {
  initialRequests: LeaveRequestRow[];
}

export function StudentLeaveList({ initialRequests }: StudentLeaveListProps) {
  const [requests, setRequests] = useState<LeaveRequestRow[]>(initialRequests);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = async (requestId: string) => {
    setCancellingId(requestId);
    setErrorMessage(null);
    try {
      const res = await cancelLeaveRequestAction(requestId);
      if (res.success) {
        setRequests((prev) =>
          prev.map((item) =>
            item.id === requestId ? { ...item, status: "cancelled" } : item
          )
        );
      } else {
        setErrorMessage(res.error || "Failed to cancel leave request.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error cancelling leave request."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleNewSuccess = (newRequest: LeaveRequestRow) => {
    setRequests((prev) => [newRequest, ...prev]);
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.ceil((e - s) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" /> Personal Leave Portal
          </div>
          <h1 className="text-2xl font-extrabold text-white">My Leave Requests</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and submit formal leave applications for hostel absence.
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitOpen(true)}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" /> Apply for Leave
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Leave Requests Cards List */}
      {requests.length === 0 ? (
        <Card className="glass-card border-slate-800 text-center py-12 p-6">
          <Calendar className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">No Leave Requests Submitted</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            You currently have no active or historical leave applications. Click below to submit a new leave request.
          </p>
          <Button onClick={() => setIsSubmitOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Apply for Leave
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const days = calculateDays(req.start_date, req.end_date);
            return (
              <Card
                key={req.id}
                className="glass-card border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-400" />
                          {req.start_date} to {req.end_date}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                          {days} {days === 1 ? "Day" : "Days"} Duration
                        </span>
                      </div>

                      {req.hostel && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Building2 className="h-3 w-3 text-amber-400" />
                          Hostel: {req.hostel.name} ({req.hostel.code})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />

                      {req.status === "pending" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(req.id)}
                          disabled={cancellingId === req.id}
                          className="gap-1 text-xs text-slate-400 hover:text-rose-300"
                        >
                          {cancellingId === req.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Ban className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reason Text */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200 block mb-0.5">Reason for Leave:</span>
                    <p className="leading-relaxed">{req.reason}</p>
                  </div>

                  {/* Reviewer Information & Notes (if reviewed) */}
                  {(req.status === "approved" || req.status === "rejected") && (
                    <div
                      className={`rounded-xl p-3.5 border text-xs space-y-1 ${
                        req.status === "approved"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : "bg-rose-950/20 border-rose-500/30 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span>
                          Reviewed by: {req.reviewer?.full_name || req.reviewer?.email || "Hostel Warden"}
                        </span>
                        {req.reviewed_at && (
                          <span>On {req.reviewed_at.split("T")[0]}</span>
                        )}
                      </div>
                      {req.reviewer_notes && (
                        <p className="text-xs pt-1 font-sans">
                          <span className="font-semibold">Warden Notes: </span>
                          {req.reviewer_notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <SubmitLeaveModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={handleNewSuccess}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveRequestRow["status"] }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
          <XCircle className="h-3.5 w-3.5 text-rose-400" /> Rejected
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
          <Ban className="h-3.5 w-3.5 text-slate-500" /> Cancelled
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
          <Clock className="h-3.5 w-3.5 text-amber-400" /> Pending Review
        </span>
      );
  }
}
