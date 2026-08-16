"use client";

import { useState } from "react";
import { X, Loader2, DoorOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoomRow, RoomFormData, RoomActionResult } from "@/app/hostels/room-actions";

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorLabel: string;
  roomToEdit: RoomRow | null;
  onSubmit: (data: RoomFormData) => Promise<RoomActionResult<RoomRow>>;
}

export function RoomFormModal({
  isOpen,
  onClose,
  floorLabel,
  roomToEdit,
  onSubmit,
}: RoomFormModalProps) {
  const [formData, setFormData] = useState<RoomFormData>({
    room_number: "",
    room_type: "double",
    capacity: 2,
    status: "available",
    monthly_rent: null,
  });
  const [prevRoom, setPrevRoom] = useState<RoomRow | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync prop changes during render without cascading useEffect renders
  if (roomToEdit !== prevRoom) {
    setPrevRoom(roomToEdit);
    setFormData({
      room_number: roomToEdit?.room_number || "",
      room_type: roomToEdit?.room_type || "double",
      capacity: roomToEdit?.capacity || 2,
      status: roomToEdit?.status || "available",
      monthly_rent: roomToEdit?.monthly_rent ?? null,
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
      [name]:
        name === "capacity"
          ? parseInt(value, 10) || 0
          : name === "monthly_rent"
          ? value === "" ? null : parseFloat(value)
          : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.room_number.trim()) {
      errors.room_number = "Room number is required.";
    }
    if (formData.capacity <= 0 || isNaN(formData.capacity)) {
      errors.capacity = "Capacity must be a positive number.";
    }
    if (formData.monthly_rent !== null && formData.monthly_rent !== undefined && (isNaN(formData.monthly_rent) || formData.monthly_rent < 0)) {
      errors.monthly_rent = "Monthly rent must be 0 or greater.";
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
        setServerError(res.error || "Failed to save room.");
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
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {roomToEdit ? "Edit Room" : "Add New Room"}
              </h2>
              <p className="text-xs text-slate-400">Target Floor: {floorLabel}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="room_number" className="text-xs font-semibold text-slate-300">
                Room Number / Identifier <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="room_number"
                name="room_number"
                value={formData.room_number}
                onChange={handleChange}
                placeholder="e.g. 101, 202-A"
                disabled={isSubmitting}
                className={fieldErrors.room_number ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
              />
              {fieldErrors.room_number && (
                <p className="text-xs text-rose-400">{fieldErrors.room_number}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room_type" className="text-xs font-semibold text-slate-300">
                Room Type <span className="text-rose-400">*</span>
              </Label>
              <select
                id="room_type"
                name="room_type"
                value={formData.room_type}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="triple">Triple Room</option>
                <option value="dormitory">Dormitory</option>
              </select>
              {fieldErrors.room_type && (
                <p className="text-xs text-rose-400">{fieldErrors.room_type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="capacity" className="text-xs font-semibold text-slate-300">
                Bed Capacity <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                value={formData.capacity || ""}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="2"
                className={fieldErrors.capacity ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
              />
              {fieldErrors.capacity && (
                <p className="text-xs text-rose-400">{fieldErrors.capacity}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-slate-300">
                Initial Status <span className="text-rose-400">*</span>
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="full">Full</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              {fieldErrors.status && (
                <p className="text-xs text-rose-400">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthly_rent" className="text-xs font-semibold text-slate-300">
              Monthly Rent (₹ Rupees) <span className="text-slate-500">(Optional)</span>
            </Label>
            <Input
              id="monthly_rent"
              name="monthly_rent"
              type="number"
              min={0}
              step="0.01"
              value={formData.monthly_rent ?? ""}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="e.g. 4500"
              className={fieldErrors.monthly_rent ? "border-rose-500/60 focus:ring-rose-500/30" : ""}
            />
            {fieldErrors.monthly_rent && (
              <p className="text-xs text-rose-400">{fieldErrors.monthly_rent}</p>
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
              ) : roomToEdit ? (
                "Update Room"
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
