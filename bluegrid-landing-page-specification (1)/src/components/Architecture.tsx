import type { ReactElement } from "react";
import { Reveal, SectionHead } from "./ui";

/* ==================================================================
   Section 4 — System Recharge Architecture
   ================================================================== */

const STEPS = [
  { n: "01", title: "Catchment & Intake", body: "Rooftop rainwater, RO-reject, or suitable wastewater enters through a first-flush diverter.", icon: "drop", hue: "#0d9488" },
  { n: "02", title: "4-Stage Micro Filtration", body: "Sediment → carbon → UF membrane → UV sterilizer, each verified by pressure differential.", icon: "layers", hue: "#0284c7" },
  { n: "03", title: "Continuous Telemetry", body: "Flow, pH, TDS and EC measured inline before a single litre is released downstream.", icon: "pulse", hue: "#7c3aed" },
  { n: "04", title: "Borewell Deep Recharge", body: "Treated water is injected into the recharge borewell. The aquifer stores; the sensor proves.", icon: "gauge", hue: "#059669" },
];

export function ArchitectureSection({ id }: { id: string }) {
  return (
    <section id={id} className="relative border-t border-line abyss-bg py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          kicker="System Architecture"
          accent="#0284c7"
          title="From rooftop to aquifer, one traceable pipeline"
          desc="Four stages, ordered exactly as the hardware runs them."
        />

        <div className="relative">
          <svg className="pointer-events-none absolute left-0 top-16 hidden h-2 w-full lg:block" viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="archFlow" x1="0" x2="1">
                <stop offset="0" stopColor="#0d9488" />
                <stop offset="0.4" stopColor="#0284c7" />
                <stop offset="0.7" stopColor="#7c3aed" />
                <stop offset="1" stopColor="#059669" />
              </linearGradient>
            </defs>
            <line x1="70" y1="4" x2="930" y2="4" stroke="url(#archFlow)" strokeWidth="2" className="flowline-slow" opacity="0.5" />
          </svg>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="card-hover relative flex h-full flex-col rounded-xl border border-line bg-panel p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${s.hue}14`, border: `1px solid ${s.hue}40` }}>
                    <IconIn name={s.icon} className="h-5 w-5" style={{ color: s.hue }} />
                  </div>
                  <div className="mt-4 font-mono text-[11px] font-bold tracking-[0.2em]" style={{ color: s.hue }}>{s.n}</div>
                  <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink2">{s.body}</p>
                  {i < STEPS.length - 1 && (
                    <svg viewBox="0 0 24 24" className="absolute -right-3.5 top-1/2 hidden h-6 w-6 -translate-y-1/2 lg:block" aria-hidden>
                      <circle cx="12" cy="12" r="11" fill="#ffffff" stroke="#e2e8f0" />
                      <path d="M10 8l4 4-4 4" fill="none" stroke={s.hue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function IconIn({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const paths: Record<string, ReactElement> = {
    drop: <path d="M12 3c3.5 4.2 6 7.4 6 10.4A6 6 0 0 1 6 13.4C6 10.4 8.5 7.2 12 3Z" />,
    layers: <><path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="m3 13 9 5 9-5" /></>,
    pulse: <path d="M3 12h4l2-6 3 12 2-6h7" />,
    gauge: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="M12 14l4-4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}
