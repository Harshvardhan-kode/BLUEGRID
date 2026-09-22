import { useMemo, useState } from "react";
import { Range, RANGES, fmtDay, fmtTime, getHistoricalMetrics } from "../data";
import { Reveal, SectionHead } from "./ui";
import { cn } from "../utils/cn";

/* ==================================================================
   Section 5 — Aquifer Recharge Visualizer
   ================================================================== */

const IMPACT = [
  { k: "Level rise, post-monsoon", v: "+0.39", u: "m", hue: "#0d9488" },
  { k: "Rainfall logged", v: "18.4", u: "mm", hue: "#0284c7" },
  { k: "Net recharge", v: "1,910", u: "L", hue: "#059669" },
];

export function AquiferSection({ id }: { id: string }) {
  const [range, setRange] = useState<Range>("30D");
  const rain = useMemo(() => getHistoricalMetrics("rainfall", range).points, [range]);
  const level = useMemo(() => getHistoricalMetrics("waterLevel", range).points, [range]);

  const W = 900, H = 360, L = 54, R = 58, T = 26, B = 36;
  const iw = W - L - R, ih = H - T - B;
  const n = level.length;
  const lmin = Math.min(...level.map((p) => p.v)) - 0.15;
  const lmax = Math.max(...level.map((p) => p.v)) + 0.15;
  const rmax = Math.max(1, ...rain.map((p) => p.v)) * 1.25;
  const X = (i: number) => L + (i / (n - 1)) * iw;
  const YL = (v: number) => T + ih - ((v - lmin) / (lmax - lmin)) * ih;
  const YR = (v: number) => T + ih - (v / rmax) * ih;

  const lpath = level.map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${YL(p.v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (n - 1)));

  return (
    <section id={id} className="relative border-t border-line subter-bg py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          kicker="Aquifer Recharge Visualizer"
          accent="#0d9488"
          title="Rainfall and the water table, on one axis"
          desc="Correlation is shown; causation is never claimed. Both curves share a clock — the conclusion is yours."
        />

        {/* impact snapshot cards */}
        <Reveal className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {IMPACT.map((s) => (
            <div key={s.k} className="rounded-xl border border-line bg-panel p-5 shadow-sm">
              <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink3">{s.k}</div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold leading-none tabular" style={{ color: s.hue }}>{s.v}</span>
                <span className="font-mono text-sm font-semibold text-ink2">{s.u}</span>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal delay={80}>
          <div className="grad-border overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink">Rainfall vs. aquifer level</span>
              <span className="hidden items-center gap-4 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink3 sm:flex">
                <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: "#38bdf8", opacity: 0.6 }} /> rainfall (mm)</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: "#0d9488" }} /> level (m)</span>
              </span>
              <div className="ml-auto flex overflow-hidden rounded-lg border border-line">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={cn("px-2.5 py-1 font-mono text-[10.5px] transition-colors", range === r ? "font-bold text-white" : "text-ink2 hover:bg-subter")}
                    style={range === r ? { background: "#0d9488" } : undefined}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 md:p-5">
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Rainfall bars against aquifer water level line">
                <defs>
                  <linearGradient id="aqFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#0d9488" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((k) => {
                  const v = lmin + ((lmax - lmin) * k) / 4;
                  return (
                    <g key={k}>
                      <line x1={L} x2={W - R} y1={YL(v)} y2={YL(v)} stroke="#e2e8f0" strokeWidth="1" />
                      <text x={L - 8} y={YL(v) + 3.5} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#0d9488">{v.toFixed(1)}</text>
                    </g>
                  );
                })}
                {[0, 1, 2].map((k) => {
                  const v = (rmax * k) / 2;
                  return <text key={k} x={W - R + 8} y={YR(v) + 3.5} fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#38bdf8">{Math.round(v)}</text>;
                })}
                {ticks.map((i) => (
                  <text key={i} x={X(i)} y={H - 12} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#94a3b8">
                    {range === "24H" ? fmtTime(level[i].t).slice(0, 5) : fmtDay(level[i].t)}
                  </text>
                ))}
                {rain.map((p, i) => {
                  const bw = Math.max(2, (iw / n) * 0.55);
                  return p.v > 0.05 ? <rect key={i} x={X(i) - bw / 2} y={YR(p.v)} width={bw} height={T + ih - YR(p.v)} fill="#38bdf8" opacity="0.5" /> : null;
                })}
                <path d={`${lpath} L${X(n - 1)},${T + ih} L${X(0)},${T + ih} Z`} fill="url(#aqFill)" />
                <path d={lpath} fill="none" stroke="#0d9488" strokeWidth="2.6" strokeLinejoin="round" />
                <text x={L} y={16} fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.5" fill="#0d9488">LEVEL · m</text>
                <text x={W - R} y={16} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.5" fill="#38bdf8">RAIN · mm</text>
              </svg>
            </div>

            <div className="border-t border-line px-5 py-3.5">
              <p className="max-w-3xl text-[12.5px] leading-relaxed text-ink2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#059669" }}>Observation, not causation — </span>
                the aquifer level rose 0.39 m in the weeks following the monsoon rainfall shown above. Whether the two are
                linked is an interpretation the operator makes; BlueGrid only places both curves on the same clock.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
