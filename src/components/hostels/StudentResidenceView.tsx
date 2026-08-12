"use client";

import { Building2, Layers, DoorOpen, Bed, Calendar, MapPin, DollarSign, Users, AlertCircle, Info, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DetailedAllocation } from "@/app/allocations/allocation-actions";

interface StudentResidenceViewProps {
  activeAllocation: DetailedAllocation | null;
  pastAllocations: DetailedAllocation[];
  studentName?: string;
  rollNumber?: string | null;
  email?: string;
}

export function StudentResidenceView({
  activeAllocation,
  pastAllocations,
  studentName,
  rollNumber,
  email,
}: StudentResidenceViewProps) {
  const bed = activeAllocation?.bed;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const room = bed?.room as any;
  const floor = room?.floor;
  const hostel = floor?.hostel;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="py-1 px-3">Active Residence</Badge>;
      case "transferred":
        return <Badge variant="accent" className="bg-indigo-500/20 text-indigo-300">Transferred</Badge>;
      case "completed":
        return <Badge variant="secondary">Term Completed</Badge>;
      case "cancelled":
      default:
        return <Badge variant="destructive">Cancelled</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Hostel & Room Details
            </h1>
            {activeAllocation ? (
              <Badge variant="success" className="gap-1.5 py-1 px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Allocated
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 py-1 px-3">
                Unassigned
              </Badge>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {studentName ? `${studentName} ` : ""}
            {rollNumber ? `(${rollNumber}) ` : ""}
            {email ? `• ${email}` : ""}
          </p>
        </div>
      </div>

      {/* Active Residence View */}
      {activeAllocation && hostel ? (
        <div className="space-y-6">
          {/* Hero Card */}
          <Card className="glass-card border-indigo-500/30 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Hostel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {hostel.name}
                      </h2>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-semibold">
                        {hostel.code}
                      </span>
                    </div>
                    {hostel.address && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {hostel.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  {getStatusBadge(activeAllocation.status)}
                </div>
              </div>

              {/* Grid Details: Floor, Room, Bed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Floor Card */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                      <Layers className="h-4 w-4" />
                      Floor Level
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-2xl font-extrabold text-white">
                      Floor {floor?.floor_number ?? 0}
                    </span>
                    {floor?.name && (
                      <p className="text-xs text-slate-400 mt-0.5">{floor.name}</p>
                    )}
                  </div>
                </div>

                {/* Room Card */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <DoorOpen className="h-4 w-4" />
                      Room Unit
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800 capitalize">
                      {room?.room_type || "Standard"}
                    </span>
                  </div>
                  <div className="pt-1 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-white">
                        Room {room?.room_number || "N/A"}
                      </span>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3 text-indigo-400" />
                        Capacity: {room?.capacity || 2} occupants
                      </p>
                    </div>
                    {room?.monthly_rent !== null && room?.monthly_rent !== undefined && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Monthly Rent</span>
                        <span className="text-sm font-semibold text-emerald-400 flex items-center justify-end">
                          <DollarSign className="h-3.5 w-3.5" />
                          {room.monthly_rent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bed Card */}
                <div className="rounded-xl bg-slate-950/80 border border-teal-500/30 p-4 space-y-2 bg-gradient-to-br from-teal-950/20 to-slate-950">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                      <Bed className="h-4 w-4" />
                      Assigned Bed Slot
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 font-medium">
                      <ShieldCheck className="h-3 w-3" /> Confirmed
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-2xl font-extrabold text-teal-300 font-mono">
                      Bed {bed?.bed_label || "N/A"}
                    </span>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      Vacant slot assigned to your account
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Meta: Start Date, Remarks */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>
                    Allocation Effective Date:{" "}
                    <strong className="text-white font-medium">
                      {new Date(activeAllocation.start_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>
                  </span>
                </div>

                {activeAllocation.allocator && (
                  <span className="text-slate-400">
                    Assigned by: {activeAllocation.allocator.first_name} {activeAllocation.allocator.last_name}
                  </span>
                )}
              </div>

              {activeAllocation.notes && (
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3.5 flex items-start gap-2.5 text-xs text-indigo-200">
                  <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">Warden Remarks:</span>{" "}
                    <span className="italic">&quot;{activeAllocation.notes}&quot;</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State: Unassigned Student */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">No Active Hostel Allocation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your profile currently does not have an active hostel room or bed allocation assigned.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 max-w-md text-left text-xs space-y-2 text-slate-300 mt-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <AlertCircle className="h-4 w-4 text-indigo-400" />
              <span>Next Steps for Room Assignment:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Ensure your student registration and fee clearance are complete.</li>
              <li>Contact your Hostel Administration or Chief Warden office.</li>
              <li>Provide your Student ID / Roll Number for room processing.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Past Allocation History */}
      {pastAllocations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            Previous Allocation History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastAllocations.map((alloc) => {
              const h = alloc.bed?.room?.floor?.hostel;
              const r = alloc.bed?.room;
              const b = alloc.bed;

              return (
                <div
                  key={alloc.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {h?.name || "Hostel"} → Room {r?.room_number || "N/A"} → Bed {b?.bed_label || "N/A"}
                    </span>
                    {getStatusBadge(alloc.status)}
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span>
                      {new Date(alloc.start_date).toLocaleDateString()} -{" "}
                      {alloc.end_date ? new Date(alloc.end_date).toLocaleDateString() : "Present"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
