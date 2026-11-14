import type { AnalysisResult } from "./analysis-types";

// Clearly labelled demonstration results. They are NOT produced by any analysis
// and the UI always shows a "Demo sample" badge next to them.

export const DEMO_IMAGE: AnalysisResult = {
  verdict: "suspicious",
  riskScore: 62,
  summary:
    "Demo sample: this is how an image result looks. The example shows lighting that does not match between the subject and background, plus missing camera metadata.",
  indicators: [
    { label: "Inconsistent shadows", detail: "Shadows on the face point a different way than shadows on the wall.", severity: "medium" },
    { label: "No camera metadata", detail: "No EXIF data — common for screenshots and AI images.", severity: "low" },
    { label: "Warped text on sign", detail: "Background lettering is melted and unreadable.", severity: "high" },
  ],
  nextSteps: ["Run a reverse image search (Google Lens, TinEye).", "Look for the original uploader.", "Compare with other photos of the same event."],
};

export const DEMO_VIDEO: AnalysisResult = {
  verdict: "likely_manipulated",
  riskScore: 78,
  summary:
    "Demo sample: this is how a video result looks. The example shows a face edge that flickers between frames and lips that do not match the jaw movement.",
  indicators: [
    { label: "Face boundary flicker", detail: "The edge around the face shifts between frames.", severity: "high" },
    { label: "Skin tone mismatch", detail: "Face is warmer in colour than the neck and hands.", severity: "medium" },
  ],
  frames: [
    { index: 0, observation: "Normal framing, steady lighting.", concern: "none" },
    { index: 1, observation: "Slight blur around the jawline.", concern: "low" },
    { index: 2, observation: "Face edge visibly shifts against the background.", concern: "high" },
    { index: 3, observation: "Teeth appear as a single smooth block.", concern: "medium" },
    { index: 4, observation: "Eye reflections differ between eyes.", concern: "medium" },
    { index: 5, observation: "Background warps near the shoulder.", concern: "high" },
  ],
  nextSteps: ["Find the earliest upload of the clip.", "Check whether trusted outlets reported the same statement."],
};

export const DEMO_NEWS: AnalysisResult = {
  verdict: "likely_false",
  riskScore: 85,
  summary:
    "Demo sample: this is how a news result looks. The example claim (“The Great Wall of China is visible from the Moon with the naked eye”) is a well-known myth.",
  indicators: [
    { label: "Popular myth", detail: "This claim has been repeated for decades and debunked by astronauts.", severity: "high" },
    { label: "No source given", detail: "The claim does not cite any study or official body.", severity: "medium" },
  ],
  claims: [{ claim: "The Great Wall is visible from the Moon with the naked eye.", assessment: "False — it is far too narrow to see from 384,000 km away." }],
  evidence: [
    "The wall is only a few metres wide; at Moon distance that is far below what eyes can resolve.",
    "Astronauts have stated they could not see it even from low Earth orbit without aid.",
  ],
  sourcesToCheck: [
    { name: "NASA", url: "https://www.nasa.gov", why: "Official statements from astronauts." },
    { name: "Snopes", url: "https://www.snopes.com", why: "Fact-check archive on this myth." },
  ],
  nextSteps: ["Search the claim on a fact-checking site.", "Look for the original source before sharing."],
};
