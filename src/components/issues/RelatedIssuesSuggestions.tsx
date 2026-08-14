"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Building2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRelatedIssueSuggestionsAction,
  confirmRelatedIssueAction,
  dismissRelatedIssueAction,
  analyzeRelatedIssuesAction,
  type IssueRelationSuggestion,
} from "@/app/issues/issue-actions";

interface RelatedIssuesSuggestionsProps {
  issueId: string;
}

export function RelatedIssuesSuggestions({
  issueId,
}: RelatedIssuesSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<IssueRelationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await getRelatedIssueSuggestionsAction(issueId);
      if (res.success && res.data) {
        setSuggestions(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    let isMounted = true;
    getRelatedIssueSuggestionsAction(issueId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setSuggestions(res.data);
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
  }, [issueId]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      await analyzeRelatedIssuesAction(issueId);
      await fetchSuggestions();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error analyzing similarity."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async (relationId: string) => {
    setActionId(relationId);
    setErrorMessage(null);
    try {
      const res = await confirmRelatedIssueAction(relationId);
      if (res.success) {
        setSuggestions((prev) =>
          prev.map((item) =>
            item.id === relationId
              ? { ...item, relation_type: "confirmed_related" }
              : item
          )
        );
      } else {
        setErrorMessage(res.error || "Failed to confirm relation.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error confirming relation."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDismiss = async (relationId: string) => {
    setActionId(relationId);
    setErrorMessage(null);
    try {
      const res = await dismissRelatedIssueAction(relationId);
      if (res.success) {
        setSuggestions((prev) => prev.filter((item) => item.id !== relationId));
      } else {
        setErrorMessage(res.error || "Failed to dismiss relation.");
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error dismissing relation."
      );
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-slate-800">
        <CardContent className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          Checking for ML similarity suggestions...
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="glass-card border-slate-800/80">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>No potential duplicate or related issues detected yet.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="gap-1.5 text-xs border-slate-800 text-slate-300 hover:text-white shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            )}
            Run Similarity Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-indigo-500/30 bg-indigo-950/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <CardTitle className="text-sm font-bold text-white">
            ML Related Issue Suggestions ({suggestions.length})
          </CardTitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="gap-1.5 text-xs text-indigo-300 hover:text-white"
        >
          {isAnalyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          )}
          Re-Analyze
        </Button>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {suggestions.map((suggestion) => {
          const matchPercent = Math.round(suggestion.similarity_score * 100);
          const target = suggestion.target_issue;
          if (!target) return null;

          const isConfirmed = suggestion.relation_type === "confirmed_related";

          return (
            <div
              key={suggestion.id}
              className={`rounded-xl p-4 border transition-all space-y-3 ${
                isConfirmed
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-slate-950 border-indigo-500/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      Issue #{target.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        matchPercent >= 80
                          ? "bg-indigo-950 text-indigo-300 border-indigo-700"
                          : "bg-amber-950 text-amber-300 border-amber-800"
                      }`}
                    >
                      {matchPercent}% Similarity Match
                    </span>
                    {isConfirmed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Confirmed Related
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white pt-1">
                    {target.title}
                  </h4>
                </div>

                <Link
                  href={`/issues/${target.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>View Ticket</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {target.description}
              </p>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="capitalize">Category: {target.category}</span>
                  {target.hostel && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-amber-400" />
                      {target.hostel.name} {target.room ? `• Room ${target.room.room_number}` : ""}
                    </span>
                  )}
                </div>

                {!isConfirmed && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleConfirm(suggestion.id)}
                      disabled={actionId === suggestion.id}
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-7 px-3"
                    >
                      {actionId === suggestion.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Link2 className="h-3 w-3" />
                      )}
                      Mark as Related
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(suggestion.id)}
                      disabled={actionId === suggestion.id}
                      className="gap-1 text-xs text-slate-400 hover:text-rose-300 h-7 px-2"
                    >
                      <XCircle className="h-3 w-3" /> Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
