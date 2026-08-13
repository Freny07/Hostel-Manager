"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Hand, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  getIssueAffectedDetailsAction,
  toggleAffectedStatusAction,
  type AffectedStudentInfo,
} from "@/app/issues/issue-actions";

interface AffectedStudentsBadgeProps {
  issueId: string;
  isStudent: boolean;
  onCountChange?: (count: number) => void;
}

export function AffectedStudentsBadge({
  issueId,
  isStudent,
  onCountChange,
}: AffectedStudentsBadgeProps) {
  const [count, setCount] = useState(0);
  const [isUserAffected, setIsUserAffected] = useState(false);
  const [affectedStudents, setAffectedStudents] = useState<AffectedStudentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await getIssueAffectedDetailsAction(issueId);
      if (res.success && res.data) {
        setCount(res.data.count);
        setIsUserAffected(res.data.isUserAffected);
        setAffectedStudents(res.data.students);
        if (onCountChange) onCountChange(res.data.count);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [issueId, onCountChange]);

  useEffect(() => {
    let isMounted = true;
    getIssueAffectedDetailsAction(issueId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setCount(res.data.count);
          setIsUserAffected(res.data.isUserAffected);
          setAffectedStudents(res.data.students);
          if (onCountChange) onCountChange(res.data.count);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueId, onCountChange]);

  // Scoped Supabase Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`realtime_affected_${issueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issue_affected_students",
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          fetchDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, fetchDetails]);

  const handleToggle = async () => {
    if (!isStudent) return;

    setIsToggling(true);
    try {
      const res = await toggleAffectedStatusAction(issueId);
      if (res.success && res.data) {
        setIsUserAffected(res.data.isAffected);
        setCount(res.data.count);
        if (onCountChange) onCountChange(res.data.count);
      }
    } catch {
      // ignore
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Affected Count Pill */}
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-amber-300 border border-slate-800 shadow-sm">
        <Users className="h-3.5 w-3.5 text-amber-400" />
        <span>{count} {count === 1 ? "Student Affected" : "Students Affected"}</span>
      </span>

      {/* Student "I'm Affected Too" Toggle Button */}
      {isStudent && (
        <Button
          type="button"
          size="sm"
          onClick={handleToggle}
          disabled={isToggling || isLoading}
          variant={isUserAffected ? "secondary" : "outline"}
          className={`gap-1.5 text-xs font-semibold transition-all ${
            isUserAffected
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
              : "border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40"
          }`}
        >
          {isToggling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
          ) : isUserAffected ? (
            <Check className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Hand className="h-3.5 w-3.5 text-amber-400" />
          )}

          <span>
            {isUserAffected ? "You Marked Affected (Click to remove)" : "I'm Affected Too"}
          </span>
        </Button>
      )}

      {/* Affected Residents Detail Pill for Staff */}
      {!isStudent && affectedStudents.length > 0 && (
        <div className="text-[11px] text-slate-400 font-mono">
          ({affectedStudents.length} additional resident {affectedStudents.length === 1 ? "report" : "reports"})
        </div>
      )}
    </div>
  );
}
