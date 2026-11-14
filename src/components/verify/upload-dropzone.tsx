import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accept: string;
  label: string;
  hint: string;
  maxBytes: number;
  onFile: (file: File) => void;
  onError: (msg: string) => void;
}

export function UploadDropzone({ accept, label, hint, maxBytes, onFile, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handle(file: File | undefined) {
    if (!file) return;
    const prefix = accept.split("/")[0];
    if (!file.type.startsWith(`${prefix}/`)) return onError(`Please choose a ${prefix} file.`);
    if (file.size > maxBytes) return onError(`File is too large (max ${Math.round(maxBytes / 1e6)} MB).`);
    onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files[0]);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/60 px-6 py-14 text-center transition-all hover:border-primary/70 hover:bg-accent/30",
        dragging && "border-primary bg-accent/40 shadow-glow",
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-accent text-primary-glow transition-transform group-hover:-translate-y-1">
        <UploadCloud className="size-7" />
      </span>
      <span className="font-display text-lg font-semibold">{label}</span>
      <span className="text-sm text-muted-foreground">{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </button>
  );
}
