"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DetailedAllocation, AllocationActionResult } from "@/app/allocations/allocation-actions";

interface RemoveAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: DetailedAllocation | null;
  onConfirmRemove: (
    allocationId: string,
    reason: "cancelled" | "completed",
    notes?: string
  ) => Promise<AllocationActionResult>;
}

export function RemoveAllocationDialog({
  isOpen,
  onClose,
  allocation,
  onConfirmRemove,
}: RemoveAllocationDialogProps) {
  const [reason, setReason] = useState<"completed" | "cancelled">("completed");
  const [notes, setNotes] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !allocation) return null;

  const studentName = allocation.student
    ? `${allocation.student.first_name} ${allocation.student.last_name}`
    : "Student";

  const bedLabel = allocation.bed?.bed_label || "N/A";
  const roomNumber = allocation.bed?.room?.room_number || "N/A";
  const hostelName = allocation.bed?.room?.floor?.hostel?.name || "Hostel";

  const handleRemove = async () => {
    setError(null);
    setIsRemoving(true);
    try {
      const res = await onConfirmRemove(allocation.id, reason, notes);
      if (!res.success) {
        setError(res.error || "Failed to terminate allocation.");
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while terminating allocation.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">End Bed Allocation</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-3 text-rose-300 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Action Failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to end bed allocation for <strong className="text-white">{studentName}</strong>?
            </p>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1 text-xs">
              <p className="text-slate-400 font-medium">Assigned Bed</p>
              <p className="text-white font-semibold">
                {hostelName} → Room {roomNumber} → Bed {bedLabel}
              </p>
            </div>
            <p className="text-xs text-slate-400">
              This will free Bed {bedLabel} back to <strong>Available</strong> status for future assignments.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="termination_reason" className="text-xs font-semibold text-slate-300">
              Termination Reason <span className="text-rose-400">*</span>
            </Label>
            <select
              id="termination_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as "completed" | "cancelled")}
              disabled={isRemoving}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="completed">Completed (Academic term ended / Checkout)</option>
              <option value="cancelled">Cancelled (Withdrawal / Cancellation)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="removal_notes" className="text-xs font-semibold text-slate-300">
              Notes / Remarks <span className="text-slate-500">(Optional)</span>
            </Label>
            <textarea
              id="removal_notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRemoving}
              placeholder="e.g. Student cleared dues, vacated room"
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <Button variant="outline" onClick={onClose} disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ending...
              </>
            ) : (
              "Confirm End Allocation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
