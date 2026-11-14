import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnalysisLoader({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 1800);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div role="status" aria-live="polite" className="scanline rounded-2xl border border-primary/40 bg-card-gradient p-6 shadow-glow">
      <div className="flex items-center gap-4">
        <div className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-primary/60" />
          <span className="absolute inset-2 animate-pulse-glow rounded-full border border-primary-glow/60" />
          <Loader2 className="size-6 animate-spin text-primary-glow" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold">Analysing…</p>
          <p className="font-mono text-xs text-muted-foreground">This usually takes 10–30 seconds</p>
        </div>
      </div>
      <ul className="mt-6 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 font-mono text-sm transition-opacity", i > active && "opacity-40")}>
            {i < active ? (
              <Check className="size-4 text-success" />
            ) : i === active ? (
              <Loader2 className="size-4 animate-spin text-primary-glow" />
            ) : (
              <span className="size-4 rounded-full border border-border" />
            )}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
