import type { Indicator } from "./analysis-types";

// Real, rule-based checks on an image file's metadata. These are hints, never proof.

export interface ImageMetadata {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  lastModified: string | null;
  hasExif: boolean;
  make: string | null;
  model: string | null;
  software: string | null;
  dateTaken: string | null;
  dateModified: string | null;
  hasGps: boolean;
  /** Generator / provenance strings found inside the file bytes (e.g. "c2pa", "midjourney"). */
  embeddedSignatures: string[];
}

export const EDITOR_PATTERNS = [
  "photoshop",
  "gimp",
  "lightroom",
  "snapseed",
  "picsart",
  "canva",
  "affinity",
  "pixlr",
  "facetune",
  "meitu",
];

export const AI_SIGNATURES = [
  "midjourney",
  "dall-e",
  "dall·e",
  "stable diffusion",
  "stablediffusion",
  "firefly",
  "imagen",
  "openai",
  "trainedalgorithmicmedia",
  "comfyui",
  "automatic1111",
];

export function computeImageIndicators(meta: ImageMetadata): Indicator[] {
  const out: Indicator[] = [];
  const software = (meta.software ?? "").toLowerCase();
  const sigs = meta.embeddedSignatures.map((s) => s.toLowerCase());

  const aiHit = AI_SIGNATURES.find((s) => software.includes(s) || sigs.includes(s));
  if (aiHit) {
    out.push({
      label: "AI generator signature found",
      detail: `The file contains the marker "${aiHit}", which AI image tools often write into their output.`,
      severity: "high",
    });
  }

  if (sigs.includes("c2pa")) {
    out.push({
      label: "Content Credentials (C2PA) present",
      detail:
        "The file carries provenance data. Check it with a Content Credentials viewer to see how it was made or edited.",
      severity: "low",
    });
  }

  const editor = EDITOR_PATTERNS.find((e) => software.includes(e));
  if (editor) {
    out.push({
      label: "Edited with photo software",
      detail: `The Software tag says "${meta.software}". Editing is normal, but it means this is not straight from a camera.`,
      severity: "medium",
    });
  }

  if (!meta.hasExif) {
    out.push({
      label: "No camera metadata",
      detail:
        "No EXIF data was found. Screenshots, social-media downloads and AI-generated images usually have none.",
      severity: "low",
    });
  } else if (!meta.make && !meta.model) {
    out.push({
      label: "Camera make and model missing",
      detail: "Metadata exists but does not name a camera or phone.",
      severity: "low",
    });
  }

  if (meta.dateTaken && meta.dateModified) {
    const taken = Date.parse(meta.dateTaken);
    const modified = Date.parse(meta.dateModified);
    if (!Number.isNaN(taken) && !Number.isNaN(modified) && modified - taken > 60_000) {
      out.push({
        label: "Modified after capture",
        detail: "The modify date is later than the original capture date.",
        severity: "medium",
      });
    }
  }

  return out;
}
