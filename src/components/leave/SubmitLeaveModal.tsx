"use client";

import { useState } from "react";
import { Calendar, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createLeaveRequestAction,
  type LeaveRequestRow,
} from "@/app/leave/leave-actions";

interface SubmitLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRequest: LeaveRequestRow) => void;
}

export function SubmitLeaveModal({
  isOpen,
  onClose,
  onSuccess,
}: SubmitLeaveModalProps) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanedReason = reason.trim();
    if (cleanedReason.length < 5) {
      setErrorMessage("Please enter a reason for leave (at least 5 characters).");
      return;
    }

    if (endDate < startDate) {
      setErrorMessage("End date must be on or after start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createLeaveRequestAction({
        startDate,
        endDate,
        reason: cleanedReason,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
        setReason("");
      } else {
        setErrorMessage(res.error || "Failed to submit leave application.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Apply for Student Leave</h2>
              <p className="text-xs text-slate-400">
                Submit a formal leave application to your hostel warden.
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="leave-start-date" className="text-xs font-medium text-slate-300">Start Date</Label>
              <Input
                id="leave-start-date"
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                required
                className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-end-date" className="text-xs font-medium text-slate-300">End Date</Label>
              <Input
                id="leave-end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leave-reason" className="text-xs font-medium text-slate-300">Reason for Leave</Label>
            <textarea
              id="leave-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed explanation for your leave request..."
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
