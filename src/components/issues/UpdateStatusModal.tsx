"use client";

import { useState } from "react";
import { X, Loader2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAllowedNextStatuses,
  STATUS_LABELS,
  type IssueStatus,
} from "@/lib/issues/workflow";
import {
  updateIssueStatusAction,
  type IssueActionResult,
  type IssueRow,
} from "@/app/issues/issue-actions";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: string;
  currentStatus: IssueStatus;
  issueTitle: string;
  onSuccess: () => void;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  issueId,
  currentStatus,
  issueTitle,
  onSuccess,
}: UpdateStatusModalProps) {
  const allowedNextStatuses = getAllowedNextStatuses(currentStatus);

  const [targetStatus, setTargetStatus] = useState<IssueStatus | "">(
    allowedNextStatuses[0] || ""
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTargetStatus(allowedNextStatuses[0] || "");
      setNotes("");
      setServerError(null);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!targetStatus) {
      setServerError("Please select a target status to transition to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res: IssueActionResult<IssueRow> = await updateIssueStatusAction({
        issueId,
        newStatus: targetStatus as IssueStatus,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setServerError(res.error || "Failed to update status.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Update Issue Status</h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[220px]">
                {issueTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Current Status Badge */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono uppercase tracking-wider">Current Status</span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold px-2.5 py-1 capitalize">
              {STATUS_LABELS[currentStatus] || currentStatus}
            </Badge>
          </div>

          {/* Allowed Target Status Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="targetStatus" className="text-xs font-semibold text-slate-300">
              New Status <span className="text-rose-400">*</span>
            </Label>

            {allowedNextStatuses.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No further status transitions allowed from this state.
              </p>
            ) : (
              <select
                id="targetStatus"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as IssueStatus)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {allowedNextStatuses.map((st) => (
                  <option key={st} value={st}>
                    Move to: {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Transition Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
              Transition Note / Action Log <span className="text-slate-500">(Optional)</span>
            </Label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Assigned electrician John Doe, Parts ordered, Leak repaired..."
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || allowedNextStatuses.length === 0}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
