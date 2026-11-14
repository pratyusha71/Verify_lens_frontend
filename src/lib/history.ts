import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisKind, AnalysisResult, ResultSource } from "./analysis-types";

export interface HistoryItem {
  id: string;
  kind: AnalysisKind;
  title: string;
  verdict: string;
  score: number | null;
  summary: string | null;
  source: ResultSource;
  createdAt: string;
  result: AnalysisResult | null;
}

export const historyQueryOptions = queryOptions({
  queryKey: ["analyses", "history"],
  queryFn: async (): Promise<HistoryItem[]> => {
    const { data, error } = await supabase
      .from("analyses")
      .select("id, kind, title, verdict, score, summary, source, created_at, details")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((r) => {
      const details = (r.details ?? {}) as { result?: AnalysisResult };
      return {
        id: r.id,
        kind: r.kind as AnalysisKind,
        title: r.title,
        verdict: r.verdict,
        score: r.score,
        summary: r.summary,
        source: r.source as ResultSource,
        createdAt: r.created_at,
        result: details.result ?? null,
      };
    });
  },
});

export const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
    return { displayName: data?.display_name ?? u.user.email?.split("@")[0] ?? "Investigator", email: u.user.email ?? "" };
  },
});
