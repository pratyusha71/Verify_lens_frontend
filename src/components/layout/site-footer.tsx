import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-surface/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <div>
            <p className="font-display font-semibold tracking-[0.12em]">VERIFY LENS</p>
            <p className="text-sm text-muted-foreground">Don't Believe Everything. Verify Everything.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
          <Link to="/verify/image" className="hover:text-foreground">Image</Link>
          <Link to="/verify/video" className="hover:text-foreground">Video</Link>
          <Link to="/verify/news" className="hover:text-foreground">News</Link>
          <Link to="/awareness" className="hover:text-foreground">Awareness Centre</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </nav>
      </div>
      <p className="border-t border-border/50 px-4 py-4 text-center text-xs text-muted-foreground">
        Results are AI opinions and metadata hints, not forensic proof. Always check trusted sources before sharing.
      </p>
    </footer>
  );
}
