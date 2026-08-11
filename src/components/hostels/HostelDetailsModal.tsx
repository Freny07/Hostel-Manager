"use client";

import { X, Building2, Layers, MapPin, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HostelWithCounts } from "./HostelCard";

interface HostelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostel: HostelWithCounts | null;
}

export function HostelDetailsModal({
  isOpen,
  onClose,
  hostel,
}: HostelDetailsModalProps) {
  if (!isOpen || !hostel) return null;

  const isSafeToDelete = (hostel.floor_count ?? 0) === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white leading-tight">
                {hostel.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono">Code: {hostel.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Key attributes grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3.5 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Gender Type</span>
              <p className="text-sm font-medium text-white capitalize">
                {hostel.gender_type} Residence
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-3.5 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Total Floors</span>
              <p className="text-sm font-medium text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-400" />
                {hostel.total_floors} {hostel.total_floors === 1 ? "Floor" : "Floors"}
              </p>
            </div>
          </div>

          {/* Physical Address */}
          <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-mono tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-violet-400" />
              <span>Campus Address</span>
            </div>
            <p className="text-sm text-slate-200">
              {hostel.address || <span className="text-slate-500 italic">No physical address specified.</span>}
            </p>
          </div>

          {/* Safety & Deletion Status */}
          <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Deletion Status</span>
              {isSafeToDelete ? (
                <Badge variant="success" className="gap-1 text-xs py-0.5">
                  <ShieldCheck className="h-3 w-3" /> Safe to delete
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-xs py-0.5 border-amber-500/30 text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Linked to Sub-entities
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isSafeToDelete
                ? "This hostel has no configured floors or active room dependencies. It can be safely removed."
                : `This hostel currently has ${hostel.floor_count} configured floor(s). Administrative policy prevents direct deletion of hostels with active structures.`}
            </p>
          </div>

          {/* Metadata Timestamps */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Created: {new Date(hostel.created_at).toLocaleString()}</span>
            </div>
            {hostel.updated_at && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Updated: {new Date(hostel.updated_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3.5 flex justify-end bg-slate-900/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
