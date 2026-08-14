"use client";

import { useState } from "react";
import { Megaphone, Building2, User, Clock, Layers, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnnouncementRow } from "@/app/announcements/announcement-actions";

interface StudentAnnouncementFeedProps {
  initialAnnouncements: AnnouncementRow[];
}

export function StudentAnnouncementFeed({
  initialAnnouncements,
}: StudentAnnouncementFeedProps) {
  const [announcements] = useState<AnnouncementRow[]>(initialAnnouncements);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card border-slate-800 p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Megaphone className="h-4 w-4" /> Official Notice Board
          </div>
          <h1 className="text-2xl font-extrabold text-white">Hostel Announcements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated with official broadcasts and targeted notices from warden administration.
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <Card className="glass-card border-slate-800 text-center py-12 p-6">
          <Megaphone className="h-10 w-10 text-amber-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">No Active Announcements</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no relevant announcements broadcast to your room, floor, or hostel block.
          </p>
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
                    <TargetBadge announcement={ann} />
                    <h2 className="text-lg font-bold text-white leading-snug">{ann.title}</h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{ann.published_at.split("T")[0]}</span>
                  </div>
                </div>

                {/* Announcement Content Box */}
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
                  {ann.content}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    Posted by: {ann.author?.full_name || ann.author?.email || "Hostel Warden"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TargetBadge({ announcement }: { announcement: AnnouncementRow }) {
  switch (announcement.target_type) {
    case "hostel":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
          <Building2 className="h-3 w-3 text-indigo-400" />
          {announcement.target_hostel?.name || "Hostel Notice"}
        </span>
      );
    case "floor":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
          <Layers className="h-3 w-3 text-violet-400" />
          Floor {announcement.target_floor?.floor_number || ""} Notice
        </span>
      );
    case "room":
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
          <DoorOpen className="h-3 w-3 text-rose-400" />
          Room {announcement.target_room?.room_number || ""} Notice
        </span>
      );
    case "everyone":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
          <Megaphone className="h-3 w-3 text-amber-400" />
          Global Broadcast
        </span>
      );
  }
}
