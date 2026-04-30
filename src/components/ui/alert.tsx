import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-secondary/70 p-4 text-sm", className)} {...props} />;
}
