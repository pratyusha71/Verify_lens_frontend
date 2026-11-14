import { generateResponse } from "@lovable.dev/ai-gateway";
import type { AnalysisKind, AnalysisResult, ResultSource } from "./analysis-types";

// One place that decides who analyses content.
// - If DETECTION_API_URL is set, requests go to your Python service: POST {url}/analyze/{kind}.
// - Otherwise an AI model gives a clearly labelled opinion.

const MODEL = "openai/gpt-6-astra" as const;

const indicatorSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["label", "detail", "severity"],
    properties: {
      label: { type: "string" },
      detail: { type: "string" },
      severity: { type: "string", enum: ["low", "medium", "high"] },
    },
  },
};

const mediaVerdicts = ["likely_authentic", "suspicious", "likely_manipulated", "inconclusive"];
const newsVerdicts = ["likely_true", "misleading", "likely_false", "unverifiable"];

function schemaFor(kind: AnalysisKind) {
  const base: Record<string, unknown> = {
    verdict: { type: "string", enum: kind === "news" ? newsVerdicts : mediaVerdicts },
    riskScore: { type: "integer", description: "0-100, higher means more likely manipulated/AI-generated/false" },
    summary: { type: "string" },
    indicators: indicatorSchema,
    nextSteps: { type: "array", items: { type: "string" } },
  };
  const required = ["verdict", "riskScore", "summary", "indicators", "nextSteps"];
  if (kind === "video") {
    base["frames"] = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "observation", "concern"],
        properties: {
          index: { type: "integer" },
          observation: { type: "string" },
          concern: { type: "string", enum: ["none", "low", "medium", "high"] },
        },
      },
    };
    required.push("frames");
  }
  if (kind === "news") {
    base["claims"] = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "assessment"],
        properties: { claim: { type: "string" }, assessment: { type: "string" } },
      },
    };
    base["evidence"] = { type: "array", items: { type: "string" } };
    base["sourcesToCheck"] = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url", "why"],
        properties: { name: { type: "string" }, url: { type: "string" }, why: { type: "string" } },
      },
    };
    required.push("claims", "evidence", "sourcesToCheck");
  }
  return { type: "object", additionalProperties: false, required, properties: base };
}

const SYSTEM = `You are the assistant inside "Verify Lens", a student-built content verification tool.
You are NOT a forensic deepfake detector and must never claim certainty you do not have.
Give a careful, honest opinion based only on what you can observe. When evidence is weak, choose
"inconclusive" or "unverifiable". Keep language simple and helpful for the general public.
riskScore: 0-100 where higher means more likely manipulated, AI-generated, or false.`;

type ContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "low" | "high" | "auto" };

async function askAi(kind: AnalysisKind, parts: ContentPart[]): Promise<AnalysisResult> {
  const res = await generateResponse({
    model: MODEL,
    instructions: SYSTEM,
    input: [{ role: "user", content: [...parts, { type: "input_text", text: "Return JSON only." }] }],
    text: { format: { type: "json_schema", name: `${kind}_analysis`, strict: true, schema: schemaFor(kind) } },
  });
  let text = "";
  for (const item of res.output ?? []) {
    if (item.type === "message") {
      for (const c of item.content) if (c.type === "output_text") text += c.text;
    }
  }
  if (!text) throw new Error("The AI did not return a result. Please try again.");
  const parsed = JSON.parse(text) as AnalysisResult;
  parsed.riskScore = Math.max(0, Math.min(100, Math.round(parsed.riskScore)));
  return parsed;
}

async function callDetector(kind: AnalysisKind, payload: unknown): Promise<AnalysisResult | null> {
  const base = process.env["DETECTION_API_URL"];
  if (!base) return null;
  const r = await fetch(`${base.replace(/\/$/, "")}/analyze/${kind}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Detection service error (${r.status})`);
  return (await r.json()) as AnalysisResult;
}

export interface ImageInput {
  fileName: string;
  dataUrl: string;
  metadataSummary: string;
}

export async function analyzeImageContent(input: ImageInput): Promise<{ result: AnalysisResult; source: ResultSource }> {
  const detected = await callDetector("image", input);
  if (detected) return { result: detected, source: "python-detector" };
  const result = await askAi("image", [
    {
      type: "input_text",
      text: `Look at this image ("${input.fileName}") for visual signs of editing or AI generation:
inconsistent lighting/shadows, warped text, odd hands/teeth/ears, repeated textures, blurry edges around
subjects, unnatural skin, mismatched reflections. Also consider this metadata summary measured from the file:
${input.metadataSummary}
List 2-6 indicators (positive or negative) and 2-4 practical next steps (e.g. reverse image search).`,
    },
    { type: "input_image", image_url: input.dataUrl, detail: "high" },
  ]);
  return { result, source: "ai-opinion" };
}

export interface VideoInput {
  fileName: string;
  summary: string;
  frames: { time: number; dataUrl: string }[];
}

export async function analyzeVideoContent(input: VideoInput): Promise<{ result: AnalysisResult; source: ResultSource }> {
  const detected = await callDetector("video", input);
  if (detected) return { result: detected, source: "python-detector" };
  const parts: ContentPart[] = [
    {
      type: "input_text",
      text: `These are ${input.frames.length} frames sampled evenly from the video "${input.fileName}" (${input.summary}).
For each frame (index starting at 0) write one short observation and a concern level. Look for deepfake
signs: face boundary blur, flickering or mismatched skin tone, unnatural eyes/teeth, warped backgrounds,
inconsistent lighting between frames. Then give an overall verdict, 2-6 indicators and 2-4 next steps.`,
    },
  ];
  input.frames.forEach((f, i) => {
    parts.push({ type: "input_text", text: `Frame ${i} at ${f.time.toFixed(1)}s:` });
    parts.push({ type: "input_image", image_url: f.dataUrl, detail: "low" });
  });
  const result = await askAi("video", parts);
  return { result, source: "ai-opinion" };
}

export interface NewsInput {
  claim: string;
  url: string;
  article: { title: string; site: string; text: string } | null;
}

export async function analyzeNewsContent(input: NewsInput): Promise<{ result: AnalysisResult; source: ResultSource }> {
  const detected = await callDetector("news", input);
  if (detected) return { result: detected, source: "python-detector" };
  const today = new Date().toISOString().slice(0, 10);
  const articleBlock = input.article
    ? `Article fetched from ${input.url}\nSite: ${input.article.site}\nTitle: ${input.article.title}\nText:\n${input.article.text}`
    : input.url
      ? `The article at ${input.url} could not be fetched; judge from the URL and claim only.`
      : "";
  const result = await askAi("news", [
    {
      type: "input_text",
      text: `Today is ${today}. Assess the following for misinformation. You do NOT have live web access,
so say so when a claim depends on recent events.
${input.claim ? `Claim: """${input.claim}"""` : ""}
${articleBlock}

Return: the key claims with your assessment of each, evidence points (what supports or contradicts it,
from general knowledge), red-flag indicators (sensational language, missing sources, date issues, etc.),
3-5 real, reputable sources the user should check (fact-checkers, official bodies, major outlets) with
homepage URLs, and 2-4 next steps.`,
    },
  ]);
  return { result, source: "ai-opinion" };
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$)/i;

/** Fetches a public news page and extracts readable text. Returns null if it can't. */
export async function fetchArticle(rawUrl: string): Promise<{ title: string; site: string; text: string } | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || PRIVATE_HOST.test(url.hostname)) return null;
  try {
    const r = await fetch(url.toString(), {
      headers: { "user-agent": "Mozilla/5.0 (VerifyLens fact-check bot)", accept: "text/html" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 600_000);
    const meta = (name: string) =>
      html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)`, "i"))?.[1] ?? "";
    const title = meta("og:title") || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || url.hostname;
    const site = meta("og:site_name") || url.hostname;
    const body = html
      .replace(/<(script|style|noscript|svg|header|footer|nav)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    return { title, site, text: body.slice(0, 12_000) };
  } catch {
    return null;
  }
}
