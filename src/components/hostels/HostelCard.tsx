"use client";

import { Building2, Layers, MapPin, Eye, Edit2, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HostelRow } from "@/app/hostels/hostel-actions";
import { formatDisplayDate } from "@/lib/date-utils";

export interface HostelWithCounts extends HostelRow {
  floor_count?: number;
}

interface HostelCardProps {
  hostel: HostelWithCounts;
  canManage: boolean;
  onView: (hostel: HostelWithCounts) => void;
  onEdit: (hostel: HostelWithCounts) => void;
  onDelete: (hostel: HostelWithCounts) => void;
  onManageFloors: (hostel: HostelWithCounts) => void;
}

export function HostelCard({
  hostel,
  canManage,
  onView,
  onEdit,
  onDelete,
  onManageFloors,
}: HostelCardProps) {
  const getGenderBadge = (gender: HostelRow["gender_type"]) => {
    switch (gender) {
      case "male":
        return <Badge variant="accent">Male Residence</Badge>;
      case "female":
        return <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-pink-500/20">Female Residence</Badge>;
      case "co-ed":
      default:
        return <Badge variant="outline" className="text-violet-400 border-violet-500/30">Co-Ed Residence</Badge>;
    }
  };

  const isSafeToDelete = (hostel.floor_count ?? 0) === 0;

  return (
    <Card className="glass-card border-slate-800 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 text-violet-400 group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white tracking-tight leading-snug">
                {hostel.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {hostel.code}
                </span>
                {getGenderBadge(hostel.gender_type)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2 text-sm space-y-2.5">
        <div className="flex items-center gap-2 text-slate-300">
          <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">{hostel.total_floors}</strong> {hostel.total_floors === 1 ? "Floor" : "Floors"} Configured
          </span>
        </div>

        {hostel.address ? (
          <div className="flex items-start gap-2 text-slate-400 text-xs line-clamp-2">
            <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{hostel.address}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic">
            <MapPin className="h-4 w-4 text-slate-600 shrink-0" />
            <span>No physical address provided</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            {isSafeToDelete ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Safe to delete
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1" title={`${hostel.floor_count} linked floor(s)`}>
                <AlertCircle className="h-3.5 w-3.5" /> Has linked floors ({hostel.floor_count})
              </span>
            )}
          </span>
          <span suppressHydrationWarning>Added {formatDisplayDate(hostel.created_at)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onManageFloors(hostel)}
          className="gap-1.5 text-xs text-indigo-300 border-indigo-500/30 hover:text-white hover:bg-indigo-950/40"
        >
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          Floors
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(hostel)}
          className="gap-1.5 text-xs text-slate-300 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </Button>

        {canManage && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(hostel)}
              className="gap-1.5 text-xs text-slate-300 hover:text-white"
            >
              <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(hostel)}
              className="gap-1.5 text-xs text-rose-400 border-rose-500/20 hover:bg-rose-950/40 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
