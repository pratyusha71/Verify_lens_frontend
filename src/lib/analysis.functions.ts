import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GatewayError, PaymentRequiredError, RateLimitError } from "@lovable.dev/ai-gateway";
import type { AnalysisKind, AnalysisResult, ResultSource } from "./analysis-types";
import { analyzeImageContent, analyzeNewsContent, analyzeVideoContent, fetchArticle } from "./analysis.server";

export interface SavedAnalysis {
  id: string;
  createdAt: string;
  source: ResultSource;
  result: AnalysisResult;
  article?: { title: string; site: string; url: string } | null;
}

function friendlyError(e: unknown): never {
  if (e instanceof PaymentRequiredError) throw new Error("AI credits have run out for this workspace.");
  if (e instanceof RateLimitError) throw new Error("Too many requests right now — please wait a moment and retry.");
  if (e instanceof GatewayError) throw new Error("The AI service could not complete this check. Please try again.");
  throw e instanceof Error ? e : new Error("Analysis failed.");
}

async function save(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: AnalysisKind,
  title: string,
  source: ResultSource,
  result: AnalysisResult,
  extra: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      kind,
      title: title.slice(0, 200),
      verdict: result.verdict,
      score: result.riskScore,
      summary: result.summary,
      source,
      details: { result, ...extra } as unknown as Json,
    })
    .select("id, created_at")
    .single();
  if (error) throw new Error("Analysis finished but could not be saved to your history.");
  return { id: data.id, createdAt: data.created_at };
}

const dataUrl = z.string().startsWith("data:image/").max(4_000_000);

export const analyzeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileName: z.string().min(1).max(300),
        dataUrl,
        metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())])),
        metadataIndicators: z.array(
          z.object({ label: z.string(), detail: z.string(), severity: z.enum(["low", "medium", "high"]) }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<SavedAnalysis> => {
    const metadataSummary = [
      ...Object.entries(data.metadata).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") || "none" : String(v ?? "none")}`),
      ...data.metadataIndicators.map((i) => `Indicator (${i.severity}): ${i.label}`),
    ].join("\n");
    let out;
    try {
      out = await analyzeImageContent({ fileName: data.fileName, dataUrl: data.dataUrl, metadataSummary });
    } catch (e) {
      friendlyError(e);
    }
    const saved = await save(context.supabase, context.userId, "image", data.fileName, out.source, out.result, {
      metadata: data.metadata,
      metadataIndicators: data.metadataIndicators,
    });
    return { ...saved, source: out.source, result: out.result };
  });

export const analyzeVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileName: z.string().min(1).max(300),
        durationSec: z.number().min(0),
        width: z.number().int().min(0),
        height: z.number().int().min(0),
        sizeBytes: z.number().int().min(0),
        frames: z.array(z.object({ time: z.number(), dataUrl: z.string().startsWith("data:image/").max(600_000) })).min(1).max(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<SavedAnalysis> => {
    const summary = `${Math.round(data.durationSec)}s, ${data.width}x${data.height}, ${(data.sizeBytes / 1e6).toFixed(1)} MB`;
    let out;
    try {
      out = await analyzeVideoContent({ fileName: data.fileName, summary, frames: data.frames });
    } catch (e) {
      friendlyError(e);
    }
    const saved = await save(context.supabase, context.userId, "video", data.fileName, out.source, out.result, {
      video: { durationSec: data.durationSec, width: data.width, height: data.height, sizeBytes: data.sizeBytes },
    });
    return { ...saved, source: out.source, result: out.result };
  });

export const analyzeNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ claim: z.string().max(5000).default(""), url: z.string().max(2000).default("") })
      .refine((v) => v.claim.trim().length > 0 || v.url.trim().length > 0, "Enter a claim or a URL.")
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<SavedAnalysis> => {
    const url = data.url.trim();
    const article = url ? await fetchArticle(url) : null;
    let out;
    try {
      out = await analyzeNewsContent({ claim: data.claim.trim(), url, article });
    } catch (e) {
      friendlyError(e);
    }
    const title = data.claim.trim() || article?.title || url;
    const articleInfo = article ? { title: article.title, site: article.site, url } : url ? { title: url, site: "", url } : null;
    const saved = await save(context.supabase, context.userId, "news", title, out.source, out.result, {
      claim: data.claim.trim(),
      url,
      article: articleInfo,
      articleFetched: !!article,
    });
    return { ...saved, source: out.source, result: out.result, article: articleInfo };
  });
