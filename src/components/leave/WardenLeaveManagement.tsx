"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building2,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  reviewLeaveRequestAction,
  type LeaveRequestRow,
} from "@/app/leave/leave-actions";

interface WardenLeaveManagementProps {
  initialRequests: LeaveRequestRow[];
}

export function WardenLeaveManagement({
  initialRequests,
}: WardenLeaveManagementProps) {
  const [requests, setRequests] = useState<LeaveRequestRow[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  // Review Dialog State
  const [reviewingTarget, setReviewingTarget] = useState<{
    request: LeaveRequestRow;
    decision: "approved" | "rejected";
  } | null>(null);

  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingTarget) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await reviewLeaveRequestAction({
        requestId: reviewingTarget.request.id,
        decision: reviewingTarget.decision,
        reviewerNotes,
      });

      if (res.success) {
        setRequests((prev) =>
          prev.map((item) =>
            item.id === reviewingTarget.request.id
              ? {
                  ...item,
                  status: reviewingTarget.decision,
                  reviewed_at: new Date().toISOString(),
                  reviewer_notes: reviewerNotes.trim() || null,
                }
              : item
          )
        );
        setReviewingTarget(null);
        setReviewerNotes("");
      } else {
        setErrorMessage(res.error || "Failed to submit leave decision.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error submitting leave decision."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.ceil((e - s) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" /> Warden Administrative Management
          </div>
          <h1 className="text-2xl font-extrabold text-white">Student Leave Approvals</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, approve, or reject student leave requests with recorded decision logs.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "pending", label: "Pending Review" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "all", label: "All Requests" },
        ].map((tab) => {
          const count =
            tab.id === "all"
              ? requests.length
              : requests.filter((r) => r.status === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Requests Cards List */}
      {filteredRequests.length === 0 ? (
        <Card className="glass-card border-slate-800 text-center py-12 p-6">
          <Calendar className="h-10 w-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Leave Requests Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no student leave requests under the &quot;{filterStatus}&quot; status filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const days = calculateDays(req.start_date, req.end_date);
            const studentName =
              req.student?.full_name || req.student?.email?.split("@")[0] || "Student";

            return (
              <Card
                key={req.id}
                className="glass-card border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-400" />
                          {studentName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({req.student?.email})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                        <span className="font-mono font-bold text-indigo-300 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {req.start_date} to {req.end_date} ({days} {days === 1 ? "Day" : "Days"})
                        </span>

                        {req.hostel && (
                          <span className="font-mono text-slate-400 flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-amber-400" />
                            {req.hostel.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <WardenStatusBadge status={req.status} />

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              setReviewingTarget({ request: req, decision: "approved" })
                            }
                            className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setReviewingTarget({ request: req, decision: "rejected" })
                            }
                            className="gap-1 text-xs h-8"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason Text */}
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-200 block mb-0.5">
                      Student Reason:
                    </span>
                    <p className="leading-relaxed">{req.reason}</p>
                  </div>

                  {/* Decision Logs (if reviewed) */}
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
                          Decision recorded by: {req.reviewer?.full_name || req.reviewer?.email || "Warden"}
                        </span>
                        {req.reviewed_at && (
                          <span>On {req.reviewed_at.split("T")[0]}</span>
                        )}
                      </div>
                      {req.reviewer_notes && (
                        <p className="text-xs pt-1 font-sans">
                          <span className="font-semibold">Reviewer Notes: </span>
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

      {/* Review Dialog Modal */}
      {reviewingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {reviewingTarget.decision === "approved" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400" />
                )}
                {reviewingTarget.decision === "approved"
                  ? "Approve Leave Request"
                  : "Reject Leave Request"}
              </h2>
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Confirm decision for student{" "}
                <strong className="text-white">
                  {reviewingTarget.request.student?.full_name || "Student"}
                </strong>{" "}
                ({reviewingTarget.request.start_date} to {reviewingTarget.request.end_date}):
              </p>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-slate-400 italic">
                &quot;{reviewingTarget.request.reason}&quot;
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="leave-notes" className="text-xs font-medium text-slate-300">
                    Optional Reviewer Remarks / Notes
                  </Label>
                  <textarea
                    id="leave-notes"
                    rows={3}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter any instructions or remarks for the student..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setReviewingTarget(null);
                      setReviewerNotes("");
                    }}
                    disabled={isSubmitting}
                    className="border-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`gap-2 text-white font-semibold shadow-md ${
                      reviewingTarget.decision === "approved"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                        : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Confirm {reviewingTarget.decision.toUpperCase()}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WardenStatusBadge({ status }: { status: LeaveRequestRow["status"] }) {
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
          Cancelled
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
