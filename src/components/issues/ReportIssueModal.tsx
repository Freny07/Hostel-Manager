"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wrench, AlertCircle, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createIssueAction,
  getHostelsListAction,
  type IssueFormData,
  type IssueActionResult,
  type IssueRow,
  type StudentResidenceContext,
  type HostelsOption,
} from "@/app/issues/issue-actions";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  residenceContext: StudentResidenceContext | null;
  onSuccess: () => void;
}

export function ReportIssueModal({
  isOpen,
  onClose,
  residenceContext,
  onSuccess,
}: ReportIssueModalProps) {
  const [hostels, setHostels] = useState<HostelsOption[]>([]);
  const [isLoadingHostels, setIsLoadingHostels] = useState(false);

  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: "",
    category: "plumbing",
    priority: "medium",
    hostel_id: "",
    room_id: null,
    location_description: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        category: "plumbing",
        priority: "medium",
        hostel_id: residenceContext?.hostel_id || "",
        room_id: residenceContext?.room_id || null,
        location_description: residenceContext?.room_number
          ? `Room ${residenceContext.room_number}`
          : "",
      });
      setFieldErrors({});
      setServerError(null);
      if (!residenceContext) {
        setIsLoadingHostels(true);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    if (isOpen && !residenceContext) {
      getHostelsListAction()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            const fetchedHostels = res.data;
            setHostels(fetchedHostels);
            if (fetchedHostels.length > 0) {
              setFormData((prev) => ({
                ...prev,
                hostel_id: prev.hostel_id || fetchedHostels[0].id,
              }));
            }
          }
          setIsLoadingHostels(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setIsLoadingHostels(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, residenceContext]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Issue title is required.";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long.";
    }

    if (!formData.description.trim()) {
      errors.description = "Detailed issue description is required.";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long.";
    }

    if (!formData.hostel_id) {
      errors.hostel_id = "Target hostel location is required.";
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
      const res: IssueActionResult<IssueRow> = await createIssueAction(formData);
      if (!res.success) {
        setServerError(res.error || "Failed to submit issue report.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        onSuccess();
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
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Report Maintenance Issue</h2>
              <p className="text-xs text-slate-400">Submit a repair request to hostel administration</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {serverError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Submission Error</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Residence Pre-fill Badge */}
          {residenceContext && (
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3.5 flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>
                  Location auto-set to: <strong>{residenceContext.hostel_name} ({residenceContext.hostel_code})</strong> • Room {residenceContext.room_number || "N/A"}
                </span>
              </div>
              <Badge variant="success" className="text-[10px] gap-1 py-0.5 px-2">
                <CheckCircle2 className="h-3 w-3" /> Auto-filled
              </Badge>
            </div>
          )}

          {/* Hostel Selection (if no pre-fill) */}
          {!residenceContext && (
            <div className="space-y-1.5">
              <Label htmlFor="hostel_id" className="text-xs font-semibold text-slate-300">
                Select Hostel Location <span className="text-rose-400">*</span>
              </Label>
              {isLoadingHostels ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> Loading hostels...
                </div>
              ) : (
                <select
                  id="hostel_id"
                  name="hostel_id"
                  value={formData.hostel_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Select Hostel --</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.code})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.hostel_id && (
                <p className="text-xs text-rose-400">{fieldErrors.hostel_id}</p>
              )}
            </div>
          )}

          {/* Location Details / Room override */}
          <div className="space-y-1.5">
            <Label htmlFor="location_description" className="text-xs font-semibold text-slate-300">
              Specific Location / Area <span className="text-slate-500">(Optional)</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="location_description"
                name="location_description"
                value={formData.location_description || ""}
                onChange={handleChange}
                placeholder="e.g. Room 201 Bathroom, 2nd Floor West Corridor"
                disabled={isSubmitting}
                className="pl-9"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-300">
              Issue Summary / Title <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Water leak under bathroom sink, AC not cooling"
              disabled={isSubmitting}
              className={fieldErrors.title ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            {fieldErrors.title && (
              <p className="text-xs text-rose-400">{fieldErrors.title}</p>
            )}
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-300">
                Category <span className="text-rose-400">*</span>
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 capitalize"
              >
                <option value="plumbing">🚰 Plumbing & Water</option>
                <option value="electrical">⚡ Electrical & Power</option>
                <option value="carpentry">🔨 Furniture & Carpentry</option>
                <option value="appliance">🔌 Appliances (AC, Fan, Geyser)</option>
                <option value="cleaning">🧹 Housekeeping & Cleaning</option>
                <option value="internet">🌐 Wi-Fi & Internet</option>
                <option value="security">🛡️ Locks & Door Security</option>
                <option value="pest_control">🪲 Pest Control</option>
                <option value="other">📌 Other General Issue</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold text-slate-300">
                Urgency / Priority <span className="text-rose-400">*</span>
              </Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="low">🟢 Low (Minor inconvenience)</option>
                <option value="medium">🟡 Medium (Standard repair request)</option>
                <option value="high">🟠 High (Impacting daily use)</option>
                <option value="urgent">🔴 Urgent (Hazard / Water leak / Power outage)</option>
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-300">
              Detailed Description <span className="text-rose-400">*</span>
            </Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Describe the issue in detail, including specific symptoms, location, and when it started..."
              className={`w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                fieldErrors.description ? "border-rose-500/60 focus:ring-rose-500/30" : ""
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-400">{fieldErrors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                "Submit Maintenance Report"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
