import type { ReactNode } from "react";
import { AlertTriangle, Bot, CheckCircle2, FlaskConical, Info, ListChecks, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  riskLevel,
  SOURCE_LABELS,
  VERDICT_LABELS,
  type AnalysisResult,
  type Indicator,
  type ResultSource,
  type Verdict,
} from "@/lib/analysis-types";

const LEVEL_STYLES = {
  low: { text: "text-success", bg: "bg-success/15", border: "border-success/40", stroke: "var(--success)" },
  medium: { text: "text-warning", bg: "bg-warning/15", border: "border-warning/40", stroke: "var(--warning)" },
  high: { text: "text-destructive", bg: "bg-destructive/15", border: "border-destructive/40", stroke: "var(--destructive)" },
} as const;

export function SourceBadge({ source }: { source: ResultSource }) {
  const Icon = source === "demo-sample" ? FlaskConical : source === "ai-opinion" ? Bot : ShieldCheck;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-mono text-[11px] uppercase tracking-wider",
        source === "demo-sample" ? "border-warning/60 text-warning" : "border-primary/50 text-primary-glow",
      )}
    >
      <Icon className="size-3.5" /> {SOURCE_LABELS[source]}
    </Badge>
  );
}

export function VerdictIcon({ verdict, className }: { verdict: Verdict; className?: string }) {
  if (verdict === "likely_authentic" || verdict === "likely_true") return <ShieldCheck className={className} />;
  if (verdict === "inconclusive" || verdict === "unverifiable") return <ShieldQuestion className={className} />;
  return <ShieldAlert className={className} />;
}

export function RiskGauge({ score }: { score: number }) {
  const level = riskLevel(score);
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={LEVEL_STYLES[level].stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className={cn("font-display text-3xl font-bold", LEVEL_STYLES[level].text)}>{score}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">risk</p>
        </div>
      </div>
    </div>
  );
}

export function IndicatorList({ items, title }: { items: Indicator[]; title: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <AlertTriangle className="size-4" /> {title}
      </h3>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((i, idx) => (
          <li key={idx} className={cn("rounded-xl border p-3.5", LEVEL_STYLES[i.severity].border, LEVEL_STYLES[i.severity].bg)}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{i.label}</p>
              <span className={cn("font-mono text-[10px] uppercase", LEVEL_STYLES[i.severity].text)}>{i.severity}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{i.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResultPanel({ result, source, children }: { result: AnalysisResult; source: ResultSource; children?: ReactNode }) {
  const level = riskLevel(result.riskScore);
  return (
    <div className="animate-fade-up space-y-6 rounded-2xl border border-border bg-card-gradient p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Results</h2>
        <SourceBadge source={source} />
      </div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <RiskGauge score={result.riskScore} />
        <div>
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-display font-semibold", LEVEL_STYLES[level].border, LEVEL_STYLES[level].bg, LEVEL_STYLES[level].text)}>
            <VerdictIcon verdict={result.verdict} className="size-4" />
            {VERDICT_LABELS[result.verdict]}
          </div>
          <p className="mt-3 leading-relaxed text-foreground/90">{result.summary}</p>
        </div>
      </div>
      {children}
      <IndicatorList items={result.indicators} title="Indicators" />
      {!!result.nextSteps?.length && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="size-4" /> What to do next
          </h3>
          <ul className="space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-glow" /> {s}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {source === "demo-sample"
          ? "This is a fixed example to show the layout. Nothing was analysed."
          : "This is an AI opinion and metadata hints — not a forensic deepfake detector. Treat it as a starting point and confirm with trusted sources."}
      </p>
    </div>
  );
}
