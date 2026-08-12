"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoomWithBedCount, RoomActionResult } from "@/app/hostels/room-actions";

interface DeleteRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomWithBedCount | null;
  onConfirmDelete: (roomId: string) => Promise<RoomActionResult>;
}

export function DeleteRoomDialog({
  isOpen,
  onClose,
  room,
  onConfirmDelete,
}: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const isSafe = (room.bed_count ?? 0) === 0;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const res = await onConfirmDelete(room.id);
      if (!res.success) {
        setError(res.error || "Failed to delete room.");
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
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
            <h2 className="text-lg font-semibold text-white">Delete Room</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
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
                <p className="font-medium">Action Blocked</p>
                <p className="text-xs text-rose-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!isSafe ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2 text-amber-200 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Room Has Configured Beds</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Room <strong>{room.room_number}</strong> has <strong>{room.bed_count}</strong> configured bed(s).
                Deleting rooms with active bed structures or allocations is disabled to preserve data integrity.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">Room {room.room_number}</strong>?
              </p>
              <p className="text-xs text-slate-400">
                This action will permanently remove the room record from this floor.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>

          {isSafe && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
