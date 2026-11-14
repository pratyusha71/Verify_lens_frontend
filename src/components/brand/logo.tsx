import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <defs>
        <linearGradient id="vl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary-glow)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <path d="M20 2 35 8v11c0 9.5-6.4 16.4-15 19C11.4 35.4 5 28.5 5 19V8l15-6Z" fill="none" stroke="url(#vl-g)" strokeWidth="2" />
      <circle cx="20" cy="19" r="7.5" fill="none" stroke="url(#vl-g)" strokeWidth="2" />
      <circle cx="20" cy="19" r="3" fill="url(#vl-g)" />
      <path d="M25.5 24.5 30 29" stroke="url(#vl-g)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Verify Lens home">
      <LogoMark className="transition-transform group-hover:rotate-6" />
      <span className="font-display text-lg font-bold tracking-[0.14em]">
        VERIFY<span className="text-primary">LENS</span>
      </span>
    </Link>
  );
}
