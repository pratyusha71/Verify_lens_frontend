import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

function safeRedirect(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//")
    ? v
    : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: safeRedirect(s["redirect"]),
  }),

  head: () => ({
    meta: [
      { title: "Sign in — Verify Lens" },
      {
        name: "description",
        content:
          "Sign in or create a Verify Lens account to run checks and keep your verification history.",
      },
      { property: "og:title", content: "Sign in — Verify Lens" },
      {
        property: "og:description",
        content: "Create an account to save your verification history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: AuthPage,
});

const GOOGLE_SVG = (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);

  const target = redirect ?? "/dashboard";

  useEffect(() => {
    if (user) {
      navigate({ to: target, replace: true });
    }
  }, [user, target, navigate]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }
  }

  async function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          display_name: String(f.get("name")).trim(),
        },
      },
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else if (!data.session) {
      toast.info("Check your email to confirm your account.");
    } else {
      toast.success("Account created!");
    }
  }

  async function google() {
    setBusy(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] place-items-center overflow-hidden bg-hero px-4 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-border bg-card-gradient p-7 shadow-glow">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-12" />

          <h1 className="mt-3 text-2xl font-bold">
            Welcome to Verify Lens
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to run checks and keep your history.
          </p>
        </div>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md google-btn px-3 text-sm font-medium transition hover:brightness-125 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : GOOGLE_SVG}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">Email</Label>
                <Input
                  id="si-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="si-pass">Password</Label>
                <Input
                  id="si-pass"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={busy}
              >
                {busy && <Loader2 className="animate-spin" />}
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Display name</Label>
                <Input
                  id="su-name"
                  name="name"
                  required
                  maxLength={60}
                  autoComplete="nickname"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input
                  id="su-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-pass">Password</Label>
                <Input
                  id="su-pass"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={busy}
              >
                {busy && <Loader2 className="animate-spin" />}
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}