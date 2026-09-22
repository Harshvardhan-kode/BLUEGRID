import { useEffect, useMemo, useRef, useState } from "react";
import {
  METRICS, MetricKey, Range, SeriesEvent,
  fmtDay, fmtTime, getAlerts, getCurrentMetrics, getHistoricalMetrics,
  statusOf, SEVERITY_COLOR, SEVERITY_ICON,
} from "../data";
import { Reveal, SectionHead, StatusWord, TrendArrow, Icon, SeverityIcon } from "./ui";
import { useClock } from "../hooks";
import { cn } from "../utils/cn";

const DASH_RANGES: Range[] = ["24H", "7D", "30D"];
const DASH_METRICS: MetricKey[] = ["waterLevel", "flowRate", "ph", "tds", "ec", "filterPressure"];

/* ==================================================================
   Section 2 — Live Telemetry Dashboard
   ================================================================== */

export function TelemetrySection({ id }: { id: string }) {
  const [metric, setMetric] = useState<MetricKey>("waterLevel");
  const [range, setRange] = useState<Range>("24H");
  const now = useClock();
  const chartRef = useRef<HTMLDivElement | null>(null);

  const jump = (m: MetricKey, r: Range) => {
    setMetric(m);
    setRange(DASH_RANGES.includes(r) ? r : "24H");
    chartRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id={id} className="relative border-t border-line subter-bg py-16 md:py-24">
      <div className="section-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            kicker="Live Telemetry"
            accent="#0d9488"
            title="Control center for BG-014"
            desc="Six live metrics, one correlated trend chart, and the real-time event log — every value sourced from a physical sensor."
            className="mb-0"
          />
          <div className="flex shrink-0 items-center gap-3 rounded-full border border-line bg-panel px-4 py-2.5 shadow-sm">
            <span className="led h-2 w-2 rounded-full bg-ok blink" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink3">Last sync</span>
            <span className="font-mono text-[13px] font-bold tabular text-ink">{fmtTime(now)}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {getCurrentMetrics()
            .filter((m) => DASH_METRICS.includes(m.key))
            .map((m, i) => (
              <MetricCard key={m.key} m={m} delay={i * 50} active={metric === m.key} onClick={() => setMetric(m.key)} />
            ))}
        </div>

        <div ref={chartRef}>
          <HistoryChart metric={metric} range={range} onMetric={setMetric} onRange={setRange} />
        </div>

        <div className="mt-6">
          <EventLog onJump={jump} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- metric tile — strong value hierarchy ---------------- */

function MetricCard({
  m, delay, active, onClick,
}: {
  m: ReturnType<typeof getCurrentMetrics>[number];
  delay: number;
  active: boolean;
  onClick: () => void;
}) {
  const meta = METRICS[m.key];
  return (
    <Reveal delay={delay}>
      <button
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "card-hover relative w-full overflow-hidden rounded-xl border bg-panel p-4 text-left",
          active ? "shadow-md" : "border-line"
        )}
        style={active ? { borderColor: meta.color, boxShadow: `0 10px 26px -18px ${meta.color}` } : undefined}
      >
        <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: meta.color }} aria-hidden />

        {/* label */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink3">{meta.label}</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
        </div>

        {/* PRIMARY VALUE — dominant */}
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="font-display text-[2.1rem] font-bold leading-none tracking-tight tabular text-ink">
            {m.value?.toLocaleString("en-IN", { maximumFractionDigits: meta.decimals })}
          </span>
          {m.unit && <span className="font-mono text-[11px] font-medium text-ink3">{m.unit}</span>}
          <TrendArrow dir={m.trend} className="ml-auto" />
        </div>

        {/* status — quietest tier */}
        <div className="mt-3 border-t border-line pt-2">
          <StatusWord status={m.status} />
        </div>
      </button>
    </Reveal>
  );
}

/* ---------------- trend chart ---------------- */

function HistoryChart({
  metric, range, onMetric, onRange,
}: {
  metric: MetricKey;
  range: Range;
  onMetric: (m: MetricKey) => void;
  onRange: (r: Range) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  const [event, setEvent] = useState<SeriesEvent | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setW(Math.max(320, e[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(() => getHistoricalMetrics(metric, range), [metric, range]);
  const rainSeries = useMemo(() => getHistoricalMetrics("rainfall", range), [range]);
  const corrKey = metric === "waterLevel" ? ("rainfall" as MetricKey) : METRICS[metric].correlate;
  const corrSeries = useMemo(() => (corrKey ? getHistoricalMetrics(corrKey, range) : null), [corrKey, range]);
  const meta = METRICS[metric];

  const H = 300, L = 50, R = 46, T = 18, B = 30;
  const iw = w - L - R, ih = H - T - B;
  const pts = series.points;
  const lo = Math.min(...pts.map((p) => p.v));
  const hi = Math.max(...pts.map((p) => p.v));
  const pad = (hi - lo) * 0.14 || 1;
  const y0 = lo - pad, y1 = hi + pad;
  const rainMax = Math.max(1, ...rainSeries.points.map((p) => p.v)) * 1.3;
  const X = (i: number) => L + (i / Math.max(1, pts.length - 1)) * iw;
  const Y = (v: number) => T + ih - ((v - y0) / (y1 - y0)) * ih;
  const YRain = (v: number) => T + ih - (v / rainMax) * ih;

  const path = useMemo(
    () => pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, w]
  );
  const area = `${path} L${X(pts.length - 1)},${T + ih} L${X(0)},${T + ih} Z`;
  const gridYs = [0, 1, 2, 3, 4].map((k) => y0 + ((y1 - y0) * k) / 4);
  const tickXs = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (pts.length - 1)));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round(((x - L) / iw) * (pts.length - 1));
    setHover(Math.min(pts.length - 1, Math.max(0, i)));
  };

  const hv = hover !== null ? pts[hover] : null;
  const flip = hover !== null && X(hover) > w - 210;

  return (
    <Reveal>
      <div className="grad-border overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 md:px-5">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink">Trend</span>
          <span className="hidden items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink3 md:flex">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: meta.color }} /> {meta.label}</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: "#38bdf8", opacity: 0.55 }} /> Rainfall</span>
          </span>

          <div className="flex overflow-hidden rounded-lg border border-line" role="tablist" aria-label="Time range">
            {DASH_RANGES.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => onRange(r)}
                className={cn(
                  "px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] transition-colors",
                  range === r ? "font-bold text-white" : "text-ink2 hover:bg-subter"
                )}
                style={range === r ? { background: "#0d9488" } : undefined}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">Metric</span>
            <select
              value={metric}
              onChange={(e) => onMetric(e.target.value as MetricKey)}
              className="rounded-lg border border-line bg-panel px-2.5 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-[#0d9488]"
            >
              {DASH_METRICS.map((k) => (
                <option key={k} value={k}>
                  {METRICS[k].label}{METRICS[k].unit ? ` (${METRICS[k].unit})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div ref={wrapRef} className="relative px-2 py-4 md:px-4">
          <div className={cn("relative", event && "md:mr-[280px]")}>
            <svg
              width={w - 16}
              height={H}
              viewBox={`0 0 ${w} ${H}`}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
              role="img"
              aria-label={`${meta.label} against rainfall over ${range}`}
              className="block max-w-full"
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={meta.color} stopOpacity="0.22" />
                  <stop offset="1" stopColor={meta.color} stopOpacity="0" />
                </linearGradient>
              </defs>

              {gridYs.map((v, i) => (
                <g key={i}>
                  <line x1={L} x2={w - R} y1={Y(v)} y2={Y(v)} stroke="#e2e8f0" strokeWidth="1" />
                  <text x={L - 8} y={Y(v) + 3.5} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#94a3b8">
                    {v >= 100 ? Math.round(v) : +v.toFixed(2)}
                  </text>
                </g>
              ))}
              {tickXs.map((i) => (
                <text key={i} x={X(i)} y={H - 8} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#94a3b8">
                  {range === "24H" ? fmtTime(pts[i].t).slice(0, 5) : fmtDay(pts[i].t)}
                </text>
              ))}
              {[0, 1, 2].map((k) => {
                const v = (rainMax * k) / 2;
                return (
                  <text key={`r${k}`} x={w - R + 8} y={YRain(v) + 3.5} fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#38bdf8">
                    {Math.round(v)}
                  </text>
                );
              })}
              <text x={L} y={12} fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.5" fill="#94a3b8">
                {meta.label.toUpperCase()}{meta.unit ? ` · ${meta.unit.toUpperCase()}` : ""}
              </text>
              <text x={w - R} y={12} textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" letterSpacing="1.5" fill="#38bdf8">RAIN · MM</text>

              {/* rainfall bars */}
              {rainSeries.points.map((p, i) =>
                p.v > 0.05 ? (
                  <rect
                    key={`b${i}`}
                    x={X(i) - Math.max(2, (iw / rainSeries.points.length) * 0.55) / 2}
                    y={YRain(p.v)}
                    width={Math.max(2, (iw / rainSeries.points.length) * 0.55)}
                    height={T + ih - YRain(p.v)}
                    fill="#38bdf8"
                    opacity="0.4"
                  />
                ) : null
              )}

              <path d={area} fill="url(#chartFill)" />
              <path d={path} fill="none" stroke={meta.color} strokeWidth="2.2" strokeLinejoin="round" />

              {series.events.map((ev, i) => (
                <g key={i} onClick={(e) => { e.stopPropagation(); setEvent(event === ev ? null : ev); }} className="cursor-pointer" role="button" aria-label={`Event: ${ev.title}`}>
                  <circle cx={X(ev.idx)} cy={Y(pts[ev.idx].v)} r="9" fill="#dc2626" opacity="0.12" />
                  <circle cx={X(ev.idx)} cy={Y(pts[ev.idx].v)} r="3.5" fill="#ffffff" stroke="#dc2626" strokeWidth="2" />
                </g>
              ))}

              {hv && hover !== null && (
                <g>
                  <line x1={X(hover)} x2={X(hover)} y1={T} y2={T + ih} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={X(hover)} cy={Y(hv.v)} r="4.5" fill="#ffffff" stroke={meta.color} strokeWidth="2.4" />
                </g>
              )}
            </svg>

            {hv && hover !== null && (
              <div className="glass-strong pointer-events-none absolute top-3 z-10 px-3.5 py-2.5" style={flip ? { right: w - X(hover) + 14 } : { left: X(hover) + 14 }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">
                  {fmtDay(hv.t)} · {fmtTime(hv.t).slice(0, 5)}
                </div>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between gap-6">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink3">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="font-mono text-[13px] font-bold tabular text-ink">{hv.v.toFixed(meta.decimals)} {meta.unit ?? ""}</span>
                  </div>
                  {corrSeries && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink3">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: METRICS[corrSeries.metric].color }} />
                        {METRICS[corrSeries.metric].label}
                      </span>
                      <span className="font-mono text-[12px] tabular text-ink2">
                        {corrSeries.points[hover].v.toFixed(METRICS[corrSeries.metric].decimals)} {METRICS[corrSeries.metric].unit ?? ""}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-6 border-t border-line pt-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink3">Status</span>
                    <StatusWord status={statusOf(metric, hv.v)} />
                  </div>
                </div>
              </div>
            )}

            {event && (
              <div className="border-t border-line p-4 md:absolute md:right-[-280px] md:top-0 md:w-[272px] md:border-l md:border-t-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-display text-base font-bold leading-tight text-ink">{event.title}</div>
                  <button onClick={() => setEvent(null)} aria-label="Close event panel" className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-ink3 hover:text-ink">×</button>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[["Detected", event.detected], ["Observed", event.observed], ["Expected range", event.expected], ["Duration", event.duration]].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">{k}</span>
                      <span className="text-right font-mono text-[12px] font-medium tabular text-ink">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border-l-2 p-3" style={{ borderColor: "#0d9488", background: "#f0fdfa" }}>
                  <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#0f766e" }}>Correlated observation</div>
                  <p className="mt-1 text-[12px] leading-snug text-ink2">{event.correlated}</p>
                </div>
                <button onClick={() => { onMetric(event.metric); setEvent(null); }} className="underline-link mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "#0d9488" }}>
                  View {METRICS[event.metric].label} <Icon name="arrow" className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-line px-4 py-2.5 md:px-5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink3">
            ○ event marker · click to inspect · hover for correlated metric
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- event log — iconography + color coding ---------------- */

function EventLog({ onJump }: { onJump: (m: MetricKey, r: Range) => void }) {
  const alerts = getAlerts();
  return (
    <Reveal>
      <div className="grad-border overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink">Real-time event log</span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink3">{alerts.length} entries · 24h</span>
        </div>
        <ul className="divide-y divide-line">
          {alerts.map((a) => {
            const color = SEVERITY_COLOR[a.severity];
            return (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-subter/70">
                <SeverityIcon kind={SEVERITY_ICON[a.severity]} color={color} className="h-6 w-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[13.5px] font-semibold text-ink">{a.title}</span>
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color, background: `${color}14`, border: `1px solid ${color}40` }}
                    >
                      {a.severity}
                    </span>
                    <span className="font-mono text-[10px] tabular text-ink3">{a.time}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-ink2">{a.desc}</p>
                </div>
                <button
                  onClick={() => onJump(a.metric, a.range)}
                  className="hidden shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink2 transition-colors hover:border-ink3 hover:text-ink sm:inline-flex"
                >
                  Inspect in chart <Icon name="arrow" className="h-2.5 w-2.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Reveal>
  );
}
