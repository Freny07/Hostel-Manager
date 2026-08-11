"use client";

import { useState } from "react";
import { X, Loader2, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HostelRow, HostelFormData, HostelActionResult } from "@/app/hostels/hostel-actions";

interface HostelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostelToEdit: HostelRow | null;
  onSubmit: (data: HostelFormData) => Promise<HostelActionResult<HostelRow>>;
}

export function HostelFormModal({
  isOpen,
  onClose,
  hostelToEdit,
  onSubmit,
}: HostelFormModalProps) {
  const [formData, setFormData] = useState<HostelFormData>({
    name: "",
    code: "",
    gender_type: "co-ed",
    total_floors: 1,
    address: "",
  });
  const [prevHostel, setPrevHostel] = useState<HostelRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (hostelToEdit !== prevHostel) {
    setPrevHostel(hostelToEdit);
    setFormData({
      name: hostelToEdit?.name || "",
      code: hostelToEdit?.code || "",
      gender_type: hostelToEdit?.gender_type || "co-ed",
      total_floors: hostelToEdit?.total_floors || 1,
      address: hostelToEdit?.address || "",
    });
    setFieldErrors({});
    setServerError(null);
  }

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_floors" ? parseInt(value, 10) || 0 : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Hostel name is required.";
    }
    if (!formData.code.trim()) {
      errors.code = "Hostel code is required.";
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.code.trim())) {
      errors.code = "Code can only contain letters, numbers, hyphens, and underscores.";
    }
    if (formData.total_floors < 1) {
      errors.total_floors = "Total floors must be at least 1.";
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
        setServerError(res.error || "An unexpected error occurred.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        onClose();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save hostel.");
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
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {hostelToEdit ? "Edit Hostel" : "Create New Hostel"}
            </h2>
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
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Form Submission Failed</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-300">
              Hostel Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sapphire Residence Hall"
              disabled={isSubmitting}
              className={fieldErrors.name ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-400">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold text-slate-300">
                Hostel Code <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. SRH-A"
                disabled={isSubmitting}
                className={`uppercase font-mono ${
                  fieldErrors.code ? "border-rose-500/60 focus:ring-rose-500/30" : ""
                }`}
              />
              {fieldErrors.code && (
                <p className="text-xs text-rose-400">{fieldErrors.code}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender_type" className="text-xs font-semibold text-slate-300">
                Gender Designation <span className="text-rose-400">*</span>
              </Label>
              <select
                id="gender_type"
                name="gender_type"
                value={formData.gender_type}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="co-ed">Co-Ed (Mixed)</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
              {fieldErrors.gender_type && (
                <p className="text-xs text-rose-400">{fieldErrors.gender_type}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total_floors" className="text-xs font-semibold text-slate-300">
              Total Floors <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="total_floors"
              name="total_floors"
              type="number"
              min={1}
              value={formData.total_floors || ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="1"
              className={fieldErrors.total_floors ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            {fieldErrors.total_floors && (
              <p className="text-xs text-rose-400">{fieldErrors.total_floors}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-300">
              Address / Campus Location <span className="text-slate-500">(Optional)</span>
            </Label>

            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. North Campus, Block B, University Drive"
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
              ) : hostelToEdit ? (
                "Update Hostel"
              ) : (
                "Create Hostel"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
