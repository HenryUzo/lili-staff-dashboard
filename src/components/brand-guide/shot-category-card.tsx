import type { MouseEventHandler } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ShotCategoryCardProps {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  onOpen: MouseEventHandler<HTMLButtonElement>;
}

export function ShotCategoryCard({ title, description, badge, icon: Icon, onOpen }: ShotCategoryCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between rounded-[24px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.96)] shadow-soft">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7F0] text-[#087C48]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[#EAF7F0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#087C48]">
              {badge}
            </span>
            <div>
              <h3 className="text-xl font-extrabold leading-[1.2] text-[#102E24]">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[#5F756C]">{description}</p>
            </div>
          </div>
        </div>

        <Button type="button" variant="outline" className="photoshoot-no-print rounded-2xl border-[#DDEBE2] text-[#087C48]" onClick={onOpen}>
          View Checklist
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
