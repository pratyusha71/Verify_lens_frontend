import { createFileRoute } from "@tanstack/react-router";
import { Compass, Info, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/verify/page-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Verify Lens" },
      { name: "description", content: "The mission, objectives and team behind Verify Lens, a digital content verification platform." },
      { property: "og:title", content: "About Verify Lens" },
      { property: "og:description", content: "Our mission: help everyone think before they trust and verify before they share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const OBJECTIVES = [
  "Give anyone a free, simple way to check images, videos and news before sharing.",
  "Explain results in plain language instead of technical jargon.",
  "Be transparent about what each check can and cannot tell you.",
  "Raise awareness about deepfakes, AI-generated content and misinformation.",
];

// Placeholder team — replace with your real team members.
const TEAM = [
  { name: "Pratyusha S", role: "Team Lead & Developer" },
  { name: "Team Member 2", role: "AI / Backend" },
  { name: "Team Member 3", role: "UI / UX Design" },
  { name: "Team Member 4", role: "Research & Awareness" },
];

function About() {
  return (
    <>
      <PageHeader
        icon={Info}
        eyebrow="About us"
        title="Building a more trustworthy internet"
        description="Verify Lens is a student hackathon project that helps people identify potentially manipulated and misleading content online."
      />
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
            <Compass className="size-7 text-primary-glow" />
            <h2 className="mt-4 text-2xl font-bold">Our mission</h2>
            <p className="mt-2 text-muted-foreground">
              Think before you trust. Verify before you share. We want every person to have the tools and the habits to
              stop misinformation before it spreads — starting with a single check.
            </p>
          </section>
          <section className="rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
            <Target className="size-7 text-primary-glow" />
            <h2 className="mt-4 text-2xl font-bold">Project objectives</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
              {OBJECTIVES.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
        </div>

        <section>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="size-6 text-primary-glow" /> Team
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m, i) => (
              <li key={m.name} style={{ animationDelay: `${i * 90}ms` }} className="animate-fade-up rounded-2xl border border-border bg-card-gradient p-5 text-center shadow-card">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-primary font-display text-2xl font-bold text-primary-foreground">
                  {m.name.slice(0, 1)}
                </span>
                <p className="mt-3 font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-primary/40 bg-accent/30 p-6">
          <h2 className="text-xl font-bold">How it works today</h2>
          <p className="mt-2 text-muted-foreground">
            Image metadata checks run directly in your browser. Visual, frame and claim reviews are done by an AI model
            and are clearly labelled as AI opinions — not forensic proof. The app is built so a dedicated detection
            model (for example a Python service) can be plugged in later without changing the interface.
          </p>
        </section>
      </div>
    </>
  );
}
