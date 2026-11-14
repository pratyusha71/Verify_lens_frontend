import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookOpenCheck, ExternalLink, FlaskConical, Link2, Newspaper, Quote, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/verify/page-header";
import { AnalysisLoader } from "@/components/verify/analysis-loader";
import { ResultPanel } from "@/components/verify/result-panel";
import { SignInPrompt } from "@/components/verify/sign-in-prompt";
import { useAuth } from "@/hooks/use-auth";
import { analyzeNews } from "@/lib/analysis.functions";
import { DEMO_NEWS } from "@/lib/demo-samples";
import type { AnalysisResult, ResultSource } from "@/lib/analysis-types";

export const Route = createFileRoute("/verify/news")({
  head: () => ({
    meta: [
      { title: "News Verification — Verify Lens" },
      { name: "description", content: "Paste a news claim or article link to get key claims, red flags and trusted sources to check." },
      { property: "og:title", content: "News Verification — Verify Lens" },
      { property: "og:description", content: "Check news claims and articles for misinformation red flags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsPage,
});

function safeHref(url: string): string | undefined {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function NewsPage() {
  const { user } = useAuth();
  const run = useServerFn(analyzeNews);
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<{ title: string; site: string; url: string } | null>(null);
  const [result, setResult] = useState<{ result: AnalysisResult; source: ResultSource } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!claim.trim() && !url.trim()) {
      toast.error("Enter a claim or an article URL.");
      return;
    }
    if (url.trim() && !safeHref(url.trim())) {
      toast.error("That doesn't look like a valid web link.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const out = await run({ data: { claim, url } });
      setArticle(out.article ?? null);
      setResult({ result: out.result, source: out.source });
      toast.success("Analysis saved to your dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const r = result?.result;

  return (
    <>
      <PageHeader
        icon={Newspaper}
        eyebrow="News verification"
        title="Check a claim before it spreads"
        description="Paste a headline, a forwarded message or a link to an article. We break it into claims, look for red flags and point you to trusted sources."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card-gradient p-5 shadow-card sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="claim" className="flex items-center gap-2">
              <Quote className="size-4 text-primary-glow" /> News claim
            </Label>
            <Textarea
              id="claim"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder="e.g. “Drinking hot water every hour kills the virus.”"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link2 className="size-4 text-primary-glow" /> Article URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/news/article" />
          </div>
          {!user && <SignInPrompt action="verify claims" />}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="hero" size="lg" disabled={!user || loading}>
              <ScanSearch /> Verify Claim
            </Button>
            <Button
              type="button"
              variant="glass"
              size="lg"
              disabled={loading}
              onClick={() => {
                setArticle(null);
                setResult({ result: DEMO_NEWS, source: "demo-sample" });
              }}
            >
              <FlaskConical /> View demo result
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The AI has no live internet search, so very recent events may come back as "unverifiable".
          </p>
        </form>

        <div className="space-y-5">
          {loading && <AnalysisLoader steps={["Reading the article", "Extracting key claims", "Checking for red flags", "Finding sources to check"]} />}
          {r && result && (
            <ResultPanel result={r} source={result.source}>
              {article && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Article analysed</p>
                  <p className="mt-1 font-medium">{article.title}</p>
                  {article.site && <p className="text-sm text-muted-foreground">{article.site}</p>}
                </div>
              )}
              {!!r.claims?.length && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Key claims</h3>
                  <ul className="space-y-2.5">
                    {r.claims.map((c, i) => (
                      <li key={i} className="rounded-xl border border-border bg-surface p-3.5">
                        <p className="font-medium">“{c.claim}”</p>
                        <p className="mt-1 text-sm text-muted-foreground">{c.assessment}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!!r.evidence?.length && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Evidence</h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm">
                    {r.evidence.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </section>
              )}
              {!!r.sourcesToCheck?.length && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <BookOpenCheck className="size-4" /> Sources to cross-check
                  </h3>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {r.sourcesToCheck.map((s, i) => {
                      const href = safeHref(s.url);
                      return (
                        <li key={i} className="rounded-xl border border-border bg-surface p-3.5">
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-primary-glow hover:underline">
                              {s.name} <ExternalLink className="size-3.5" />
                            </a>
                          ) : (
                            <p className="font-medium">{s.name}</p>
                          )}
                          <p className="mt-1 text-sm text-muted-foreground">{s.why}</p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </ResultPanel>
          )}
          {!loading && !result && (
            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <div>
                <ScanSearch className="mx-auto size-10 text-primary/60" />
                <p className="mt-3">Evidence and source information will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
