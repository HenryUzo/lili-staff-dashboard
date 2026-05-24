import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/http";
import { fetchStaffFile } from "@/api/files";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import emptyFilesStateIllustration from "@/assets/illustrations/empty-files-state-illustration.png";
import { getFileKind } from "@/lib/format";
import type { UploadedFile } from "@/types/api";

function getAccessibleUrl(file: UploadedFile) {
  return file.publicUrl ?? null;
}

function clickTemporaryLink(url: string, options?: { download?: string; target?: "_blank" }) {
  const anchor = document.createElement("a");
  anchor.href = url;

  if (options?.download) {
    anchor.download = options.download;
  }

  if (options?.target) {
    anchor.target = options.target;
    anchor.rel = "noreferrer";
  }

  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function FilePreviewList({ files }: { files: UploadedFile[] }) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<{ fileId: string; action: "preview" | "open" | "download" } | null>(
    null
  );
  const resolvedUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    resolvedUrlsRef.current = resolvedUrls;
  }, [resolvedUrls]);

  useEffect(() => {
    return () => {
      Object.values(resolvedUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? null,
    [activeFileId, files]
  );
  const activeFileUrl = activeFile ? resolvedUrls[activeFile.id] ?? getAccessibleUrl(activeFile) : null;

  async function resolveFileUrl(file: UploadedFile) {
    const directUrl = getAccessibleUrl(file);
    if (directUrl) {
      return directUrl;
    }

    const existingResolvedUrl = resolvedUrlsRef.current[file.id];
    if (existingResolvedUrl) {
      return existingResolvedUrl;
    }

    const blob = await fetchStaffFile(file.id);
    const objectUrl = URL.createObjectURL(blob);

    setResolvedUrls((current) => {
      if (current[file.id]) {
        URL.revokeObjectURL(objectUrl);
        return current;
      }

      const next = {
        ...current,
        [file.id]: objectUrl
      };
      resolvedUrlsRef.current = next;
      return next;
    });

    return objectUrl;
  }

  async function withResolvedFileUrl(
    file: UploadedFile,
    action: "preview" | "open" | "download",
    handler: (url: string) => void
  ) {
    setPendingAction({ fileId: file.id, action });

    try {
      const url = await resolveFileUrl(file);
      handler(url);
    } catch (error) {
      const fallback =
        action === "preview"
          ? "Unable to load file preview"
          : action === "open"
            ? "Unable to open file"
            : "Unable to download file";

      toast.error(getErrorMessage(error, fallback));
    } finally {
      setPendingAction((current) => (current?.fileId === file.id && current.action === action ? null : current));
    }
  }

  function isPending(fileId: string, action: "preview" | "open" | "download") {
    return pendingAction?.fileId === fileId && pendingAction.action === action;
  }

  if (files.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center border-dashed p-8 text-center text-sm text-muted-foreground">
        <img src={emptyFilesStateIllustration} alt="" aria-hidden="true" className="mb-4 w-36" />
        <p className="font-semibold text-foreground">No files attached</p>
        <p className="mt-1">Uploaded medical records will appear here.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => {
          const fileKind = getFileKind(file);
          const Icon = fileKind === "image" ? ImageIcon : FileText;

          return (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/45 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.mimeType} - {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isPending(file.id, "preview")}
                  onClick={() =>
                    void withResolvedFileUrl(file, "preview", () => {
                      setActiveFileId(file.id);
                    })
                  }
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending(file.id, "open")}
                  onClick={() =>
                    void withResolvedFileUrl(file, "open", (url) => {
                      clickTemporaryLink(url, { target: "_blank" });
                    })
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending(file.id, "download")}
                  onClick={() =>
                    void withResolvedFileUrl(file, "download", (url) => {
                      clickTemporaryLink(url, { download: file.originalName });
                    })
                  }
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(activeFile)} onOpenChange={(open) => !open && setActiveFileId(null)}>
        {activeFile ? (
          <DialogContent className="w-[min(980px,calc(100vw-24px))] overflow-hidden rounded-[28px] p-0">
            <DialogHeader className="border-b border-border bg-white">
              <DialogTitle>{activeFile.originalName}</DialogTitle>
              <DialogDescription>{activeFile.mimeType}</DialogDescription>
            </DialogHeader>
            <div className="min-h-[70vh] bg-background p-4">
              {activeFileUrl ? (
                getFileKind(activeFile) === "image" ? (
                  <img
                    src={activeFileUrl}
                    alt={activeFile.originalName}
                    className="mx-auto max-h-[65vh] rounded-2xl object-contain shadow-soft"
                  />
                ) : (
                  <iframe
                    src={activeFileUrl}
                    title={activeFile.originalName}
                    className="h-[65vh] w-full rounded-2xl border border-border bg-white"
                  />
                )
              ) : (
                <div className="flex h-[65vh] items-center justify-center rounded-2xl border border-dashed border-border bg-white text-sm text-muted-foreground">
                  Preview unavailable.
                </div>
              )}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
