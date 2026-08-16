"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRightLeft,
  LogOut,
  Calendar,
  Building2,
  Users,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AssignStudentModal } from "./AssignStudentModal";
import { ChangeAllocationModal } from "./ChangeAllocationModal";
import { RemoveAllocationDialog } from "./RemoveAllocationDialog";
import { StudentResidenceView } from "./StudentResidenceView";
import {
  removeAllocationAction,
  type DetailedAllocation,
  type AllocationActionResult,
  type UnassignedStudentOption,
} from "@/app/allocations/allocation-actions";
import { formatDisplayDate } from "@/lib/date-utils";

interface AllocationManagementProps {
  initialAllocations: DetailedAllocation[];
  canManage: boolean;
  isStudentView?: boolean;
}

export function AllocationManagement({
  initialAllocations,
  canManage,
  isStudentView = false,
}: AllocationManagementProps) {
  const router = useRouter();

  // Active student allocation & past allocations
  const activeStudentAllocation = useMemo(() => {
    return initialAllocations.find((a) => a.status === "active") || null;
  }, [initialAllocations]);

  const pastStudentAllocations = useMemo(() => {
    return initialAllocations.filter((a) => a.status !== "active");
  }, [initialAllocations]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Modal States
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [selectedForChange, setSelectedForChange] = useState<DetailedAllocation | null>(null);

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedForRemove, setSelectedForRemove] = useState<DetailedAllocation | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Filtered Allocations (Admin/Warden search)
  const filteredAllocations = useMemo(() => {
    return initialAllocations.filter((alloc) => {
      const student = alloc.student;
      const bed = alloc.bed;
      const room = bed?.room;
      const hostel = room?.floor?.hostel;

      const searchStr = `${student?.first_name || ""} ${student?.last_name || ""} ${student?.roll_number || ""} ${student?.email || ""} ${hostel?.name || ""} ${room?.room_number || ""} ${bed?.bed_label || ""}`.toLowerCase();

      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || alloc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialAllocations, searchTerm, statusFilter]);

  // Active Count Stat
  const activeCount = useMemo(() => {
    return initialAllocations.filter((a) => a.status === "active").length;
  }, [initialAllocations]);

  if (isStudentView) {
    const studentInfo = activeStudentAllocation?.student || initialAllocations[0]?.student;

    return (
      <StudentResidenceView
        activeAllocation={activeStudentAllocation}
        pastAllocations={pastStudentAllocations}
        studentName={studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : undefined}
        rollNumber={studentInfo?.roll_number}
        email={studentInfo?.email}
      />
    );
  }

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Handlers
  const handleOpenChange = (alloc: DetailedAllocation) => {
    setSelectedForChange(alloc);
    setIsChangeOpen(true);
  };

  const handleOpenRemove = (alloc: DetailedAllocation) => {
    setSelectedForRemove(alloc);
    setIsRemoveOpen(true);
  };

  const handleRemoveConfirm = async (
    allocationId: string,
    reason: "cancelled" | "completed",
    notes?: string
  ): Promise<AllocationActionResult> => {
    const res = await removeAllocationAction(allocationId, reason, notes);
    if (res.success) {
      showNotification(
        "success",
        `Allocation was marked as ${reason} and bed was freed.`
      );
      router.refresh();
    }
    return res;
  };

  const getStatusBadge = (status: DetailedAllocation["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active Residence</Badge>;
      case "transferred":
        return <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300">Transferred</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
      default:
        return <Badge variant="destructive">Cancelled</Badge>;
    }
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
              {isStudentView ? "My Bed Allocations" : "Student Room & Bed Allocations"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {activeCount} Active {activeCount === 1 ? "Resident" : "Residents"}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isStudentView
              ? "View your active and historic campus residence allocations."
              : "Assign students to vacant beds, transfer room assignments, and manage resident checkout records."}
          </p>
        </div>

        {canManage && !isStudentView && (
          <Button
            onClick={() => setIsAssignOpen(true)}
            size="lg"
            className="gap-2 self-start md:self-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            <UserPlus className="h-4 w-4" />
            Assign Student to Bed
          </Button>
        )}
      </div>

      {/* Stats Cards (Admin/Warden view) */}
      {!isStudentView && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card border-slate-800 p-2">
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Active Residents</p>
                <CardTitle className="text-2xl font-bold text-white mt-1">{activeCount}</CardTitle>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-card border-slate-800 p-2">
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Total Records</p>
                <CardTitle className="text-2xl font-bold text-white mt-1">{initialAllocations.length}</CardTitle>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bed className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>

          <Card className="glass-card border-slate-800 p-2">
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-mono tracking-wider">Historical Terminations</p>
                <CardTitle className="text-2xl font-bold text-white mt-1">
                  {initialAllocations.filter((a) => a.status === "completed" || a.status === "cancelled").length}
                </CardTitle>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <LogOut className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Control Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by student name, roll #, hostel, room..."
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {[
            { id: "active", label: "Active Only" },
            { id: "all", label: "All History" },
            { id: "transferred", label: "Transferred" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setStatusFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                statusFilter === type.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allocations Cards / List */}
      {filteredAllocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAllocations.map((alloc) => {
            const student = alloc.student;
            const bed = alloc.bed;
            const room = bed?.room;
            const floor = room?.floor;
            const hostel = floor?.hostel;

            return (
              <Card
                key={alloc.id}
                className="glass-card border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Top Bar: Student & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {student ? `${student.first_name} ${student.last_name}` : "Unknown Student"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        {student?.roll_number && (
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            Roll: {student.roll_number}
                          </span>
                        )}
                        <span>{student?.email}</span>
                      </div>
                    </div>
                    {getStatusBadge(alloc.status)}
                  </div>

                  {/* Room & Bed Allocation details box */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 font-mono uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                        <Building2 className="h-3.5 w-3.5" />
                        {hostel?.name || "Unspecified Hostel"}
                      </span>
                      <span>Code: {hostel?.code || "N/A"}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Floor</span>
                        <span className="font-semibold text-sm">Floor {floor?.floor_number ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Room</span>
                        <span className="font-semibold text-sm">Room {room?.room_number || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Bed Slot</span>
                        <span className="font-semibold text-sm text-emerald-400">Bed {bed?.bed_label || "N/A"}</span>
                      </div>
                    </div>

                    {alloc.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-900">
                        &quot;{alloc.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Dates & Allocator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Started: {formatDisplayDate(alloc.start_date)}
                    </span>
                    {alloc.end_date && (
                      <span suppressHydrationWarning>Ended: {formatDisplayDate(alloc.end_date)}</span>
                    )}
                  </div>
                </CardContent>

                {/* Actions Bar (Admin/Warden only for active allocations) */}
                {canManage && alloc.status === "active" && !isStudentView && (
                  <div className="border-t border-slate-800/80 px-6 py-3 flex items-center justify-end gap-2 bg-slate-900/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChange(alloc)}
                      className="gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:text-white hover:bg-indigo-950/40"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-400" />
                      Transfer Bed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRemove(alloc)}
                      className="gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-950/40 hover:text-rose-300"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      End Allocation
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : initialAllocations.length === 0 ? (
        /* Empty State: No Allocations Exist */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <Bed className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No Room Allocations Registered</h3>
            <p className="text-slate-400 text-sm">
              {isStudentView
                ? "You currently do not have any active or historic bed allocations assigned to your profile."
                : "Assign registered students to vacant beds across configured hostel floors and rooms."}
            </p>
          </div>
          {canManage && !isStudentView && (
            <Button onClick={() => setIsAssignOpen(true)} className="gap-2 mt-2">
              <UserPlus className="h-4 w-4" />
              Assign First Student
            </Button>
          )}
        </div>
      ) : (
        /* Empty State: Filter returned no matches */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <p className="text-slate-300 text-sm font-medium">
            No allocations match your active filter &quot;{searchTerm || statusFilter}&quot;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("active");
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Filter Criteria
          </Button>
        </div>
      )}

      {/* Modals */}
      <AssignStudentModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={() => {
          showNotification("success", "Student was successfully assigned to the selected bed.");
          router.refresh();
        }}
      />

      <ChangeAllocationModal
        isOpen={isChangeOpen}
        onClose={() => setIsChangeOpen(false)}
        allocation={selectedForChange}
        onSuccess={() => {
          showNotification("success", "Student bed transfer completed successfully.");
          router.refresh();
        }}
      />

      <RemoveAllocationDialog
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        allocation={selectedForRemove}
        onConfirmRemove={handleRemoveConfirm}
      />
    </div>
  );
}
