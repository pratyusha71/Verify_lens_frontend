import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, Film, ImageIcon, Newspaper, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResultPanel, SourceBadge, VerdictIcon } from "@/components/verify/result-panel";
import { historyQueryOptions, profileQueryOptions, type HistoryItem } from "@/lib/history";
import { riskLevel, VERDICT_LABELS, type AnalysisKind, type Verdict } from "@/lib/analysis-types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Verify Lens" },
      { name: "description", content: "Your Verify Lens verification history and stats." },
      { property: "og:title", content: "Dashboard — Verify Lens" },
      { property: "og:description", content: "Your verification history and stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(historyQueryOptions),
      context.queryClient.ensureQueryData(profileQueryOptions),
    ]),
  component: Dashboard,
});

const KIND_META: Record<AnalysisKind, { icon: typeof ImageIcon; label: string }> = {
  image: { icon: ImageIcon, label: "Image" },
  video: { icon: Film, label: "Video" },
  news: { icon: Newspaper, label: "News" },
};

const LEVEL_TEXT = { low: "text-success", medium: "text-warning", high: "text-destructive" } as const;

function Dashboard() {
  const { data: history } = useSuspenseQuery(historyQueryOptions);
  const { data: profile } = useSuspenseQuery(profileQueryOptions);
  const [tab, setTab] = useState<"all" | AnalysisKind>("all");
  const [open, setOpen] = useState<HistoryItem | null>(null);
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: historyQueryOptions.queryKey });
      toast.success("Removed from history");
    },
    onError: () => toast.error("Could not delete this item"),
  });

  const count = (k: AnalysisKind) => history.filter((h) => h.kind === k).length;
  const flagged = history.filter((h) => (h.score ?? 0) >= 70).length;
  const items = tab === "all" ? history : history.filter((h) => h.kind === tab);

  const stats = [
    { label: "Total analyses", value: history.length, icon: Activity },
    { label: "Images", value: count("image"), icon: ImageIcon },
    { label: "Videos", value: count("video"), icon: Film },
    { label: "News claims", value: count("news"), icon: Newspaper },
    { label: "High risk", value: flagged, icon: ShieldAlert },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary-glow">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Welcome back, {profile?.displayName ?? "Investigator"}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="glass" size="sm"><Link to="/verify/image">New image check</Link></Button>
          <Button asChild variant="hero" size="sm"><Link to="/verify/news">New news check</Link></Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-up rounded-2xl border border-border bg-card-gradient p-5 shadow-card">
            <s.icon className="size-5 text-primary-glow" />
            <p className="mt-4 font-display text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Verification history</h2>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No analyses here yet. Run your first check to see it on this dashboard.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="glass" size="sm"><Link to="/verify/image">Check an image</Link></Button>
            <Button asChild variant="glass" size="sm"><Link to="/verify/video">Check a video</Link></Button>
            <Button asChild variant="glass" size="sm"><Link to="/verify/news">Check a claim</Link></Button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((h) => {
            const K = KIND_META[h.kind];
            const level = riskLevel(h.score ?? 0);
            return (
              <li key={h.id} className="group flex flex-col rounded-2xl border border-border bg-card-gradient p-5 shadow-card transition hover:border-primary/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <K.icon className="size-3.5" /> {K.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}</span>
                </div>
                <p className="mt-3 line-clamp-2 font-medium">{h.title}</p>
                <div className={cn("mt-3 flex items-center gap-2 font-display font-semibold", LEVEL_TEXT[level])}>
                  <VerdictIcon verdict={h.verdict as Verdict} className="size-4" />
                  {VERDICT_LABELS[h.verdict as Verdict] ?? h.verdict}
                  <span className="ml-auto font-mono text-sm">{h.score ?? "—"}/100</span>
                </div>
                {h.summary && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{h.summary}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <Button variant="glass" size="sm" onClick={() => setOpen(h)} disabled={!h.result}>
                    View report
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => del.mutate(h.id)} disabled={del.isPending}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="line-clamp-2 pr-6">{open?.title}</DialogTitle>
          </DialogHeader>
          {open && <SourceBadge source={open.source} />}
          {open?.result && <ResultPanel result={open.result} source={open.source} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
