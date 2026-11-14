import { AI_SIGNATURES, type ImageMetadata } from "./image-indicators";

// Browser-only helpers. Call them from event handlers, never during render or SSR.

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });
}

/** Shrinks an image to a JPEG data URL so it can be sent for analysis. */
export async function imageToDataUrl(file: File, maxSide = 1280): Promise<{ dataUrl: string; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function asIso(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "string" && v) return v;
  return null;
}

function asText(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "string") {
    return (v as { value: string }).value;
  }
  return null;
}

async function findSignatures(file: File): Promise<string[]> {
  const head = await file.slice(0, 512 * 1024).arrayBuffer();
  const text = new TextDecoder("latin1").decode(head).toLowerCase();
  const found = AI_SIGNATURES.filter((s) => text.includes(s));
  if (text.includes("c2pa") || text.includes("jumb")) found.push("c2pa");
  return Array.from(new Set(found));
}

export async function readImageMetadata(file: File, width: number, height: number): Promise<ImageMetadata> {
  const exifr = (await import("exifr")).default;
  let tags: Record<string, unknown> | undefined;
  try {
    tags = (await exifr.parse(file, { tiff: true, exif: true, gps: true, xmp: true, iptc: true })) as
      | Record<string, unknown>
      | undefined;
  } catch {
    tags = undefined;
  }
  const t = tags ?? {};
  return {
    fileName: file.name,
    mimeType: file.type || "unknown",
    sizeBytes: file.size,
    width,
    height,
    lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : null,
    hasExif: Object.keys(t).length > 0,
    make: asText(t["Make"]),
    model: asText(t["Model"]),
    software: asText(t["Software"]) ?? asText(t["CreatorTool"]),
    dateTaken: asIso(t["DateTimeOriginal"] ?? t["CreateDate"]),
    dateModified: asIso(t["ModifyDate"]),
    hasGps: typeof t["latitude"] === "number" && typeof t["longitude"] === "number",
    embeddedSignatures: await findSignatures(file),
  };
}

export interface ExtractedFrame {
  time: number;
  dataUrl: string;
  brightness: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
}

/** Grabs `count` evenly spaced frames from a local video file. */
export async function extractVideoFrames(
  file: File,
  count = 6,
  onProgress?: (done: number) => void,
): Promise<{ info: VideoInfo; frames: ExtractedFrame[] }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("This video format can't be read in the browser."));
    });
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const info = { duration, width: video.videoWidth, height: video.videoHeight };
    const scale = Math.min(1, 640 / Math.max(info.width || 640, info.height || 360));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((info.width || 640) * scale);
    canvas.height = Math.round((info.height || 360) * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const frames: ExtractedFrame[] = [];
    for (let i = 0; i < count; i++) {
      const time = duration > 0 ? (duration * (i + 0.5)) / count : 0;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("This video could not be decoded in your browser.")), 8000);
        video.onseeked = () => {
          clearTimeout(timer);
          resolve();
        };
        video.currentTime = time;
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let p = 0; p < px.length; p += 16) sum += (px[p]! + px[p + 1]! + px[p + 2]!) / 3;
      frames.push({ time, dataUrl: canvas.toDataURL("image/jpeg", 0.75), brightness: Math.round(sum / (px.length / 16)) });
      onProgress?.(i + 1);
    }
    return { info, frames };
  } finally {
    URL.revokeObjectURL(url);
  }
}
