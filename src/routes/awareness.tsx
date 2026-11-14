import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Bot, CheckCircle2, Eye, Megaphone, ScanFace } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/verify/page-header";

export const Route = createFileRoute("/awareness")({
  head: () => ({
    meta: [
      { title: "Awareness Centre — Verify Lens" },
      { name: "description", content: "Learn how deepfakes, AI-generated images and fake news work, and how to spot them." },
      { property: "og:title", content: "Awareness Centre — Verify Lens" },
      { property: "og:description", content: "Simple guides to spotting deepfakes, AI images and misinformation." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Awareness,
});

const TOPICS = [
  {
    icon: ScanFace,
    title: "Deepfakes",
    intro: "Videos or audio where a person's face or voice is replaced using AI, making them appear to say or do things they never did.",
    signs: ["Blurry or flickering edges around the face", "Unnatural blinking or fixed stare", "Lips slightly out of sync with speech", "Skin tone that doesn't match the neck or hands"],
  },
  {
    icon: Bot,
    title: "AI-generated images",
    intro: "Pictures created from a text prompt by tools like Midjourney or DALL·E. They can look photo-real but contain subtle mistakes.",
    signs: ["Melted or unreadable text on signs", "Extra or merged fingers, odd teeth and ears", "Too-perfect, plastic-looking skin", "Backgrounds that repeat or bend strangely"],
  },
  {
    icon: Megaphone,
    title: "Fake news",
    intro: "False or misleading stories made to look like real news, often to get clicks, money or to influence opinions.",
    signs: ["Shocking headline with ALL CAPS or many exclamation marks", "No author, date or named source", "Website name that imitates a real outlet", "Only one site reports it"],
  },
  {
    icon: Eye,
    title: "Online misinformation",
    intro: "Any false information shared online — even by people who believe it is true, such as forwarded messages on WhatsApp.",
    signs: ["“Forward to everyone you know”", "Old photos reused for new events", "Statistics with no link to the data", "Strong emotional pressure to act now"],
  },
];

const FAQ: [string, string][] = [
  ["Can any tool prove an image is fake?", "No. Detection tools give probabilities and hints. Combine them with reverse image search, original sources and common sense."],
  ["What is a reverse image search?", "Upload a picture to Google Lens or TinEye to find where else it appears online — often revealing the original, older version."],
  ["What should I do if I already shared something false?", "Delete it, post a correction to the same group or feed, and share the reliable source you found."],
  ["What are Content Credentials (C2PA)?", "A new standard where cameras and editing apps attach a tamper-evident record of how an image was made. Verify Lens tells you when a file contains it."],
];

function Awareness() {
  return (
    <>
      <PageHeader
        icon={BookOpen}
        eyebrow="Awareness Centre"
        title="Learn the signs. Stop the spread."
        description="Simple, practical guides to the most common kinds of fake and misleading content online."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {TOPICS.map((t, i) => (
            <article key={t.title} style={{ animationDelay: `${i * 100}ms` }} className="animate-fade-up rounded-2xl border border-border bg-card-gradient p-6 shadow-card">
              <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary-glow">
                <t.icon className="size-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">{t.title}</h2>
              <p className="mt-2 text-muted-foreground">{t.intro}</p>
              <p className="mt-5 font-mono text-xs uppercase tracking-widest text-primary-glow">Warning signs</p>
              <ul className="mt-2 space-y-1.5">
                {t.signs.map((s) => (
                  <li key={s} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-glow" /> {s}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-bold">The S.T.O.P. rule</h2>
            <ol className="mt-5 space-y-4">
              {[
                ["S", "Stop", "Pause before reacting or forwarding."],
                ["T", "Trace", "Find who first posted it and when."],
                ["O", "Other sources", "Check if trusted outlets report it."],
                ["P", "Proof", "Look for evidence, not just opinions."],
              ].map(([l, h, d]) => (
                <li key={l} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-primary font-display text-lg font-bold text-primary-foreground">{l}</span>
                  <div>
                    <p className="font-semibold">{h}</p>
                    <p className="text-sm text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild variant="hero" className="mt-8">
              <Link to="/verify/news">Try a news check</Link>
            </Button>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Common questions</h2>
            <Accordion type="single" collapsible className="mt-4">
              {FAQ.map(([q, a]) => (
                <AccordionItem key={q} value={q}>
                  <AccordionTrigger className="text-left">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </>
  );
}
