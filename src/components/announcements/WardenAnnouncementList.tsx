"use client";

import { useState } from "react";
import {
  Megaphone,
  Plus,
  Building2,
  Layers,
  DoorOpen,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";
import {
  updateAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementRow,
} from "@/app/announcements/announcement-actions";

interface WardenAnnouncementListProps {
  initialAnnouncements: AnnouncementRow[];
}

export function WardenAnnouncementList({
  initialAnnouncements,
}: WardenAnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(initialAnnouncements);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleTogglePublish = async (ann: AnnouncementRow) => {
    setUpdatingId(ann.id);
    try {
      const nextState = !ann.is_published;
      const res = await updateAnnouncementAction({
        id: ann.id,
        isPublished: nextState,
      });

      if (res.success) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === ann.id ? { ...item, is_published: nextState } : item
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setDeletingId(id);
    try {
      const res = await deleteAnnouncementAction(id);
      if (res.success) {
        setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewSuccess = (newAnn: AnnouncementRow) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Megaphone className="h-4 w-4" /> Warden Announcement Suite
          </div>
          <h1 className="text-2xl font-extrabold text-white">Targeted Broadcast Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, publish, and target official notices to specific rooms, floors, or hostels.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-amber-500/20 shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="glass-card border-slate-800 text-center py-12 p-6">
          <Megaphone className="h-10 w-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white mb-1">No Announcements Created</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No broadcast notices have been created yet. Click below to create your first announcement.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Create Announcement
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className="glass-card border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TargetBadge announcement={ann} />

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          ann.is_published
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        {ann.is_published ? "Published" : "Draft / Unpublished"}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white leading-snug">{ann.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(ann)}
                      disabled={updatingId === ann.id}
                      className="gap-1.5 text-xs text-slate-300 hover:text-white"
                    >
                      {updatingId === ann.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : ann.is_published ? (
                        <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      <span>{ann.is_published ? "Unpublish" : "Publish"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(ann.id)}
                      disabled={deletingId === ann.id}
                      className="gap-1 text-xs text-rose-400 hover:text-rose-300"
                    >
                      {deletingId === ann.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {ann.content}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    Author: {ann.author?.full_name || ann.author?.email || "Warden"}
                  </span>

                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" />
                    {ann.created_at.split("T")[0]}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateAnnouncementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleNewSuccess}
      />
    </div>
  );
}

function TargetBadge({ announcement }: { announcement: AnnouncementRow }) {
  switch (announcement.target_type) {
    case "hostel":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          <Building2 className="h-3 w-3 text-indigo-400" />
          {announcement.target_hostel?.name || "Hostel Target"}
        </span>
      );
    case "floor":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
          <Layers className="h-3 w-3 text-violet-400" />
          Floor {announcement.target_floor?.floor_number || ""} Target
        </span>
      );
    case "room":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
          <DoorOpen className="h-3 w-3 text-rose-400" />
          Room {announcement.target_room?.room_number || ""} Target
        </span>
      );
    case "everyone":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
          <Megaphone className="h-3 w-3 text-amber-400" />
          Global (Everyone)
        </span>
      );
  }
}
