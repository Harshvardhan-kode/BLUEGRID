import { ReactNode } from "react";
import { useInView } from "../hooks";
import { cn } from "../utils/cn";
import { Status, STATUS_COLOR, STATUS_WORD } from "../data";

/** Scroll-reveal wrapper with optional stagger delay. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "figure";
}) {
  const { ref, on } = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref as never} className={cn("reveal", on && "on", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Section header — deep-slate heading, muted body, single accent dot. */
export function SectionHead({
  kicker,
  title,
  desc,
  accent = "#0d9488",
  align = "left",
  className,
}: {
  kicker: string;
  title: ReactNode;
  desc?: ReactNode;
  accent?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-10 md:mb-14", align === "center" && "mx-auto text-center", className)}>
      <div className={cn("flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em]", align === "center" && "justify-center")}>
        <span className="h-2 w-2 shrink-0 rotate-45" style={{ background: accent }} aria-hidden />
        <span style={{ color: accent }}>{kicker}</span>
        {align === "left" && <span className="grad-rule h-px max-w-20 flex-1" />}
      </div>
      <h2 className={cn("mt-4 max-w-3xl font-display text-3xl font-bold leading-[1.08] tracking-tight text-ink md:text-5xl lg:text-[3.1rem]", align === "center" && "mx-auto")}>
        {title}
      </h2>
      {desc && <p className={cn("mt-4 max-w-xl text-base leading-relaxed text-ink2", align === "center" && "mx-auto")}>{desc}</p>}
    </Reveal>
  );
}

/** Status word — color is never the only signal. */
export function StatusWord({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("font-mono text-[10.5px] font-semibold tracking-[0.14em]", STATUS_COLOR[status], className)}>
      {STATUS_WORD[status]}
    </span>
  );
}

/** Direction-only trend arrow. */
export function TrendArrow({ dir, className }: { dir?: number; className?: string }) {
  if (dir === undefined) return null;
  const path = dir > 0 ? "M2 8 L7 3 L12 8 M7 3 V13" : dir < 0 ? "M2 6 L7 11 L12 6 M7 11 V1" : "M1 7 H13 M9 3 L13 7 L9 11";
  return (
    <svg viewBox="0 0 14 14" className={cn("h-3 w-3 text-ink3", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={path} />
    </svg>
  );
}

/** Severity glyph for the event log — shape + color, scannable at a glance. */
export function SeverityIcon({ kind, color, className }: { kind: "info" | "triangle" | "octagon"; color: string; className?: string }) {
  if (kind === "triangle") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M12 3.6 22 20H2L12 3.6Z" fill={`${color}1f`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 9.6v4.6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17.2" r="1.15" fill={color} />
      </svg>
    );
  }
  if (kind === "octagon") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M8.2 2.5h7.6L21.5 8.2v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2L8.2 2.5Z" fill={`${color}1f`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 7.6v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.15" fill={color} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.2" fill={`${color}1f`} stroke={color} strokeWidth="1.8" />
      <path d="M12 11v5.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.9" r="1.15" fill={color} />
    </svg>
  );
}

/** Minimal line icon set — consistent 1.6 stroke. */
export function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const paths: Record<string, ReactNode> = {
    drop: <path d="M12 3c3.5 4.2 6 7.4 6 10.4A6 6 0 0 1 6 13.4C6 10.4 8.5 7.2 12 3Z" />,
    gauge: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="M12 14l4-4" /></>,
    layers: <><path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="m3 13 9 5 9-5" /></>,
    pulse: <path d="M3 12h4l2-6 3 12 2-6h7" />,
    shield: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    arrow: <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
    check: <path d="m5 12 5 5L20 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
    pin: <><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.6" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

/** Hero metric pill. */
export function StatPill({ n, label, hue }: { n: string; label: string; hue: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-line bg-panel px-4 py-2.5 shadow-sm">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hue }} aria-hidden />
      <span className="font-display text-base font-bold text-ink">{n}</span>
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-ink3">{label}</span>
    </div>
  );
}
