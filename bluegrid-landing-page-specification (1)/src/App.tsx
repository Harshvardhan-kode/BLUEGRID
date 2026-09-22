import React, { useEffect, useRef, useState } from "react";
import { DeviceSVG } from "./components/Device";
import { TelemetrySection } from "./components/Telemetry";
import { MachineSection } from "./components/Machine";
import { ArchitectureSection } from "./components/Architecture";
import { AquiferSection } from "./components/Aquifer";
import { EconomicsSection } from "./components/Economics";
import { ComplianceSection } from "./components/Compliance";
import { FaqSection, Footer } from "./components/FaqFooter";
import { useActiveSection, useClock } from "./hooks";
import { fmtTime } from "./data";
import { cn } from "./utils/cn";
import { Icon, StatPill } from "./components/ui";

const ACCENT = "#0d9488";

const NAV = [
  { label: "Telemetry", href: "#telemetry", id: "telemetry" },
  { label: "The Machine", href: "#machine", id: "machine" },
  { label: "Architecture", href: "#architecture", id: "architecture" },
  { label: "Aquifer", href: "#aquifer", id: "aquifer" },
  { label: "Economics", href: "#economics", id: "economics" },
  { label: "Compliance", href: "#compliance", id: "compliance" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-abyss text-ink">
      <Nav />
      <main>
        <Hero />
        <TelemetrySection id="telemetry" />
        <MachineSection id="machine" />
        <ArchitectureSection id="architecture" />
        <AquiferSection id="aquifer" />
        <EconomicsSection id="economics" />
        <ComplianceSection id="compliance" />
        <FaqSection id="faq" />
      </main>
      <Footer />
    </div>
  );
}

/* ================= 1. Sticky header ================= */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV.map((n) => n.id));

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("slide-down fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled || open ? "navglass border-b border-line shadow-sm" : "bg-transparent")}>
      <div className="grad-bar absolute left-0 top-0 h-[2px] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} aria-hidden />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5" aria-label="BlueGrid home">
          <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
            <defs>
              <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0d9488" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <rect x="1.5" y="1.5" width="25" height="25" rx="5" fill="none" stroke="url(#logoG)" strokeWidth="1.8" />
            <path d="M14 6c3 3.6 5 6.2 5 8.7A5 5 0 0 1 9 14.7C9 12.2 11 9.6 14 6Z" fill="url(#logoG)" fillOpacity="0.28" stroke="url(#logoG)" strokeWidth="1.4" />
          </svg>
          <span className="leading-none">
            <span className="block font-display text-[16px] font-bold tracking-tight text-ink">BlueGrid</span>
            <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-ink3">Beyond the Flow</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={n.href}
              className={cn("nav-a font-mono text-[11px] uppercase tracking-[0.14em] transition-colors", active === n.id ? "font-semibold" : "text-ink2 hover:text-ink")}
              style={active === n.id ? { color: ACCENT } : undefined}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] sm:inline-flex">
            <span className="led h-1.5 w-1.5 rounded-full bg-ok blink" />
            <span className="text-ink2">BG-014</span>
            <span className="font-semibold text-ok">ONLINE · SYNCED</span>
          </span>
          <a
            href="#footer-contact"
            className="hidden rounded-lg px-4 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:brightness-110 sm:inline-block"
            style={{ background: ACCENT, boxShadow: "0 8px 20px -12px rgba(13,148,136,0.9)" }}
          >
            Request a Pilot
          </a>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle menu" className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-panel lg:hidden">
            <span className={cn("h-px bg-ink transition-transform duration-200", open && "translate-y-[3.5px] rotate-45")} style={{ width: 18 }} />
            <span className={cn("h-px bg-ink transition-transform duration-200", open && "-translate-y-[3.5px] -rotate-45")} style={{ width: 18 }} />
          </button>
        </div>
      </div>

      <div className={cn("navglass overflow-hidden border-line transition-all duration-300 lg:hidden", open ? "max-h-96 border-b" : "max-h-0")}>
        <nav className="flex flex-col px-5 py-4" aria-label="Mobile">
          {NAV.map((n) => (
            <a key={n.id} href={n.href} onClick={() => setOpen(false)} className="border-b border-line py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ink2 last:border-0">
              {n.label}
            </a>
          ))}
          <a href="#footer-contact" onClick={() => setOpen(false)} className="mt-3 rounded-lg px-4 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={{ background: ACCENT }}>
            Request a Pilot
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ================= 1. Hero ================= */

function Hero() {
  const now = useClock();
  const tiltRef = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
  };

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-16" onMouseMove={onMove}>
      <div className="abyss-bg absolute inset-0" aria-hidden />
      <div className="hero-glow absolute inset-0" aria-hidden />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-8 px-5 py-10 md:px-8 lg:grid-cols-2 lg:gap-4">
        <div className="order-2 lg:order-1">
          <div className="rise-in inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] shadow-sm">
            <span className="led h-2 w-2 rounded-full bg-ok blink" />
            <span className="text-ink2">BG-014</span>
            <span className="font-semibold text-ok">ONLINE · SYNCED</span>
            <span className="text-ink3">{fmtTime(now)}</span>
          </div>

          <h1 className="rise-in mt-6 font-display text-[11.5vw] font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[3.5rem]" style={{ animationDelay: "0.1s" }}>
            Smart Groundwater
            <br />
            <span style={{ color: ACCENT }}>Recharge Infrastructure</span>
          </h1>

          <p className="rise-in mt-6 max-w-lg text-lg leading-relaxed text-ink2" style={{ animationDelay: "0.2s" }}>
            Traceable inline filtration and deep borewell injection — every litre measured, verified, and returned to the
            aquifer, with an 18-component digital twin behind every reading.
          </p>

          <div className="rise-in mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.3s" }}>
            <a
              href="#telemetry"
              className="inline-flex items-center gap-2.5 rounded-lg px-7 py-4 font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:brightness-110"
              style={{ background: ACCENT, boxShadow: "0 14px 30px -16px rgba(13,148,136,0.95)" }}
            >
              Open Live Control Center <Icon name="arrow" className="h-3.5 w-3.5" />
            </a>
            <a href="#machine" className="group inline-flex items-center gap-2.5 rounded-lg border border-line bg-panel px-6 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-ink3">
              Inspect the Machine
              <svg viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-200 group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M7 2v10m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="rise-in mt-10 flex flex-wrap gap-3" style={{ animationDelay: "0.4s" }}>
            <StatPill n="3,400 L/Day" label="Capacity" hue="#0d9488" />
            <StatPill n="8" label="Live Sensors" hue="#0284c7" />
            <StatPill n="4" label="Filtration Stages" hue="#7c3aed" />
            <StatPill n="100%" label="Traceable" hue="#059669" />
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="relative h-[46svh] min-h-[340px] w-full max-w-[440px] lg:h-[68svh] lg:max-w-[520px]" style={{ ["--p" as string]: 0 }}>
            <div ref={tiltRef} className="tilt-wrap floaty h-full w-full" style={{ filter: "drop-shadow(0 24px 48px rgba(15,23,42,0.16))" }}>
              <DeviceSVG mode="hero" />
            </div>
            <div className="floaty absolute left-0 top-[14%] hidden sm:block" style={{ animationDelay: "0.6s" }}>
              <Chip label="pH" value="7.1" hue="#059669" />
            </div>
            <div className="floaty-b absolute right-0 top-[36%] hidden sm:block">
              <Chip label="Flow" value="8.4 L/min" hue="#0284c7" />
            </div>
            <div className="floaty absolute bottom-[8%] left-[4%] hidden sm:block" style={{ animationDelay: "1.2s" }}>
              <Chip label="Water Level" value="6.8 m" hue="#0d9488" />
            </div>
          </div>
        </div>
      </div>

      <a href="#telemetry" className="relative mx-auto mb-6 flex flex-col items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.3em] text-ink3 transition-colors hover:text-ink">
        Scroll to explore
        <svg viewBox="0 0 14 22" className="pulse-cue h-5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <rect x="1" y="1" width="12" height="20" rx="6" />
          <line x1="7" y1="6" x2="7" y2="10" strokeLinecap="round" />
        </svg>
      </a>
    </section>
  );
}

function Chip({ label, value, hue }: { label: string; value: string; hue: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-3.5 py-2.5 shadow-md" style={{ borderLeft: `3px solid ${hue}` }}>
      <div className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: hue }}>{label}</div>
      <div className="mt-0.5 font-mono text-[14px] font-bold tabular text-ink">{value}</div>
    </div>
  );
}
