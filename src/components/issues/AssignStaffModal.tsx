"use client";

import { useState, useEffect } from "react";
import { X, Loader2, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  assignIssueAction,
  getMaintenanceStaffUsersAction,
  type StaffUserOption,
} from "@/app/issues/issue-actions";

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: string;
  issueTitle: string;
  onSuccess: () => void;
}

export function AssignStaffModal({
  isOpen,
  onClose,
  issueId,
  issueTitle,
  onSuccess,
}: AssignStaffModalProps) {
  const [staffUsers, setStaffUsers] = useState<StaffUserOption[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const [assignedToId, setAssignedToId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setAssignedToId("");
      setNotes("");
      setServerError(null);
      setIsLoadingStaff(true);
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      getMaintenanceStaffUsersAction()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setStaffUsers(res.data);
            if (res.data.length > 0) {
              setAssignedToId(res.data[0].id);
            }
          }
          setIsLoadingStaff(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setIsLoadingStaff(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!assignedToId) {
      setServerError("Please select a staff user to assign this ticket.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignIssueAction({
        issueId,
        assignedToId,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setServerError(res.error || "Failed to assign issue.");
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
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Assign Maintenance Staff</h2>
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

          {/* Target Staff User Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="assignedToId" className="text-xs font-semibold text-slate-300">
              Select Maintenance Staff Member <span className="text-rose-400">*</span>
            </Label>

            {isLoadingStaff ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Loading staff profiles...
              </div>
            ) : staffUsers.length === 0 ? (
              <p className="text-xs text-rose-400 py-2">
                No staff profiles found in the database.
              </p>
            ) : (
              <select
                id="assignedToId"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                    {u.role_name ? ` • ${u.role_name.toUpperCase()}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assignment Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
              Assignment Instructions / Notes <span className="text-slate-500">(Optional)</span>
            </Label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please inspect sink leak by 2 PM. Replacement tap stored in West Hall supply room..."
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
              disabled={isSubmitting || staffUsers.length === 0}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning Staff...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
