"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Building2,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HostelCard, type HostelWithCounts } from "./HostelCard";
import { HostelFormModal } from "./HostelFormModal";
import { HostelDetailsModal } from "./HostelDetailsModal";
import { DeleteHostelDialog } from "./DeleteHostelDialog";
import { HostelFloorsModal } from "./HostelFloorsModal";
import {
  createHostelAction,
  updateHostelAction,
  deleteHostelAction,
  type HostelFormData,
  type HostelActionResult,
  type HostelRow,
} from "@/app/hostels/hostel-actions";

interface HostelManagementProps {
  initialHostels: HostelWithCounts[];
  canManage: boolean;
}

export function HostelManagement({
  initialHostels,
  canManage,
}: HostelManagementProps) {
  const router = useRouter();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<HostelRow | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedHostelForDetails, setSelectedHostelForDetails] = useState<HostelWithCounts | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedHostelForDelete, setSelectedHostelForDelete] = useState<HostelWithCounts | null>(null);

  const [isFloorsOpen, setIsFloorsOpen] = useState(false);
  const [selectedHostelForFloors, setSelectedHostelForFloors] = useState<HostelWithCounts | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Filtered Hostels List
  const filteredHostels = useMemo(() => {
    return initialHostels.filter((hostel) => {
      const matchesSearch =
        hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hostel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hostel.address && hostel.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGender =
        genderFilter === "all" || hostel.gender_type === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [initialHostels, searchTerm, genderFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingHostel(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hostel: HostelWithCounts) => {
    setEditingHostel(hostel);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (hostel: HostelWithCounts) => {
    setSelectedHostelForDetails(hostel);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (hostel: HostelWithCounts) => {
    setSelectedHostelForDelete(hostel);
    setIsDeleteOpen(true);
  };

  const handleOpenFloors = (hostel: HostelWithCounts) => {
    setSelectedHostelForFloors(hostel);
    setIsFloorsOpen(true);
  };

  const handleFormSubmit = async (
    data: HostelFormData
  ): Promise<HostelActionResult<HostelRow>> => {
    let result: HostelActionResult<HostelRow>;
    if (editingHostel) {
      result = await updateHostelAction(editingHostel.id, data);
    } else {
      result = await createHostelAction(data);
    }

    if (result.success) {
      showNotification(
        "success",
        editingHostel
          ? `Hostel '${data.name}' was successfully updated.`
          : `Hostel '${data.name}' was successfully created.`
      );
      router.refresh();
    }
    return result;
  };

  const handleDeleteConfirm = async (id: string): Promise<HostelActionResult> => {
    const result = await deleteHostelAction(id);
    if (result.success) {
      showNotification("success", "Hostel record deleted successfully.");
      router.refresh();
    }
    return result;
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hostel Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {initialHostels.length} {initialHostels.length === 1 ? "Hostel" : "Hostels"} Total
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage campus residence halls, floor configurations, and gender designations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {canManage && (
            <Button
              onClick={handleOpenCreate}
              size="lg"
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" />
              Add New Hostel
            </Button>
          )}
        </div>
      </div>

      {/* Standard Directory List Mode */}
      <>
          {/* Control Bar: Search & Gender Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by hostel name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-900/80 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Gender Filter Tabs */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>
              {[
                { id: "all", label: "All Types" },
                { id: "co-ed", label: "Co-Ed" },
                { id: "male", label: "Male" },
                { id: "female", label: "Female" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setGenderFilter(type.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    genderFilter === type.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hostels Grid or Empty State */}
          {filteredHostels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  canManage={canManage}
                  onView={handleOpenDetails}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onManageFloors={handleOpenFloors}
                />
              ))}
            </div>
          ) : initialHostels.length === 0 ? (
            /* Empty State: No Hostels Exist */
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-lg font-bold text-white">No Hostels Registered Yet</h3>
                <p className="text-slate-400 text-sm">
                  Get started by creating your campus accommodation halls. Define building names, unique codes, and floor counts.
                </p>
              </div>
              {canManage && (
                <Button onClick={handleOpenCreate} className="gap-2 mt-2">
                  <Plus className="h-4 w-4" />
                  Create First Hostel
                </Button>
              )}
            </div>
          ) : (
            /* Empty State: Filter Returned No Matches */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-10 text-center flex flex-col items-center justify-center space-y-3">
              <p className="text-slate-300 text-sm font-medium">
                No hostels match your active filter criteria &quot;{searchTerm || genderFilter}&quot;.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("all");
                }}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Search Filters
              </Button>
            </div>
          )}
        </>

      {/* Modals */}
      <HostelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        hostelToEdit={editingHostel}
        onSubmit={handleFormSubmit}
      />

      <HostelDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        hostel={selectedHostelForDetails}
      />

      <DeleteHostelDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        hostel={selectedHostelForDelete}
        onConfirmDelete={handleDeleteConfirm}
      />

      <HostelFloorsModal
        isOpen={isFloorsOpen}
        onClose={() => setIsFloorsOpen(false)}
        hostel={selectedHostelForFloors}
        canManage={canManage}
        onFloorsUpdated={() => router.refresh()}
      />
    </div>
  );
}
