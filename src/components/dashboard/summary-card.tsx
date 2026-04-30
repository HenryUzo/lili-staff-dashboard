import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function SummaryCard({ title, value, hint, icon: Icon }: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-accent to-primary/40" />
      <CardContent className="flex items-start justify-between gap-4 py-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-semibold text-foreground">{value}</h3>
            <ArrowUpRight className="mb-1 h-4 w-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
