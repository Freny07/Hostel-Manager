"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UserPlus, AlertCircle, RefreshCw, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getUnassignedStudentsAction,
  getAvailableBedsAction,
  createAllocationAction,
  type UnassignedStudentOption,
  type AvailableBedOption,
  type AllocationActionResult,
  type AllocationRow,
} from "@/app/allocations/allocation-actions";

interface AssignStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignStudentModal({
  isOpen,
  onClose,
  onSuccess,
}: AssignStudentModalProps) {
  const [students, setStudents] = useState<UnassignedStudentOption[]>([]);
  const [beds, setBeds] = useState<AvailableBedOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [notes, setNotes] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [refetchIndex, setRefetchIndex] = useState(0);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedStudentId("");
      setSelectedBedId("");
      setNotes("");
      setSubmitError(null);
      setOptionsError(null);
      setIsLoadingOptions(true);
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      Promise.all([
        getUnassignedStudentsAction(),
        getAvailableBedsAction(),
      ])
        .then(([studentsRes, bedsRes]) => {
          if (!isMounted) return;
          if (studentsRes.success && studentsRes.data) {
            setStudents(studentsRes.data);
          } else {
            setOptionsError(studentsRes.error || "Failed to load unassigned students.");
          }

          if (bedsRes.success && bedsRes.data) {
            setBeds(bedsRes.data);
          } else {
            setOptionsError(
              (prev) => prev || bedsRes.error || "Failed to load available beds."
            );
          }
          setIsLoadingOptions(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setOptionsError(
            err instanceof Error ? err.message : "Error loading allocation options."
          );
          setIsLoadingOptions(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, refetchIndex]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedStudentId) {
      setSubmitError("Please select a student to assign.");
      return;
    }
    if (!selectedBedId) {
      setSubmitError("Please select an available bed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res: AllocationActionResult<AllocationRow> = await createAllocationAction(
        selectedStudentId,
        selectedBedId,
        notes
      );

      if (!res.success) {
        setSubmitError(res.error || "Failed to create allocation.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Assign Student to Bed</h2>
              <p className="text-xs text-slate-400">Select an unassigned resident and vacant bed slot</p>
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
          {optionsError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center justify-between text-rose-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{optionsError}</span>
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
                <p className="font-medium">Allocation Error</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {isLoadingOptions ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <p className="text-sm">Loading available students and beds...</p>
            </div>
          ) : (
            <>
              {/* Select Student */}
              <div className="space-y-1.5">
                <Label htmlFor="student_select" className="text-xs font-semibold text-slate-300">
                  Select Resident Student <span className="text-rose-400">*</span>
                </Label>
                <select
                  id="student_select"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={isSubmitting || students.length === 0}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">
                    {students.length === 0 ? "No unassigned students available" : "-- Choose a Student --"}
                  </option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} {st.roll_number ? `(${st.roll_number})` : ""} - {st.email}
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="text-xs text-amber-400">
                    All registered students currently have active bed allocations.
                  </p>
                )}
              </div>

              {/* Select Bed */}
              <div className="space-y-1.5">
                <Label htmlFor="bed_select" className="text-xs font-semibold text-slate-300">
                  Select Available Bed <span className="text-rose-400">*</span>
                </Label>
                <select
                  id="bed_select"
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  disabled={isSubmitting || beds.length === 0}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">
                    {beds.length === 0 ? "No vacant beds available" : "-- Choose a Vacant Bed --"}
                  </option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.hostel_code}] {b.hostel_name} → Floor {b.floor_number} → Room {b.room_number} → Bed {b.bed_label} ({b.room_type})
                    </option>
                  ))}
                </select>
                {beds.length === 0 && (
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> No vacant beds available. Create beds in Hostel Management first.
                  </p>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
                  Allocation Remarks / Notes <span className="text-slate-500">(Optional)</span>
                </Label>
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="e.g. Standard term room assignment, medical preference"
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
              disabled={isSubmitting || isLoadingOptions || students.length === 0 || beds.length === 0}
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Bed"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
