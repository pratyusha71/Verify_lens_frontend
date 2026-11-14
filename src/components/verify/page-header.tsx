import type { LucideIcon } from "lucide-react";

export function PageHeader({ icon: Icon, eyebrow, title, description }: { icon: LucideIcon; eyebrow: string; title: string; description: string }) {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-hero">
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex animate-fade-up items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary-glow">
          <Icon className="size-4" /> {eyebrow}
        </div>
        <h1 className="mt-3 max-w-3xl animate-fade-up text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl animate-fade-up text-muted-foreground md:text-lg">{description}</p>
      </div>
    </div>
  );
}
