import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignInPrompt({ action }: { action: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-primary/40 bg-accent/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm">
        <Lock className="size-4 text-primary-glow" /> Sign in to {action} and save it to your dashboard.
      </p>
      <Button asChild variant="hero" size="sm">
        <Link to="/auth">Sign in</Link>
      </Button>
    </div>
  );
}
