import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, Film, ImageIcon, Newspaper, ScanEye, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-lens.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verify Lens — Think Before You Trust. Verify Before You Share." },
      {
        name: "description",
        content: "Verify Lens helps you spot manipulated images, deepfake videos and misleading news before you share them.",
      },
      { property: "og:title", content: "Verify Lens — Verify before you share" },
      { property: "og:description", content: "Check images, videos and news claims for signs of manipulation and misinformation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    to: "/verify/image",
    icon: ImageIcon,
    title: "Image Verification",
    text: "Read hidden metadata, spot editing-software traces and AI-generator markers, and get an AI opinion on visual clues.",
  },
  {
    to: "/verify/video",
    icon: Film,
    title: "Video Verification",
    text: "Sample frames across a clip and review each one for deepfake warning signs like face-edge flicker and warped backgrounds.",
  },
  {
    to: "/verify/news",
    icon: Newspaper,
    title: "News Verification",
    text: "Paste a claim or article link. Get the key claims broken down, red flags, and trusted sources to cross-check.",
  },
] as const;

const STEPS = [
  { icon: FileSearch, title: "Upload or paste", text: "Drop an image or video, or paste a news claim or link." },
  { icon: ScanEye, title: "Inspect", text: "We read real file data and ask AI to look for warning signs." },
  { icon: ShieldCheck, title: "Decide wisely", text: "See a risk score, clear indicators and what to check next." },
];

function Index() {
  return (
    <>
      <section className="relative overflow-hidden bg-hero">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-primary/40 bg-accent/40 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary-glow">
              <Sparkles className="size-3.5" /> Don't Believe Everything. Verify Everything.
            </p>
            <h1 className="mt-6 animate-fade-up text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Think Before You Trust.
              <br />
              <span className="text-gradient">Verify Before You Share.</span>
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg text-muted-foreground">
              Verify Lens is a digital content verification platform that helps you spot potentially manipulated
              images, AI-generated content, deepfake videos and misleading news — in seconds.
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/verify/image">
                  Get Started <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/awareness">Learn the signs</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-up">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary opacity-20 blur-3xl" aria-hidden="true" />
            <div className="scanline relative overflow-hidden rounded-3xl border border-primary/40 shadow-glow">
              <img src={heroImg} alt="A glowing digital lens scanning a wall of photos" width={1600} height={1008} className="h-full w-full object-cover" />
              <div className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Scanning content</span>
                <span className="flex items-center gap-2 font-mono text-xs text-primary-glow">
                  <span className="size-2 animate-pulse rounded-full bg-primary-glow" /> LIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary-glow">Verification tools</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Three ways to check what you see</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              style={{ animationDelay: `${i * 120}ms` }}
              className="group relative animate-fade-up overflow-hidden rounded-2xl border border-border bg-card-gradient p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <f.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-glow">
                Open tool <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/60">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-4">
              <span className="font-mono text-sm text-primary-glow">0{i + 1}</span>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <s.icon className="size-5 text-primary-glow" /> {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold md:text-4xl">Honest by design</h2>
        <p className="mt-4 text-muted-foreground">
          No tool can prove an image is fake with 100% certainty. Verify Lens shows exactly where each result comes
          from — real file data, an AI opinion, or a labelled demo — so you can make an informed decision.
        </p>
      </section>
    </>
  );
}
