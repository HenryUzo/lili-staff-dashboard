interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">{eyebrow}</p>
      <h1 className="font-serif text-4xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
