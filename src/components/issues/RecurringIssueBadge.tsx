"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  detectRecurringIssueAction,
} from "@/app/issues/issue-actions";
import type { RecurringAnalysisResult } from "@/lib/issues/recurring-detector";

interface RecurringIssueBadgeProps {
  issueId: string;
}

export function RecurringIssueBadge({ issueId }: RecurringIssueBadgeProps) {
  const [result, setResult] = useState<RecurringAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;

    detectRecurringIssueAction(issueId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setResult(res.data);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
        <span>Evaluating recurring issue pattern history...</span>
      </div>
    );
  }

  if (!result || !result.isRecurring) {
    return null; // Do not display if pattern is weak or false
  }

  const isHighConf = result.confidence === "high";

  return (
    <Card
      className={`glass-card border-l-4 overflow-hidden transition-all ${
        isHighConf
          ? "border-amber-500 bg-amber-950/20 border-t-slate-800 border-r-slate-800 border-b-slate-800"
          : "border-indigo-500 bg-indigo-950/20 border-t-slate-800 border-r-slate-800 border-b-slate-800"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isHighConf
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              }`}
            >
              <RotateCcw className="h-4 w-4 animate-spin-slow" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Recurring Issue Detected
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isHighConf
                      ? "bg-amber-950 text-amber-300 border-amber-800"
                      : "bg-indigo-950 text-indigo-300 border-indigo-800"
                  }`}
                >
                  {isHighConf ? "High Frequency Pattern" : "Moderate Recurrence"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium pt-0.5">
                {result.reason}
              </p>
            </div>
          </div>

          {result.previousIssues.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5 text-xs text-slate-300 hover:text-white"
            >
              <History className="h-3.5 w-3.5 text-amber-400" />
              <span>{result.previousIssues.length} Prior Complaint(s)</span>
              {showHistory ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>

        {/* Collapsible Historical Complaints Breakdown */}
        {showHistory && result.previousIssues.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Prior Historical Tickets for Location & Category:
            </span>

            <div className="space-y-2">
              {result.previousIssues.map((prev) => (
                <div
                  key={prev.id}
                  className="rounded-lg bg-slate-950 border border-slate-800/80 p-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-white truncate block">
                      {prev.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      Logged on {prev.created_at.split("T")[0]} • Priority: {prev.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-slate-900 text-slate-300 border border-slate-700">
                      {prev.status}
                    </span>

                    <Link
                      href={`/issues/${prev.id}`}
                      target="_blank"
                      className="text-indigo-400 hover:text-indigo-300 p-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
