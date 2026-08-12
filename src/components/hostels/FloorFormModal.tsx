"use client";

import { useState } from "react";
import { X, Loader2, Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FloorRow, FloorFormData, FloorActionResult } from "@/app/hostels/floor-actions";

interface FloorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostelName: string;
  floorToEdit: FloorRow | null;
  onSubmit: (data: FloorFormData) => Promise<FloorActionResult<FloorRow>>;
}

export function FloorFormModal({
  isOpen,
  onClose,
  hostelName,
  floorToEdit,
  onSubmit,
}: FloorFormModalProps) {
  const [formData, setFormData] = useState<FloorFormData>({
    floor_number: 0,
    name: "",
  });
  const [prevFloor, setPrevFloor] = useState<FloorRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync prop changes during render without cascading useEffect renders
  if (floorToEdit !== prevFloor) {
    setPrevFloor(floorToEdit);
    setFormData({
      floor_number: floorToEdit?.floor_number ?? 0,
      name: floorToEdit?.name || "",
    });
    setFieldErrors({});
    setServerError(null);
  }

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "floor_number" ? parseInt(value, 10) : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};
    if (formData.floor_number === undefined || formData.floor_number === null || isNaN(formData.floor_number)) {
      errors.floor_number = "Floor number is required.";
    } else if (formData.floor_number < 0) {
      errors.floor_number = "Floor number must be 0 or greater (e.g. 0 for Ground Floor).";
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
        setServerError(res.error || "Failed to save floor.");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {floorToEdit ? "Edit Floor" : "Add New Floor"}
              </h2>
              <p className="text-xs text-slate-400">Hostel: {hostelName}</p>
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
            <Label htmlFor="floor_number" className="text-xs font-semibold text-slate-300">
              Floor Number <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="floor_number"
              name="floor_number"
              type="number"
              min={0}
              value={isNaN(formData.floor_number) ? "" : formData.floor_number}
              onChange={handleChange}
              placeholder="0 (Ground Floor), 1, 2..."
              disabled={isSubmitting}
              className={fieldErrors.floor_number ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            <p className="text-[11px] text-slate-500">
              Use 0 for Ground Floor, 1 for 1st Floor, 2 for 2nd Floor, etc.
            </p>
            {fieldErrors.floor_number && (
              <p className="text-xs text-rose-400">{fieldErrors.floor_number}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-300">
              Floor Name / Label <span className="text-slate-500">(Optional)</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g. Ground Floor, Wing A - 2nd Floor"
              disabled={isSubmitting}
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-400">{fieldErrors.name}</p>
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
              ) : floorToEdit ? (
                "Update Floor"
              ) : (
                "Create Floor"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
