"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Layers, Plus, Loader2, Edit2, Trash2, ShieldCheck, AlertCircle, RefreshCw, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloorFormModal } from "./FloorFormModal";
import { DeleteFloorDialog } from "./DeleteFloorDialog";
import { FloorRoomsModal } from "./FloorRoomsModal";
import {
  getFloorsForHostelAction,
  createFloorAction,
  updateFloorAction,
  deleteFloorAction,
  type FloorRow,
  type FloorWithRoomCount,
  type FloorFormData,
  type FloorActionResult,
} from "@/app/hostels/floor-actions";
import type { HostelWithCounts } from "./HostelCard";

interface HostelFloorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostel: HostelWithCounts | null;
  canManage: boolean;
  onFloorsUpdated?: () => void;
}

export function HostelFloorsModal({
  isOpen,
  onClose,
  hostel,
  canManage,
  onFloorsUpdated,
}: HostelFloorsModalProps) {
  const [floors, setFloors] = useState<FloorWithRoomCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals inside floors view
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorRow | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<FloorWithRoomCount | null>(null);

  const [isRoomsOpen, setIsRoomsOpen] = useState(false);
  const [selectedFloorForRooms, setSelectedFloorForRooms] = useState<FloorWithRoomCount | null>(null);

  const fetchFloors = useCallback(async () => {
    if (!hostel) return;
    setError(null);
    try {
      const res = await getFloorsForHostelAction(hostel.id);
      if (res.success && res.data) {
        setFloors(res.data);
      } else {
        setError(res.error || "Failed to load floors.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading floors.");
    } finally {
      setIsLoading(false);
    }
  }, [hostel]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && hostel) {
      getFloorsForHostelAction(hostel.id).then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setFloors(res.data);
        } else {
          setError(res.error || "Failed to load floors.");
        }
        setIsLoading(false);
      }).catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error loading floors.");
        setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, hostel]);

  if (!isOpen || !hostel) return null;

  const handleOpenCreate = () => {
    setEditingFloor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (floor: FloorWithRoomCount) => {
    setEditingFloor(floor);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (floor: FloorWithRoomCount) => {
    setDeletingFloor(floor);
    setIsDeleteOpen(true);
  };

  const handleOpenRooms = (floor: FloorWithRoomCount) => {
    setSelectedFloorForRooms(floor);
    setIsRoomsOpen(true);
  };

  const handleFormSubmit = async (
    data: FloorFormData
  ): Promise<FloorActionResult<FloorRow>> => {
    let result: FloorActionResult<FloorRow>;
    if (editingFloor) {
      result = await updateFloorAction(editingFloor.id, data);
    } else {
      result = await createFloorAction(hostel.id, data);
    }

    if (result.success) {
      await fetchFloors();
      if (onFloorsUpdated) onFloorsUpdated();
    }
    return result;
  };

  const handleDeleteConfirm = async (floorId: string): Promise<FloorActionResult> => {
    const result = await deleteFloorAction(floorId);
    if (result.success) {
      await fetchFloors();
      if (onFloorsUpdated) onFloorsUpdated();
    }
    return result;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white leading-tight">
                  Floor Configurations
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  {hostel.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">Hostel: {hostel.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500"
              >
                <Plus className="h-4 w-4" />
                Add Floor
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
              <Button variant="outline" size="sm" onClick={fetchFloors} className="gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">Loading floor records...</p>
            </div>
          ) : floors.length > 0 ? (
            <div className="space-y-3">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold border border-indigo-500/20">
                      F{floor.floor_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          Floor {floor.floor_number}
                        </span>
                        {floor.name && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                            {floor.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>
                          {floor.room_count ?? 0} {floor.room_count === 1 ? "Room" : "Rooms"} Configured
                        </span>
                        <span>•</span>
                        {(floor.room_count ?? 0) === 0 ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Safe to delete
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Has rooms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRooms(floor)}
                      className="gap-1.5 text-xs text-emerald-300 border-emerald-500/30 hover:text-white hover:bg-emerald-950/40"
                    >
                      <DoorOpen className="h-3.5 w-3.5 text-emerald-400" />
                      Rooms
                    </Button>

                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(floor)}
                          className="gap-1.5 text-xs text-slate-300 hover:text-white"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDelete(floor)}
                          className="gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-950/40 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-semibold text-white">No Floors Configured</h4>
                <p className="text-xs text-slate-400">
                  This hostel currently has 0 floors registered. Click below to add floor levels.
                </p>
              </div>
              {canManage && (
                <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 mt-2">
                  <Plus className="h-4 w-4" />
                  Add First Floor
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-slate-800 px-6 py-3.5 flex items-center justify-between bg-slate-900/50 text-xs text-slate-400">
          <span>Total Configured Floors: {floors.length}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Sub-modals for floor actions */}
      <FloorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        hostelName={hostel.name}
        floorToEdit={editingFloor}
        onSubmit={handleFormSubmit}
      />

      <DeleteFloorDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        floor={deletingFloor}
        onConfirmDelete={handleDeleteConfirm}
      />

      <FloorRoomsModal
        isOpen={isRoomsOpen}
        onClose={() => setIsRoomsOpen(false)}
        floor={selectedFloorForRooms}
        hostelName={hostel.name}
        canManage={canManage}
        onRoomsUpdated={() => fetchFloors()}
      />
    </div>
  );
}
