import type { ReactNode } from "react";

interface PageHeaderProps {
  breadcrumb?: string[];
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ breadcrumb, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        {breadcrumb?.length ? (
          <p className="text-sm font-semibold text-muted-foreground">{breadcrumb.join(" / ")}</p>
        ) : null}
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">{eyebrow}</p>
        <h1 className="font-serif text-4xl font-semibold text-foreground">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="photoshoot-no-print flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
