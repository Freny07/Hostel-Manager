"use client";

import { useState } from "react";
import { X, Loader2, Bed, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BedRow, BedFormData, BedActionResult } from "@/app/hostels/bed-actions";

interface BedFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomLabel: string;
  bedToEdit: BedRow | null;
  onSubmit: (data: BedFormData) => Promise<BedActionResult<BedRow>>;
}

export function BedFormModal({
  isOpen,
  onClose,
  roomLabel,
  bedToEdit,
  onSubmit,
}: BedFormModalProps) {
  const [formData, setFormData] = useState<BedFormData>({
    bed_label: "",
    status: "available",
  });
  const [prevBed, setPrevBed] = useState<BedRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync prop changes during render without cascading useEffect renders
  if (bedToEdit !== prevBed) {
    setPrevBed(bedToEdit);
    setFormData({
      bed_label: bedToEdit?.bed_label || "",
      status: bedToEdit?.status || "available",
    });
    setFieldErrors({});
    setServerError(null);
  }

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.bed_label.trim()) {
      errors.bed_label = "Bed label is required.";
    } else if (formData.bed_label.trim().length > 10) {
      errors.bed_label = "Bed label must not exceed 10 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateLocal()) return;

    setIsSubmitting(true);
    try {
      const res = await onSubmit(formData);
      if (!res.success) {
        setServerError(res.error || "Failed to save bed.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        onClose();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "An unexpected error occurred.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <Bed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {bedToEdit ? "Edit Bed" : "Add New Bed"}
              </h2>
              <p className="text-xs text-slate-400">Target Room: {roomLabel}</p>
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
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Submission Failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="bed_label" className="text-xs font-semibold text-slate-300">
              Bed Identifier / Label <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="bed_label"
              name="bed_label"
              value={formData.bed_label}
              onChange={handleChange}
              placeholder="e.g. A, B, Bed-1, Upper-Left"
              disabled={isSubmitting}
              className={fieldErrors.bed_label ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            <p className="text-[11px] text-slate-500">
              Must be unique within Room {roomLabel}.
            </p>
            {fieldErrors.bed_label && (
              <p className="text-xs text-rose-400">{fieldErrors.bed_label}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold text-slate-300">
              Bed Status <span className="text-rose-400">*</span>
            </Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="available">Available (Vacant)</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="under_maintenance">Under Maintenance</option>
            </select>
            {fieldErrors.status && (
              <p className="text-xs text-rose-400">{fieldErrors.status}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : bedToEdit ? (
                "Update Bed"
              ) : (
                "Create Bed"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
