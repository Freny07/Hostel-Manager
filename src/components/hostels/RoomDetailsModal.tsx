"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Bed,
  Wrench,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getRoomMapDetailsAction,
  type RoomMapDetails,
} from "@/app/hostels/map-actions";

interface RoomDetailsModalProps {
  roomId: string | null;
  onClose: () => void;
}

export function RoomDetailsModal({ roomId, onClose }: RoomDetailsModalProps) {
  const [data, setData] = useState<RoomMapDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!roomId) {
      return;
    }

    const loadRoomDetails = async () => {
      try {
        setLoading(true);
        const res = await getRoomMapDetailsAction(roomId);
        if (!isMounted) return;
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.error || "Failed to load room inspection details.");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error loading details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoomDetails();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  if (!roomId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-6 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          {data?.room ? (
            <div className="flex items-center justify-between flex-wrap gap-2 w-full pr-8">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                  Room {data.room.room_number} Inspection Details
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {data.room.hostel_name} • Floor {data.room.floor_number} • Capacity {data.room.capacity} ({data.room.room_type})
                </p>
              </div>

              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 capitalize">
                {data.room.room_type} Room
              </Badge>
            </div>
          ) : (
            <h2 className="text-base font-bold text-white">
              Room Inspection Details
            </h2>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <span>Fetching live database room details and active issues...</span>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-xs text-rose-300 space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close Window
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-6 pt-2">
            {/* Occupants & Bed Capacity */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-emerald-400" /> Authorized Occupants ({data.occupants.length} Beds)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.occupants.map((occ) => (
                  <div
                    key={occ.bed_id}
                    className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-indigo-400 font-mono text-xs font-bold shrink-0">
                      {occ.bed_number}
                    </div>

                    <div className="flex-1 min-w-0">
                      {occ.student ? (
                        <>
                          <span className="font-semibold text-xs text-white block truncate">
                            {occ.student.full_name || occ.student.email.split("@")[0]}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block truncate">
                            {occ.student.email}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Available / Vacant Bed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Maintenance Issues */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-amber-400" /> Active Maintenance Issues ({data.activeIssues.length})
                </span>
              </h3>

              {data.activeIssues.length === 0 ? (
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>No active maintenance issues logged for this room.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.activeIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                              issue.priority === "critical" || issue.priority === "urgent"
                                ? "bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
                                : issue.priority === "high"
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-slate-900 text-slate-300 border-slate-700"
                            }`}
                          >
                            {issue.priority} Priority
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 capitalize">
                            Category: {issue.category}
                          </span>
                        </div>

                        <Link
                          href={`/issues/${issue.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <span>Open Ticket</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>

                      <h4 className="text-xs font-bold text-white">{issue.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {issue.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Complaints History */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" /> Recent Complaints History
              </h3>

              {data.recentComplaints.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No historical complaints logged.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentComplaints.map((comp) => (
                    <div
                      key={comp.id}
                      className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{comp.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          {comp.category} • Logged on {comp.created_at.split("T")[0]}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          comp.status === "resolved"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {comp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
