import { useMemo, useState } from "react";
import { Download, ExternalLink, Eye, FileText, Image as ImageIcon, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFileKind } from "@/lib/format";
import type { UploadedFile } from "@/types/api";

function getAccessibleUrl(file: UploadedFile) {
  return file.publicUrl ?? null;
}

export function FilePreviewList({ files }: { files: UploadedFile[] }) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? null,
    [activeFileId, files]
  );

  if (files.length === 0) {
    return (
      <Card className="border-dashed p-4 text-sm text-muted-foreground">
        No files were attached to this request.
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => {
          const fileKind = getFileKind(file);
          const accessibleUrl = getAccessibleUrl(file);
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
                    {file.mimeType} · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!accessibleUrl ? (
                    <p className="flex items-center gap-1 text-xs text-warning">
                      <Lock className="h-3.5 w-3.5" />
                      Backend did not provide a public file URL for preview/download.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!accessibleUrl}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" asChild={Boolean(accessibleUrl)}>
                  {accessibleUrl ? (
                    <a href={accessibleUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  ) : (
                    <span>
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </span>
                  )}
                </Button>
                <Button variant="outline" size="sm" asChild={Boolean(accessibleUrl)}>
                  {accessibleUrl ? (
                    <a href={accessibleUrl} download>
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  ) : (
                    <span>
                      <Download className="h-4 w-4" />
                      Download
                    </span>
                  )}
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
              {getAccessibleUrl(activeFile) ? (
                getFileKind(activeFile) === "image" ? (
                  <img
                    src={getAccessibleUrl(activeFile)!}
                    alt={activeFile.originalName}
                    className="mx-auto max-h-[65vh] rounded-2xl object-contain shadow-soft"
                  />
                ) : (
                  <iframe
                    src={getAccessibleUrl(activeFile)!}
                    title={activeFile.originalName}
                    className="h-[65vh] w-full rounded-2xl border border-border bg-white"
                  />
                )
              ) : (
                <div className="flex h-[65vh] items-center justify-center rounded-2xl border border-dashed border-border bg-white text-sm text-muted-foreground">
                  Preview unavailable because the backend response does not include a public file URL.
                </div>
              )}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
