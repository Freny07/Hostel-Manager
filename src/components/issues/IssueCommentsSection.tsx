"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  getIssueCommentsAction,
  addIssueCommentAction,
  deleteIssueCommentAction,
  type DetailedIssueComment,
} from "@/app/issues/issue-actions";

interface IssueCommentsSectionProps {
  issueId: string;
  isStudent: boolean;
}

export function IssueCommentsSection({
  issueId,
  isStudent,
}: IssueCommentsSectionProps) {
  const [comments, setComments] = useState<DetailedIssueComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await getIssueCommentsAction(issueId);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    let isMounted = true;
    getIssueCommentsAction(issueId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setComments(res.data);
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

  // Scoped Supabase Realtime subscription for instant comments sync
  useEffect(() => {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`realtime_comments_${issueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issue_comments",
          filter: `issue_id=eq.${issueId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const content = newComment.trim();
    if (!content) {
      setErrorMessage("Please enter a comment before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addIssueCommentAction({
        issueId,
        content,
        isInternal: !isStudent && isInternal,
      });

      if (res.success && res.data) {
        setNewComment("");
        setIsInternal(false);
        setComments((prev) => {
          if (prev.some((c) => c.id === res.data!.id)) return prev;
          return [...prev, res.data!];
        });
      } else {
        setErrorMessage(res.error || "Failed to post comment.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error posting comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setDeletingId(commentId);
    setErrorMessage(null);
    try {
      const res = await deleteIssueCommentAction(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        setErrorMessage(res.error || "Failed to delete comment.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error deleting comment.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getRoleBadge = (roleName?: string | null) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
      case "warden":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
            {roleName.toUpperCase()}
          </span>
        );
      case "staff":
      case "maintenance":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            STAFF
          </span>
        );
      case "student":
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
            STUDENT
          </span>
        );
    }
  };

  return (
    <Card className="glass-card border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm font-bold text-white">
            Issue Discussion & Notes ({comments.length})
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Comment Thread List */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Loading discussion...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
            No comments yet. Be the first to start a conversation about this ticket.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const authorName = comment.author
                ? `${comment.author.first_name} ${comment.author.last_name}`
                : "User";
              const initials = comment.author
                ? `${comment.author.first_name[0]}${comment.author.last_name[0]}`.toUpperCase()
                : "U";

              return (
                <div
                  key={comment.id}
                  className={`group relative rounded-xl p-4 transition-all border ${
                    comment.is_internal
                      ? "bg-amber-950/20 border-amber-500/30"
                      : "bg-slate-950 border-slate-800/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-300 shadow-inner">
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{authorName}</span>
                          {getRoleBadge(comment.author?.role?.name)}
                          {comment.is_internal && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/50 text-amber-300">
                              <Lock className="h-2.5 w-2.5" /> Staff Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimestamp(comment.created_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
                      title="Delete comment"
                    >
                      {deletingId === comment.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Comment Content */}
                  <p className="text-xs text-slate-200 leading-relaxed pt-3 whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Comment Posting Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or update note for this maintenance ticket..."
              disabled={isSubmitting}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-xs text-slate-100 placeholder:text-slate-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-500">
              {newComment.length} / 2000
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {!isStudent ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <Lock className="h-3 w-3 text-amber-400" /> Mark as Internal Staff Note (hidden from student)
                </span>
              </label>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Posting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
