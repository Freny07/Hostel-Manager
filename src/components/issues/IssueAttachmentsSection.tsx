"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paperclip,
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getIssueAttachmentsAction,
  uploadIssueAttachmentAction,
  deleteIssueAttachmentAction,
  type AttachmentWithSignedUrl,
} from "@/app/issues/issue-actions";

interface IssueAttachmentsSectionProps {
  issueId: string;
}

export function IssueAttachmentsSection({
  issueId,
}: IssueAttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<AttachmentWithSignedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    getIssueAttachmentsAction(issueId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setAttachments(res.data);
        } else if (!res.success) {
          setErrorMessage(res.error || "Failed to load attachments.");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err instanceof Error ? err.message : "An error occurred.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [issueId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side quick checks
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setErrorMessage("File size exceeds maximum allowed 5 MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!ALLOWED.includes(file.type)) {
      setErrorMessage("Invalid file format. Only JPEG, PNG, WebP, GIF photos or PDF documents are permitted.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("issueId", issueId);
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await uploadIssueAttachmentAction(formData);
      if (res.success && res.data) {
        setSuccessMessage(`File "${file.name}" uploaded successfully.`);
        setAttachments((prev) => [res.data!, ...prev]);
      } else {
        setErrorMessage(res.error || "Upload failed.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete attachment "${fileName}"?`)) return;

    setDeletingId(attachmentId);
    setErrorMessage(null);
    try {
      const res = await deleteIssueAttachmentAction(attachmentId);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        setSuccessMessage(`Attachment deleted.`);
      } else {
        setErrorMessage(res.error || "Failed to delete attachment.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Delete error.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImageMime = (mimeType?: string | null) => {
    return !!mimeType && mimeType.startsWith("image/");
  };

  return (
    <Card className="glass-card border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-indigo-400" />
          <CardTitle className="text-sm font-bold text-white">
            Issue Attachments ({attachments.length})
          </CardTitle>
        </div>

        <label htmlFor="file-upload-input" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 text-xs font-semibold border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40 hover:text-white"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
            )}
            Upload File / Photo
          </Button>
        </label>
        <input
          id="file-upload-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
        />
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 mx-auto text-slate-500">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No attachments added yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Upload inspection photos, damage receipts, or work order PDFs (JPEG, PNG, WebP, GIF, PDF up to 5 MB).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-3 flex gap-3 items-start transition-all overflow-hidden"
              >
                {/* Thumbnail or Icon */}
                {isImageMime(att.file_type) && att.signed_url ? (
                  <a
                    href={att.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative shrink-0 h-16 w-16 rounded-lg bg-slate-900 overflow-hidden border border-slate-800 group-hover:border-indigo-500/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.signed_url}
                      alt={att.file_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </a>
                ) : (
                  <div className="shrink-0 h-16 w-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <FileText className="h-7 w-7 text-indigo-400" />
                  </div>
                )}

                {/* File Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-slate-200 truncate pr-6" title={att.file_name}>
                    {att.file_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {formatFileSize(att.file_size)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {att.uploader?.first_name ? `${att.uploader.first_name} ${att.uploader.last_name}` : "User"} •{" "}
                    {new Date(att.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  {att.signed_url && (
                    <a
                      href={att.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 pt-0.5"
                    >
                      <span>View File</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(att.id, att.file_name)}
                  disabled={deletingId === att.id}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Delete Attachment"
                >
                  {deletingId === att.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
