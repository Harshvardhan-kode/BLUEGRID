import { useMemo, useState } from "react";
import { CAPEX, CONSUMABLES, OPEX_ANNUAL } from "../cred";
import { Reveal, SectionHead } from "./ui";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const TANKER_RATE = 120;
const BLUEGRID_RATE = 22;
const ACCENT = "#0d9488";

/* ---------------- slider (interactive input) ---------------- */

function Slider({
  label, value, min, max, step, onChange, format, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; hint: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink2">{label}</label>
        <span className="font-display text-lg font-bold tabular text-ink">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT} ${pct}%, #e2e8f0 ${pct}%)` }}
        aria-label={label}
      />
      <p className="mt-2 text-[11.5px] leading-snug text-ink3">{hint}</p>
    </div>
  );
}

/* ==================================================================
   Section 6 — Unit Economics & ROI Calculator
   ================================================================== */

export function EconomicsSection({ id }: { id: string }) {
  const [dailyL, setDailyL] = useState(3400);
  const [tariff, setTariff] = useState(TANKER_RATE);
  const [offset, setOffset] = useState(70);

  const r = useMemo(() => {
    const annualRechargeL = dailyL * 365;
    const displacedL = (annualRechargeL * offset) / 100;
    const gross = (displacedL / 1000) * tariff;
    const net = gross - OPEX_ANNUAL.total;
    const paybackMonths = net > 0 ? (CAPEX.total / net) * 12 : Infinity;
    return { annualRechargeL, displacedL, gross, net, paybackMonths };
  }, [dailyL, tariff, offset]);

  const paybackYears = r.paybackMonths === Infinity ? null : r.paybackMonths / 12;

  return (
    <section id={id} className="relative border-t border-line subter-bg py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          kicker="Unit Economics"
          accent={ACCENT}
          title="What it costs, and when it pays back"
          desc="Full CAPEX and OPEX disclosure, then a live payback model you can interrogate."
        />

        {/* cost cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <div className="grad-border h-full p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink3">Capital expenditure</span>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink3">per unit</span>
              </div>
              <ul className="space-y-2">
                {[
                  ["Unit hardware", CAPEX.unitHardware],
                  ["Installation & plumbing", CAPEX.installation],
                  ["Commissioning & calibration", CAPEX.commissioning],
                  ["Borewell adaptation", CAPEX.borewellAdaptation],
                ].map(([k, v]) => (
                  <li key={k as string} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 font-mono text-[11.5px]">
                    <span className="text-ink3">{k}</span>
                    <span className="font-medium tabular text-ink">{inr(v as number)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink/80 pt-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">Total CAPEX</span>
                <span className="font-display text-2xl font-bold tabular text-ink">{inr(CAPEX.total)}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={60} className="lg:col-span-4">
            <div className="grad-border h-full p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink3">Operating expenditure</span>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink3">annual</span>
              </div>
              <ul className="space-y-2">
                {[
                  ["Consumables & filters", OPEX_ANNUAL.filters],
                  ["Telemetry & cloud", OPEX_ANNUAL.telemetry],
                  ["Calibration service", OPEX_ANNUAL.calibration],
                ].map(([k, v]) => (
                  <li key={k as string} className="flex items-baseline justify-between gap-3 border-b border-line pb-2 font-mono text-[11.5px]">
                    <span className="text-ink3">{k}</span>
                    <span className="font-medium tabular text-ink">{inr(v as number)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink/80 pt-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">Total OPEX / yr</span>
                <span className="font-display text-2xl font-bold tabular text-ink">{inr(OPEX_ANNUAL.total)}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-4">
            <div className="grad-border h-full p-5">
              <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink3">Filter replacement cycles</div>
              <ul className="space-y-2.5">
                {CONSUMABLES.map((c) => (
                  <li key={c.part} className="border-b border-line pb-2.5 last:border-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[12.5px] font-semibold text-ink">{c.part}</span>
                      <span className="font-mono text-[11px] font-medium tabular text-ink2">{inr(c.perYear)}/yr</span>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[10px] text-ink3">{c.cycle}</span>
                      <span className="font-mono text-[10px] tabular text-ink3">{inr(c.unitCost)} each</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ---------------- calculator: inputs | results ---------------- */}
        <Reveal delay={80} className="mt-10">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* INPUTS */}
            <div className="grad-border p-6 lg:col-span-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} aria-hidden />
                <h3 className="font-display text-lg font-bold tracking-tight text-ink">Adjust your inputs</h3>
              </div>
              <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.12em] text-ink3">Drag to model your site</p>

              <div className="space-y-7">
                <Slider label="Daily recharge volume" value={dailyL} min={500} max={5000} step={100} onChange={setDailyL} format={(v) => `${v.toLocaleString("en-IN")} L`} hint="Design capacity is 3,400 L/day." />
                <Slider label="Water tariff" value={tariff} min={40} max={250} step={5} onChange={setTariff} format={(v) => `₹${v} / 1,000 L`} hint="Pune tanker water averages ₹100–₹180 per 1,000 L." />
                <Slider label="Offset assumption" value={offset} min={10} max={100} step={5} onChange={setOffset} format={(v) => `${v}%`} hint="Share of recharged volume displacing water you would otherwise buy. Stated, not hidden — it is the most contested input." />
              </div>
            </div>

            {/* RESULTS — visually distinct card */}
            <div
              className="relative overflow-hidden rounded-[14px] border p-6 lg:col-span-7"
              style={{ borderColor: "#99f6e4", background: "linear-gradient(160deg,#f0fdfa 0%, #ffffff 58%)" }}
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="led h-2 w-2 rounded-full bg-ok blink" aria-hidden />
                  <h3 className="font-display text-lg font-bold tracking-tight text-ink">Your results</h3>
                </div>
                <span className="rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "#0f766e", borderColor: "#5eead4", background: "#ccfbf1" }}>
                  Live
                </span>
              </div>

              {/* hero result */}
              <div className="rounded-xl border bg-panel p-5 shadow-sm" style={{ borderColor: "#99f6e4" }}>
                <div className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em]" style={{ color: "#0f766e" }}>
                  Simple payback period
                </div>
                {paybackYears === null ? (
                  <>
                    <div className="mt-1.5 font-display text-4xl font-bold text-warn">No payback</div>
                    <p className="mt-1.5 text-[12px] leading-snug text-ink2">Net annual saving is negative at these settings — shown honestly rather than hidden.</p>
                  </>
                ) : (
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-5xl font-bold leading-none tabular text-ink">
                      {paybackYears < 1 ? Math.round(r.paybackMonths) : paybackYears.toFixed(1)}
                    </span>
                    <span className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-ink2">
                      {paybackYears < 1 ? "months" : "years"}
                    </span>
                    <span className="ml-auto font-mono text-[11px] tabular text-ink3">≈ {Math.round(r.paybackMonths)} mo</span>
                  </div>
                )}
              </div>

              {/* supporting outputs */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Out k="Annual recharge" v={`${(r.annualRechargeL / 1000).toFixed(0)} kL`} sub={`${dailyL.toLocaleString("en-IN")} L/day`} />
                <Out k="Water displaced" v={`${(r.displacedL / 1000).toFixed(0)} kL`} sub={`${offset}% of volume`} />
                <Out k="Gross annual saving" v={inr(r.gross)} sub={`at ₹${tariff}/1,000 L`} />
                <Out k="Net annual saving" v={inr(r.net)} sub={`after ${inr(OPEX_ANNUAL.total)} OPEX`} highlight={r.net > 0} />
              </div>

              {/* comparison */}
              <div className="mt-4 overflow-hidden rounded-xl border border-line bg-panel">
                <table className="w-full border-collapse text-left font-mono text-[11px]">
                  <caption className="sr-only">Cost comparison: tanker water versus BlueGrid per 1,000 litres</caption>
                  <thead>
                    <tr className="border-b border-line bg-subter font-semibold uppercase tracking-[0.12em] text-ink3">
                      <th className="px-3 py-2.5">Per 1,000 L</th>
                      <th className="px-3 py-2.5">Tanker</th>
                      <th className="px-3 py-2.5">BlueGrid</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    <tr className="border-b border-line">
                      <td className="px-3 py-2.5 text-ink3">Cash cost</td>
                      <td className="px-3 py-2.5 font-bold text-crit">₹{TANKER_RATE}</td>
                      <td className="px-3 py-2.5 font-bold text-ok">₹{BLUEGRID_RATE}</td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="px-3 py-2.5 text-ink3">Depletes aquifer</td>
                      <td className="px-3 py-2.5 font-semibold text-crit">YES</td>
                      <td className="px-3 py-2.5 font-semibold text-ok">NO — recharges</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 text-ink3">Verified volume</td>
                      <td className="px-3 py-2.5 text-ink3">None</td>
                      <td className="px-3 py-2.5 text-ink2">Metered inline</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink3">
                Simple payback excludes discounting, escalation and monsoon variability.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Out({ k, v, sub, highlight }: { k: string; v: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-panel p-4 ${highlight ? "border-[#5eead4]" : "border-line"}`}>
      <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink3">{k}</div>
      <div className={`mt-1.5 font-display text-2xl font-bold tabular ${highlight ? "text-ok" : "text-ink"}`}>{v}</div>
      <div className="mt-0.5 font-mono text-[10px] text-ink3">{sub}</div>
    </div>
  );
}
