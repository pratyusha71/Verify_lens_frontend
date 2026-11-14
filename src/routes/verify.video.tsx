import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Film, FlaskConical, RotateCcw, ScanSearch, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/verify/page-header";
import { UploadDropzone } from "@/components/verify/upload-dropzone";
import { AnalysisLoader } from "@/components/verify/analysis-loader";
import { ResultPanel } from "@/components/verify/result-panel";
import { SignInPrompt } from "@/components/verify/sign-in-prompt";
import { useAuth } from "@/hooks/use-auth";
import { analyzeVideo } from "@/lib/analysis.functions";
import { extractVideoFrames, formatBytes, formatDuration, type ExtractedFrame, type VideoInfo } from "@/lib/media-utils";
import { DEMO_VIDEO } from "@/lib/demo-samples";
import type { AnalysisResult, FrameObservation, ResultSource } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verify/video")({
  head: () => ({
    meta: [
      { title: "Video Verification — Verify Lens" },
      { name: "description", content: "Upload a video to sample its frames and review each one for deepfake warning signs." },
      { property: "og:title", content: "Video Verification — Verify Lens" },
      { property: "og:description", content: "Frame-by-frame review of videos for deepfake warning signs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VideoPage,
});

const FRAME_COUNT = 6;

const CONCERN_STYLES: Record<FrameObservation["concern"], string> = {
  none: "border-success/50 text-success",
  low: "border-primary/50 text-primary-glow",
  medium: "border-warning/60 text-warning",
  high: "border-destructive/60 text-destructive",
};

function VideoPage() {
  const { user } = useAuth();
  const run = useServerFn(analyzeVideo);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [extracting, setExtracting] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ result: AnalysisResult; source: ResultSource } | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function pick(f: File) {
    reset();
    setFile(f);
    setPreview(URL.createObjectURL(f));
    try {
      const out = await extractVideoFrames(f, FRAME_COUNT, setExtracting);
      setInfo(out.info);
      setFrames(out.frames);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read this video.");
      reset();
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setInfo(null);
    setFrames([]);
    setExtracting(0);
    setResult(null);
  }

  async function analyse() {
    if (!file || !info || !frames.length) return;
    setLoading(true);
    setResult(null);
    try {
      const out = await run({
        data: {
          fileName: file.name,
          durationSec: info.duration,
          width: info.width,
          height: info.height,
          sizeBytes: file.size,
          frames: frames.map((f) => ({ time: f.time, dataUrl: f.dataUrl })),
        },
      });
      setResult({ result: out.result, source: out.source });
      toast.success("Analysis saved to your dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const observations = result?.result.frames ?? [];

  return (
    <>
      <PageHeader
        icon={Video}
        eyebrow="Video verification"
        title="Spot deepfake warning signs, frame by frame"
        description="Upload a short clip. We sample frames evenly across it on your device, then review each frame for signs of face swaps and editing."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-5">
          {!file ? (
            <UploadDropzone
              accept="video/*"
              label="Drag & drop a video"
              hint="or click to browse · MP4, WEBM, MOV · up to 200 MB"
              maxBytes={200 * 1024 * 1024}
              onFile={pick}
              onError={(m) => toast.error(m)}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              {preview && <video src={preview} controls className="max-h-[380px] w-full bg-background" />}
              <div className="flex items-center justify-between gap-3 border-t border-border p-3">
                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <Film className="size-4 shrink-0 text-primary-glow" />
                  <span className="truncate">{file.name}</span>
                </p>
                <Button variant="ghost" size="sm" onClick={reset} disabled={loading}>
                  <RotateCcw /> Change
                </Button>
              </div>
            </div>
          )}

          {file && !frames.length && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 font-mono text-xs text-muted-foreground">
                Extracting frames… {extracting}/{FRAME_COUNT}
              </p>
              <Progress value={(extracting / FRAME_COUNT) * 100} />
            </div>
          )}

          {!user && <SignInPrompt action="analyse videos" />}

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={analyse} disabled={!user || !frames.length || loading}>
              <ScanSearch /> Analyse Video
            </Button>
            <Button variant="glass" size="lg" onClick={() => setResult({ result: DEMO_VIDEO, source: "demo-sample" })} disabled={loading}>
              <FlaskConical /> View demo result
            </Button>
          </div>

          {info && (
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Duration", formatDuration(info.duration)],
                ["Resolution", `${info.width}×${info.height}`],
                ["Size", file ? formatBytes(file.size) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-card-gradient p-3 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
                  <p className="mt-1 font-display font-semibold">{v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {loading && <AnalysisLoader steps={["Sampling frames", "Checking face boundaries", "Comparing lighting across frames", "Writing the report"]} />}
          {result && (
            <ResultPanel result={result.result} source={result.source}>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Frame analysis</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(frames.length ? frames : Array.from({ length: observations.length }, () => null)).map((f, i) => {
                    const obs = observations.find((o) => o.index === i);
                    return (
                      <div key={i} className={cn("overflow-hidden rounded-xl border bg-surface", obs ? CONCERN_STYLES[obs.concern] : "border-border")}>
                        {f ? (
                          <img src={f.dataUrl} alt={`Frame ${i + 1}`} className="aspect-video w-full object-cover" />
                        ) : (
                          <div className="grid aspect-video place-items-center bg-muted font-mono text-xs text-muted-foreground">Frame {i + 1}</div>
                        )}
                        <div className="p-2.5">
                          <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                            <span className="text-muted-foreground">#{i + 1}{f ? ` · ${f.time.toFixed(1)}s` : ""}</span>
                            {obs && <span>{obs.concern}</span>}
                          </div>
                          {obs && <p className="mt-1 text-xs text-foreground/85">{obs.observation}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </ResultPanel>
          )}
          {!loading && !result && frames.length > 0 && (
            <div className="rounded-2xl border border-border bg-card-gradient p-5">
              <h2 className="mb-3 text-lg font-semibold">Sampled frames</h2>
              <div className="grid grid-cols-3 gap-2">
                {frames.map((f, i) => (
                  <img key={i} src={f.dataUrl} alt={`Frame ${i + 1}`} className="aspect-video w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
          {!loading && !result && !frames.length && (
            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <div>
                <ScanSearch className="mx-auto size-10 text-primary/60" />
                <p className="mt-3">Frame analysis results will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
