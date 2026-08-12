"use client";

import { useState, useEffect } from "react";
import { X, DoorOpen, Plus, Loader2, Edit2, Trash2, ShieldCheck, AlertCircle, RefreshCw, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoomFormModal } from "./RoomFormModal";
import { DeleteRoomDialog } from "./DeleteRoomDialog";
import {
  getRoomsForFloorAction,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
  type RoomRow,
  type RoomWithBedCount,
  type RoomFormData,
  type RoomActionResult,
} from "@/app/hostels/room-actions";
import type { FloorWithRoomCount } from "@/app/hostels/floor-actions";

interface FloorRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  floor: FloorWithRoomCount | null;
  hostelName: string;
  canManage: boolean;
  onRoomsUpdated?: () => void;
}

export function FloorRoomsModal({
  isOpen,
  onClose,
  floor,
  hostelName,
  canManage,
  onRoomsUpdated,
}: FloorRoomsModalProps) {
  const [rooms, setRooms] = useState<RoomWithBedCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals inside rooms view
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<RoomWithBedCount | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && floor) {
      getRoomsForFloorAction(floor.id)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            setRooms(res.data);
          } else {
            setError(res.error || "Failed to load rooms.");
          }
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err instanceof Error ? err.message : "Error loading rooms.");
          setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, floor]);

  if (!isOpen || !floor) return null;

  const floorLabel = `Floor ${floor.floor_number}${floor.name ? ` (${floor.name})` : ""}`;

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (room: RoomWithBedCount) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (room: RoomWithBedCount) => {
    setDeletingRoom(room);
    setIsDeleteOpen(true);
  };

  const reloadRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRoomsForFloorAction(floor.id);
      if (res.success && res.data) {
        setRooms(res.data);
      } else {
        setError(res.error || "Failed to reload rooms.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error reloading rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (
    data: RoomFormData
  ): Promise<RoomActionResult<RoomRow>> => {
    let result: RoomActionResult<RoomRow>;
    if (editingRoom) {
      result = await updateRoomAction(editingRoom.id, data);
    } else {
      result = await createRoomAction(floor.id, data);
    }

    if (result.success) {
      await reloadRooms();
      if (onRoomsUpdated) onRoomsUpdated();
    }
    return result;
  };

  const handleDeleteConfirm = async (roomId: string): Promise<RoomActionResult> => {
    const result = await deleteRoomAction(roomId);
    if (result.success) {
      await reloadRooms();
      if (onRoomsUpdated) onRoomsUpdated();
    }
    return result;
  };

  const getStatusBadge = (status: RoomRow["status"]) => {
    switch (status) {
      case "available":
        return <Badge variant="success">Available</Badge>;
      case "occupied":
        return <Badge variant="accent">Occupied</Badge>;
      case "full":
        return <Badge variant="secondary">Full</Badge>;
      case "under_maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "inactive":
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white leading-tight">
                  Rooms Directory
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  {floorLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">Hostel: {hostelName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
              >
                <Plus className="h-4 w-4" />
                Add Room
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
              <Button variant="outline" size="sm" onClick={reloadRooms} className="gap-1.5 text-xs">
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Loading room records...</p>
            </div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-base">
                          Room {room.room_number}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800 capitalize">
                          {room.room_type}
                        </span>
                      </div>
                      {getStatusBadge(room.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Capacity: <strong>{room.capacity}</strong></span>
                      </div>
                      {room.monthly_rent !== null && room.monthly_rent !== undefined ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span><strong>{room.monthly_rent}</strong> / mo</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No rent set</span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                      <span>{room.bed_count ?? 0} Beds Configured</span>
                      {(room.bed_count ?? 0) === 0 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Safe to delete
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Has beds
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(room)}
                        className="gap-1.5 text-xs text-slate-300 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-emerald-400" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDelete(room)}
                        className="gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-950/40 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DoorOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-semibold text-white">No Rooms Configured</h4>
                <p className="text-xs text-slate-400">
                  This floor currently has 0 rooms registered. Click below to add room units.
                </p>
              </div>
              {canManage && (
                <Button onClick={handleOpenCreate} size="sm" className="gap-1.5 mt-2">
                  <Plus className="h-4 w-4" />
                  Add First Room
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-slate-800 px-6 py-3.5 flex items-center justify-between bg-slate-900/50 text-xs text-slate-400">
          <span>Total Configured Rooms: {rooms.length}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Sub-modals for room actions */}
      <RoomFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        floorLabel={floorLabel}
        roomToEdit={editingRoom}
        onSubmit={handleFormSubmit}
      />

      <DeleteRoomDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        room={deletingRoom}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  );
}
