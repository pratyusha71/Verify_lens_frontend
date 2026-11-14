// Shared result shapes for every verification. A future Python detector must return
// the same `AnalysisResult` JSON so the UI keeps working unchanged.

export type AnalysisKind = "image" | "video" | "news";

export type MediaVerdict = "likely_authentic" | "suspicious" | "likely_manipulated" | "inconclusive";
export type NewsVerdict = "likely_true" | "misleading" | "likely_false" | "unverifiable";
export type Verdict = MediaVerdict | NewsVerdict;

export type Severity = "low" | "medium" | "high";

export interface Indicator {
  label: string;
  detail: string;
  severity: Severity;
}

export interface FrameObservation {
  index: number;
  observation: string;
  concern: "none" | Severity;
}

export interface ClaimCheck {
  claim: string;
  assessment: string;
}

export interface SourceSuggestion {
  name: string;
  url: string;
  why: string;
}

export interface AnalysisResult {
  verdict: Verdict;
  /** 0–100. Higher = more likely manipulated, AI-generated or false. */
  riskScore: number;
  summary: string;
  indicators: Indicator[];
  frames?: FrameObservation[];
  claims?: ClaimCheck[];
  evidence?: string[];
  sourcesToCheck?: SourceSuggestion[];
  nextSteps?: string[];
}

/** Where a result came from — shown on every result card. */
export type ResultSource = "ai-opinion" | "python-detector" | "demo-sample";

export const VERDICT_LABELS: Record<Verdict, string> = {
  likely_authentic: "Likely authentic",
  suspicious: "Suspicious",
  likely_manipulated: "Likely manipulated",
  inconclusive: "Inconclusive",
  likely_true: "Likely true",
  misleading: "Misleading",
  likely_false: "Likely false",
  unverifiable: "Unverifiable",
};

export type RiskLevel = "low" | "medium" | "high";

export function riskLevel(score: number): RiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const SOURCE_LABELS: Record<ResultSource, string> = {
  "ai-opinion": "AI opinion — not forensic detection",
  "python-detector": "Detection service",
  "demo-sample": "Demo sample — not a real analysis",
};
