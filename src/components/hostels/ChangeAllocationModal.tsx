"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ArrowRightLeft, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getAvailableBedsAction,
  changeAllocationAction,
  type AvailableBedOption,
  type DetailedAllocation,
  type AllocationActionResult,
  type AllocationRow,
} from "@/app/allocations/allocation-actions";

interface ChangeAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: DetailedAllocation | null;
  onSuccess: () => void;
}

export function ChangeAllocationModal({
  isOpen,
  onClose,
  allocation,
  onSuccess,
}: ChangeAllocationModalProps) {
  const [beds, setBeds] = useState<AvailableBedOption[]>([]);
  const [isLoadingBeds, setIsLoadingBeds] = useState(true);
  const [bedsError, setBedsError] = useState<string | null>(null);

  const [selectedBedId, setSelectedBedId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [refetchIndex, setRefetchIndex] = useState(0);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedBedId("");
      setNotes("");
      setSubmitError(null);
      setBedsError(null);
      setIsLoadingBeds(true);
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (isOpen && allocation) {
      getAvailableBedsAction()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setBeds(res.data);
          } else {
            setBedsError(res.error || "Failed to load available beds.");
          }
          setIsLoadingBeds(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setBedsError(err instanceof Error ? err.message : "Error loading available beds.");
          setIsLoadingBeds(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, allocation, refetchIndex]);

  if (!isOpen || !allocation) return null;

  const studentName = allocation.student
    ? `${allocation.student.first_name} ${allocation.student.last_name}`
    : "Student";

  const currentHostel = allocation.bed?.room?.floor?.hostel?.name || "Hostel";
  const currentRoom = allocation.bed?.room?.room_number || "N/A";
  const currentBed = allocation.bed?.bed_label || "N/A";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedBedId) {
      setSubmitError("Please select a new bed for the transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res: AllocationActionResult<AllocationRow> = await changeAllocationAction(
        allocation.id,
        selectedBedId,
        notes
      );

      if (!res.success) {
        setSubmitError(res.error || "Failed to transfer bed allocation.");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Transfer / Change Bed</h2>
              <p className="text-xs text-slate-400">Reassign {studentName} to a new bed</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Allocation Summary */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-1 text-xs">
            <span className="text-slate-400 uppercase font-mono tracking-wider">Current Assignment</span>
            <p className="text-sm font-semibold text-white">
              {currentHostel} → Room {currentRoom} → Bed {currentBed}
            </p>
          </div>

          {bedsError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center justify-between text-rose-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{bedsError}</span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setRefetchIndex((i) => i + 1)} className="gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          {submitError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Transfer Failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {isLoadingBeds ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <p className="text-xs">Loading available replacement beds...</p>
            </div>
          ) : (
            <>
              {/* Select Replacement Bed */}
              <div className="space-y-1.5">
                <Label htmlFor="new_bed_select" className="text-xs font-semibold text-slate-300">
                  Select Replacement Bed <span className="text-rose-400">*</span>
                </Label>
                <select
                  id="new_bed_select"
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  disabled={isSubmitting || beds.length === 0}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">
                    {beds.length === 0 ? "No vacant replacement beds available" : "-- Choose a Replacement Bed --"}
                  </option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.hostel_code}] {b.hostel_name} → Floor {b.floor_number} → Room {b.room_number} → Bed {b.bed_label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="transfer_notes" className="text-xs font-semibold text-slate-300">
                  Transfer Reason / Notes <span className="text-slate-500">(Optional)</span>
                </Label>
                <textarea
                  id="transfer_notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g. Student requested room swap, maintenance relocation"
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingBeds || beds.length === 0}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
