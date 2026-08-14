"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  CheckCircle2,
  Wrench,
  Loader2,
  RefreshCw,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoomDetailsModal } from "./RoomDetailsModal";
import {
  getHostelMapDataAction,
  type HostelMapData,
  type RoomMapTile,
} from "@/app/hostels/map-actions";

export function HostelVisualMap() {
  const [mapData, setMapData] = useState<HostelMapData | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState<string | undefined>(undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<string | "all">("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMapData = async (hId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHostelMapDataAction(hId);
      if (res.success && res.data) {
        setMapData(res.data);
        if (res.data.selectedHostel) {
          setSelectedHostelId(res.data.selectedHostel.id);
        }
      } else {
        setError(res.error || "Failed to load visual hostel map.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading map data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getHostelMapDataAction(selectedHostelId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setMapData(res.data);
          if (res.data.selectedHostel) {
            setSelectedHostelId(res.data.selectedHostel.id);
          }
        } else {
          setError(res.error || "Failed to load map data.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error loading map data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedHostelId]);

  if (loading && !mapData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">Loading interactive visual hostel map...</p>
      </div>
    );
  }

  if (error || !mapData || mapData.hostels.length === 0) {
    return (
      <Card className="glass-card border-slate-800 p-8 text-center max-w-lg mx-auto">
        <Building2 className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Hostel Structure Found</h3>
        <p className="text-xs text-slate-400 mb-4">
          {error || "Add hostels, floors, and rooms to view the visual layout map."}
        </p>
        <Button size="sm" onClick={() => fetchMapData(selectedHostelId)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Reload Visual Map
        </Button>
      </Card>
    );
  }

  const activeHostel = mapData.selectedHostel;
  const filteredFloors =
    selectedFloorId === "all"
      ? mapData.floors
      : mapData.floors.filter((f) => f.id === selectedFloorId);

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Visual Architectural Layout
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            {activeHostel?.name} Floor Map
          </h2>
        </div>

        {/* Hostel Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="hostel-selector-select" className="text-xs text-slate-400 font-mono">Select Hostel Block:</label>
          <select
            id="hostel-selector-select"
            value={selectedHostelId || ""}
            onChange={(e) => {
              setSelectedHostelId(e.target.value);
              setSelectedFloorId("all");
              fetchMapData(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            {mapData.hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.code})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchMapData(selectedHostelId)}
            className="border-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Operational Summary & Legend Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Rooms */}
        <div className="rounded-xl glass-card border-slate-800 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Rooms</span>
            <span className="text-xl font-extrabold text-white">{mapData.summary.totalRooms}</span>
          </div>
          <Building2 className="h-6 w-6 text-slate-500 opacity-60" />
        </div>

        {/* Clean Rooms */}
        <div className="rounded-xl glass-card border-emerald-500/30 bg-emerald-950/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-emerald-400 block">Clean / No Issues</span>
            <span className="text-xl font-extrabold text-emerald-300">{mapData.summary.cleanRooms}</span>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-400 opacity-80" />
        </div>

        {/* Non-Critical Rooms */}
        <div className="rounded-xl glass-card border-amber-500/30 bg-amber-950/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-amber-400 block">Active Non-Critical</span>
            <span className="text-xl font-extrabold text-amber-300">{mapData.summary.nonCriticalRooms}</span>
          </div>
          <Wrench className="h-6 w-6 text-amber-400 opacity-80" />
        </div>

        {/* Critical Rooms */}
        <div className="rounded-xl glass-card border-rose-500/30 bg-rose-950/10 p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-rose-400 block">🚨 Critical / Urgent</span>
            <span className="text-xl font-extrabold text-rose-300">{mapData.summary.criticalRooms}</span>
          </div>
          <ShieldAlert className="h-6 w-6 text-rose-400 opacity-80 animate-pulse" />
        </div>
      </div>

      {/* Floor Filter Tabs */}
      {mapData.floors.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFloorId("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              selectedFloorId === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Floors ({mapData.summary.totalRooms} Rooms)
          </button>

          {mapData.floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => setSelectedFloorId(floor.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                selectedFloorId === floor.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Floor {floor.floor_number} {floor.name ? `(${floor.name})` : ""} ({floor.rooms.length} Rooms)
            </button>
          ))}
        </div>
      )}

      {/* Floor Grid Layout */}
      <div className="space-y-6">
        {filteredFloors.map((floor) => (
          <Card key={floor.id} className="glass-card border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-900/60 border-b border-slate-800 py-3.5 px-6">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  Floor {floor.floor_number} {floor.name ? `• ${floor.name}` : ""}
                </span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  {floor.rooms.length} Rooms Assigned
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {floor.rooms.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No rooms added to this floor yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {floor.rooms.map((roomTile) => (
                    <RoomGridTile
                      key={roomTile.id}
                      tile={roomTile}
                      onSelect={() => setSelectedRoomId(roomTile.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Details Modal */}
      <RoomDetailsModal
        roomId={selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
      />
    </div>
  );
}

function RoomGridTile({
  tile,
  onSelect,
}: {
  tile: RoomMapTile;
  onSelect: () => void;
}) {
  let styleClasses = "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 text-emerald-300";
  let badgeColor = "bg-emerald-900/60 text-emerald-300 border-emerald-700";
  let stateText = "Clean";

  if (tile.issue_state === "has_critical") {
    styleClasses = "bg-rose-950/30 border-rose-500/80 hover:border-rose-400 text-rose-200 shadow-md shadow-rose-950/50 animate-pulse";
    badgeColor = "bg-rose-950 text-rose-300 border-rose-800";
    stateText = `${tile.critical_issue_count} Critical`;
  } else if (tile.issue_state === "has_active_issue") {
    styleClasses = "bg-amber-950/25 border-amber-500/50 hover:border-amber-400 text-amber-200";
    badgeColor = "bg-amber-950 text-amber-300 border-amber-800";
    stateText = `${tile.active_issue_count} Active`;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex flex-col justify-between h-32 ${styleClasses}`}
    >
      <div className="flex items-center justify-between gap-1 w-full">
        <span className="font-extrabold text-base font-mono text-white group-hover:text-indigo-300 transition-colors">
          R-{tile.room_number}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
          {stateText}
        </span>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-mono text-slate-300 capitalize block truncate">
          {tile.room_type} ({tile.capacity} Beds)
        </span>

        {tile.active_issue_count > 0 ? (
          <span className="text-[10px] text-slate-300 line-clamp-1 block">
            ⚠️ {tile.active_issues_summary[0]?.title}
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400/90 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Operational
          </span>
        )}
      </div>

      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-white/10 w-full">
        <span>Click for details</span>
        <Info className="h-3 w-3 text-slate-400 group-hover:text-white" />
      </div>
    </button>
  );
}
