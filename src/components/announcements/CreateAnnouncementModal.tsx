"use client";

import { useEffect, useState } from "react";
import { Megaphone, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAnnouncementAction,
  getTargetingOptionsAction,
  type AnnouncementRow,
  type TargetingOptions,
} from "@/app/announcements/announcement-actions";

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAnnouncement: AnnouncementRow) => void;
}

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<"everyone" | "hostel" | "floor" | "room">("everyone");
  const [targetHostelId, setTargetHostelId] = useState<string>("");
  const [targetFloorId, setTargetFloorId] = useState<string>("");
  const [targetRoomId, setTargetRoomId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(true);

  const [options, setOptions] = useState<TargetingOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const res = await getTargetingOptionsAction();
        if (!isMounted) return;
        if (res.success && res.data) {
          setOptions(res.data);
          if (res.data.hostels.length > 0) setTargetHostelId(res.data.hostels[0].id);
          if (res.data.floors.length > 0) setTargetFloorId(res.data.floors[0].id);
          if (res.data.rooms.length > 0) setTargetRoomId(res.data.rooms[0].id);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanedTitle = title.trim();
    const cleanedContent = content.trim();

    if (cleanedTitle.length < 3) {
      setErrorMessage("Please enter a title (at least 3 characters).");
      return;
    }

    if (cleanedContent.length < 5) {
      setErrorMessage("Please enter announcement content (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAnnouncementAction({
        title: cleanedTitle,
        content: cleanedContent,
        targetType,
        targetHostelId: targetType === "hostel" ? targetHostelId : null,
        targetFloorId: targetType === "floor" ? targetFloorId : null,
        targetRoomId: targetType === "room" ? targetRoomId : null,
        isPublished,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
        setTitle("");
        setContent("");
      } else {
        setErrorMessage(res.error || "Failed to create announcement.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white space-y-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Targeted Announcement</h2>
              <p className="text-xs text-slate-400">
                Broadcast official notices to students by location or globally.
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ann-title" className="text-xs font-medium text-slate-300">
              Announcement Title
            </Label>
            <Input
              id="ann-title"
              type="text"
              placeholder="e.g. Mandatory Hostel Floor Inspection Tomorrow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-950 border-slate-800 text-white focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-content" className="text-xs font-medium text-slate-300">
              Notice Content & Details
            </Label>
            <textarea
              id="ann-content"
              rows={4}
              placeholder="Provide full details of the announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Target Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="target-type" className="text-xs font-medium text-slate-300">Target Audience</Label>
              <select
                id="target-type"
                value={targetType}
                onChange={(e) =>
                  setTargetType(
                    e.target.value as "everyone" | "hostel" | "floor" | "room"
                  )
                }
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="everyone">📢 Everyone (Global)</option>
                <option value="hostel">🏢 Specific Hostel Block</option>
                <option value="floor">🥞 Specific Floor</option>
                <option value="room">🚪 Specific Room</option>
              </select>
            </div>

            {/* Target Value Selector */}
            {targetType === "hostel" && (
              <div className="space-y-1.5">
                <Label htmlFor="target-hostel" className="text-xs font-medium text-slate-300">Select Hostel</Label>
                {loadingOptions ? (
                  <div className="p-2 text-xs text-slate-400">Loading hostels...</div>
                ) : (
                  <select
                    id="target-hostel"
                    value={targetHostelId}
                    onChange={(e) => setTargetHostelId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {options?.hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {targetType === "floor" && (
              <div className="space-y-1.5">
                <Label htmlFor="target-floor" className="text-xs font-medium text-slate-300">Select Floor</Label>
                {loadingOptions ? (
                  <div className="p-2 text-xs text-slate-400">Loading floors...</div>
                ) : (
                  <select
                    id="target-floor"
                    value={targetFloorId}
                    onChange={(e) => setTargetFloorId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {options?.floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.hostel_name} - Floor {f.floor_number}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {targetType === "room" && (
              <div className="space-y-1.5">
                <Label htmlFor="target-room" className="text-xs font-medium text-slate-300">Select Room</Label>
                {loadingOptions ? (
                  <div className="p-2 text-xs text-slate-400">Loading rooms...</div>
                ) : (
                  <select
                    id="target-room"
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {options?.rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.hostel_name} - Room {r.room_number} (FL {r.floor_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is-published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
            />
            <Label htmlFor="is-published" className="text-xs text-slate-300 cursor-pointer">
              Publish immediately and notify targeted students
            </Label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Broadcast...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Create Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
