import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FileImage,
  FlaskConical,
  ImageIcon,
  RotateCcw,
  ScanSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/verify/page-header";
import { UploadDropzone } from "@/components/verify/upload-dropzone";
import { AnalysisLoader } from "@/components/verify/analysis-loader";
import { IndicatorList, ResultPanel } from "@/components/verify/result-panel";

import {
  computeImageIndicators,
  type ImageMetadata,
} from "@/lib/image-indicators";

import {
  formatBytes,
  imageToDataUrl,
  readImageMetadata,
} from "@/lib/media-utils";

import { DEMO_IMAGE } from "@/lib/demo-samples";
import type { AnalysisResult, ResultSource } from "@/lib/analysis-types";

type BackendImageResult = {
  status: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  file_size_kb: number;
  exif_metadata_available: boolean;
  metadata: Record<string, string>;
  editing_software: string;
  risk_score: number;
  risk_level: string;
  indicators: string[];
  message: string;
  disclaimer: string;
};

export const Route = createFileRoute("/verify/image")({
  head: () => ({
    meta: [
      { title: "Image Verification — Verify Lens" },
      {
        name: "description",
        content:
          "Upload an image to inspect its metadata and look for signs of editing or AI generation.",
      },
      { property: "og:title", content: "Image Verification — Verify Lens" },
      {
        property: "og:description",
        content:
          "Inspect image metadata and get an AI opinion on manipulation signs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImagePage,
});

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-mono">{value}</dd>
    </div>
  );
}

function ImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<{
    result: AnalysisResult;
    source: ResultSource;
  } | null>(null);

  const [backendResult, setBackendResult] =
    useState<BackendImageResult | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  async function pick(f: File) {
    setResult(null);
    setBackendResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMeta(null);
    setDataUrl(null);

    try {
      const shrunk = await imageToDataUrl(f);

      setDataUrl(shrunk.dataUrl);

      setMeta(
        await readImageMetadata(f, shrunk.width, shrunk.height)
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not read this image."
      );
      reset();
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setMeta(null);
    setDataUrl(null);
    setResult(null);
    setBackendResult(null);
  }

  const metaIndicators = meta ? computeImageIndicators(meta) : [];

  async function analyse() {
    if (!file || !meta || !dataUrl) {
      toast.error("Please upload an image first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setBackendResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "http://127.0.0.1:5000/api/analyze-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image analysis failed.");
      }

      setBackendResult(data as BackendImageResult);

      toast.success("Image analysis completed successfully!");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Could not connect to Verify Lens backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={ImageIcon}
        eyebrow="Image verification"
        title="Is this photo what it claims to be?"
        description="Upload an image. We read its hidden file data on your device and inspect metadata using our backend."
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-5">
          {!file ? (
            <UploadDropzone
              accept="image/*"
              label="Drag & drop an image"
              hint="or click to browse · JPG, PNG, WEBP, HEIC · up to 15 MB"
              maxBytes={15 * 1024 * 1024}
              onFile={pick}
              onError={(m) => toast.error(m)}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className={loading ? "scanline" : undefined}>
                {preview && (
                  <img
                    src={preview}
                    alt="Uploaded preview"
                    className="max-h-[420px] w-full bg-background object-contain"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border p-3">
                <p className="flex min-w-0 items-center gap-2 text-sm">
                  <FileImage className="size-4 shrink-0 text-primary-glow" />
                  <span className="truncate">{file.name}</span>
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={loading}
                >
                  <RotateCcw /> Change
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="hero"
              size="lg"
              onClick={analyse}
              disabled={!file || !meta || loading}
            >
              <ScanSearch /> Analyse Image
            </Button>

            <Button
              variant="glass"
              size="lg"
              onClick={() => {
                setBackendResult(null);
                setResult({
                  result: DEMO_IMAGE,
                  source: "demo-sample",
                });
              }}
              disabled={loading}
            >
              <FlaskConical /> View demo result
            </Button>
          </div>

          {meta && (
            <div className="rounded-2xl border border-border bg-card-gradient p-5 shadow-card">
              <h2 className="mb-3 text-lg font-semibold">
                File metadata
              </h2>

              <dl>
                <MetaRow label="Type" value={meta.mimeType} />
                <MetaRow
                  label="Size"
                  value={formatBytes(meta.sizeBytes)}
                />
                <MetaRow
                  label="Dimensions"
                  value={`${meta.width} × ${meta.height}`}
                />
                <MetaRow
                  label="Camera"
                  value={
                    [meta.make, meta.model].filter(Boolean).join(" ") || "—"
                  }
                />
                <MetaRow
                  label="Software"
                  value={meta.software ?? "—"}
                />
                <MetaRow
                  label="Date taken"
                  value={
                    meta.dateTaken
                      ? new Date(meta.dateTaken).toLocaleString()
                      : "—"
                  }
                />
                <MetaRow
                  label="Date modified"
                  value={
                    meta.dateModified
                      ? new Date(meta.dateModified).toLocaleString()
                      : "—"
                  }
                />
                <MetaRow
                  label="GPS location"
                  value={meta.hasGps ? "Present" : "None"}
                />
                <MetaRow
                  label="EXIF data"
                  value={meta.hasExif ? "Present" : "None"}
                />
                <MetaRow
                  label="Embedded markers"
                  value={meta.embeddedSignatures.join(", ") || "None found"}
                />
              </dl>

              <div className="mt-5">
                {metaIndicators.length ? (
                  <IndicatorList
                    items={metaIndicators}
                    title="Metadata indicators"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No metadata warning signs found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {loading && (
            <AnalysisLoader
              steps={[
                "Reading file metadata",
                "Checking image properties",
                "Inspecting EXIF information",
                "Preparing the report",
              ]}
            />
          )}

          {backendResult && (
            <div className="space-y-5 rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
              <h2 className="text-xl font-semibold">
                Image Analysis Results
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    Metadata risk score
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {backendResult.risk_score}/100
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    Risk level
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {backendResult.risk_level}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">
                  Image Information
                </h3>

                <dl>
                  <MetaRow
                    label="Filename"
                    value={backendResult.filename}
                  />
                  <MetaRow
                    label="Format"
                    value={backendResult.format}
                  />
                  <MetaRow
                    label="Dimensions"
                    value={`${backendResult.width} × ${backendResult.height}`}
                  />
                  <MetaRow
                    label="File size"
                    value={`${backendResult.file_size_kb} KB`}
                  />
                  <MetaRow
                    label="EXIF metadata"
                    value={
                      backendResult.exif_metadata_available
                        ? "Available"
                        : "Missing"
                    }
                  />
                  <MetaRow
                    label="Editing software"
                    value={backendResult.editing_software}
                  />
                </dl>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">
                  Analysis Indicators
                </h3>

                {backendResult.indicators.length > 0 ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {backendResult.indicators.map((indicator, index) => (
                      <li key={index}>{indicator}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No metadata indicators found.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium">
                  Important Disclaimer
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {backendResult.disclaimer}
                </p>
              </div>
            </div>
          )}

          {result && (
            <ResultPanel
              result={result.result}
              source={result.source}
            />
          )}

          {!loading && !result && !backendResult && (
            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <div>
                <ScanSearch className="mx-auto size-10 text-primary/60" />
                <p className="mt-3">
                  Your results dashboard will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}