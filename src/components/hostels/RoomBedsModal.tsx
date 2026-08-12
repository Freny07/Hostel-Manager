"use client";

import { useState, useEffect } from "react";
import { X, Bed, Plus, Loader2, Edit2, Trash2, ShieldCheck, AlertCircle, RefreshCw, CheckCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BedFormModal } from "./BedFormModal";
import { DeleteBedDialog } from "./DeleteBedDialog";
import {
  getBedsForRoomAction,
  createBedAction,
  updateBedAction,
  deleteBedAction,
  type BedRow,
  type BedWithAllocationCount,
  type BedFormData,
  type BedActionResult,
} from "@/app/hostels/bed-actions";
import type { RoomWithBedCount } from "@/app/hostels/room-actions";

interface RoomBedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomWithBedCount | null;
  floorLabel: string;
  hostelName: string;
  canManage: boolean;
  onBedsUpdated?: () => void;
}

export function RoomBedsModal({
  isOpen,
  onClose,
  room,
  floorLabel,
  hostelName,
  canManage,
  onBedsUpdated,
}: RoomBedsModalProps) {
  const [beds, setBeds] = useState<BedWithAllocationCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals inside beds view
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<BedRow | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingBed, setDeletingBed] = useState<BedWithAllocationCount | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && room) {
      getBedsForRoomAction(room.id)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setBeds(res.data);
          } else {
            setError(res.error || "Failed to load beds.");
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err instanceof Error ? err.message : "Error loading beds.");
          setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, room]);

  if (!isOpen || !room) return null;

  const roomTitle = `Room ${room.room_number}`;

  const handleOpenCreate = () => {
    setEditingBed(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bed: BedWithAllocationCount) => {
    setEditingBed(bed);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (bed: BedWithAllocationCount) => {
    setDeletingBed(bed);
    setIsDeleteOpen(true);
  };

  const reloadBeds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBedsForRoomAction(room.id);
      if (res.success && res.data) {
        setBeds(res.data);
      } else {
        setError(res.error || "Failed to reload beds.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error reloading beds.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (
    data: BedFormData
  ): Promise<BedActionResult<BedRow>> => {
    let result: BedActionResult<BedRow>;
    if (editingBed) {
      result = await updateBedAction(editingBed.id, data);
    } else {
      result = await createBedAction(room.id, data);
    }

    if (result.success) {
      await reloadBeds();
      if (onBedsUpdated) onBedsUpdated();
    }
    return result;
  };

  const handleDeleteConfirm = async (bedId: string): Promise<BedActionResult> => {
    const result = await deleteBedAction(bedId);
    if (result.success) {
      await reloadBeds();
      if (onBedsUpdated) onBedsUpdated();
    }
    return result;
  };

  const getStatusBadge = (status: BedRow["status"]) => {
    switch (status) {
      case "available":
        return <Badge variant="success">Vacant / Available</Badge>;
      case "occupied":
        return <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300">Occupied</Badge>;
      case "reserved":
        return <Badge variant="secondary" className="border-amber-500/30 text-amber-300">Reserved</Badge>;
      case "under_maintenance":
      default:
        return <Badge variant="destructive">Maintenance</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md">
              <Bed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white leading-tight">
                  Beds Inventory
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  {roomTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {hostelName} • {floorLabel} • Capacity: {room.capacity} beds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500"
              >
                <Plus className="h-4 w-4" />
                Add Bed
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center justify-between text-rose-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={reloadBeds} className="gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
              <p className="text-sm font-medium">Loading bed inventory...</p>
            </div>
          ) : beds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {beds.map((bed) => {
                const isVacant = bed.status === "available" && (bed.active_allocation_count ?? 0) === 0;

                return (
                  <div
                    key={bed.id}
                    className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                            Bed {bed.bed_label}
                          </span>
                        </div>
                        {getStatusBadge(bed.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        {isVacant ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" /> Vacant & Ready
                          </span>
                        ) : (
                          <span className="text-indigo-300 flex items-center gap-1 font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-400" /> Assigned / Occupied
                          </span>
                        )}

                        {isVacant ? (
                          <span className="text-emerald-400 text-[11px] flex items-center gap-0.5">
                            <ShieldCheck className="h-3 w-3" /> Safe delete
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[11px] flex items-center gap-0.5">
                            <AlertCircle className="h-3 w-3" /> Protected
                          </span>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(bed)}
                          className="gap-1.5 text-xs text-slate-300 hover:text-white"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-teal-400" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDelete(bed)}
                          className="gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-950/40 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Bed className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-semibold text-white">No Beds Configured</h4>
                <p className="text-xs text-slate-400">
                  This room currently has 0 beds registered. Click below to add bed slots (up to room capacity {room.capacity}).
                </p>
              </div>
              {canManage && (
                <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 mt-2">
                  <Plus className="h-4 w-4" />
                  Add First Bed
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-slate-800 px-6 py-3.5 flex items-center justify-between bg-slate-900/50 text-xs text-slate-400">
          <span>Configured Beds: {beds.length} / {room.capacity} Capacity</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Sub-modals for bed actions */}
      <BedFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        roomLabel={roomTitle}
        bedToEdit={editingBed}
        onSubmit={handleFormSubmit}
      />

      <DeleteBedDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        bed={deletingBed}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  );
}
