import { useEffect, useState } from "react";
import { COMPONENTS, SEQUENCE, STAGES } from "../data";
import { DeviceSVG, DeviceStageOverlay, NODE_PART, useExplodeToggle } from "./Device";
import { Reveal, SectionHead, StatusWord } from "./ui";
import { useScrollSteps } from "../hooks";
import { cn } from "../utils/cn";

const byNode = new Map(COMPONENTS.map((c) => [c.nodeId, c]));
const STAGE_HUE = ["#0d9488", "#0284c7", "#7c3aed", "#059669"];

/* ==================================================================
   Section 3 — The Machine · scrollytelling digital twin
   Sticky exploded diagram on the left, narrative steps scrolling on
   the right. The step nearest the reading line drives both the
   explode progress and which parts are spotlighted.
   ================================================================== */

export function MachineSection({ id }: { id: string }) {
  const { setRef, active } = useScrollSteps(SEQUENCE.length);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const step = SEQUENCE[active];
  const stageRef = useExplodeToggle(step.progress, 760);
  const isFinal = active === SEQUENCE.length - 1;

  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  // clear any docked panel when the story moves on
  useEffect(() => setSelected(null), [active]);

  return (
    <section id={id} className="relative border-t border-line abyss-bg py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          kicker="The Machine"
          accent="#0d9488"
          title="Eighteen components, told in eight steps"
          desc="Scroll to disassemble the BG-014. The diagram follows the story — each step spotlights the parts it describes."
        />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 md:px-8 lg:grid-cols-12 lg:gap-10">
        {/* ---------------- sticky diagram ---------------- */}
        <div className="lg:col-span-6 xl:col-span-7">
          <div className="lg:sticky lg:top-24">
            <div className="grad-border overflow-hidden">
              {/* progress header */}
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink">
                  BG-014 · exploded view
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink3 tabular">
                  Step {step.n} / 08
                </span>
              </div>

              {/* progress rail */}
              <div className="flex gap-1 border-b border-line px-5 py-3" aria-hidden>
                {SEQUENCE.map((s, i) => (
                  <span
                    key={s.n}
                    className="h-1 flex-1 rounded-full transition-all duration-500"
                    style={{ background: i <= active ? step.accent : "#e2e8f0" }}
                  />
                ))}
              </div>

              <div
                ref={stageRef}
                className={cn(
                  "relative flex h-[46svh] min-h-[340px] items-center justify-center px-4 py-6 lg:h-[62svh]",
                  "stage-focus",
                  isFinal && "parts-live"
                )}
                style={{ ["--p" as string]: 0 }}
              >
                <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
                <div className="relative h-full max-w-full" style={{ aspectRatio: "1040 / 1280" }}>
                  <DeviceSVG
                    mode="exploded"
                    live={isFinal}
                    highlight={step.parts}
                    hovered={hovered}
                    onHover={setHovered}
                    onSelect={(p) => setSelected((s) => (s === p ? null : p))}
                    selected={selected}
                    showLabels={active >= 5}
                  />
                  <DeviceStageOverlay selected={selected} onSelect={setSelected} />
                </div>
              </div>

              {/* active step caption */}
              <div className="flex items-center gap-3 border-t border-line px-5 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full transition-colors duration-500" style={{ background: step.accent }} />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{step.label}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink3">
                  {isFinal ? "Click any part" : `${step.parts.length} part${step.parts.length > 1 ? "s" : ""} active`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- scrolling narrative ---------------- */}
        <div className="lg:col-span-6 xl:col-span-5">
          <ol className="relative">
            {/* spine */}
            <span className="absolute bottom-0 left-[15px] top-2 w-px bg-line lg:block" aria-hidden />

            {SEQUENCE.map((s, i) => {
              const on = i === active;
              return (
                <li
                  key={s.n}
                  ref={setRef(i)}
                  className="relative scroll-mt-28 py-8 pl-12 first:pt-2 lg:min-h-[46svh] lg:py-12"
                >
                  {/* node marker */}
                  <span
                    className="absolute left-0 top-9 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-panel font-mono text-[11px] font-bold transition-all duration-400 lg:top-[3.4rem]"
                    style={{
                      borderColor: on ? s.accent : "#e2e8f0",
                      color: on ? s.accent : "#94a3b8",
                      boxShadow: on ? `0 0 0 5px ${s.accent}1a` : "none",
                    }}
                    aria-hidden
                  >
                    {s.n}
                  </span>

                  <div className={cn("transition-all duration-500", on ? "opacity-100" : "opacity-45")}>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{s.label}</h3>
                    <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink2">{s.summary}</p>

                    {/* components grouped under this step */}
                    <ul className="mt-5 space-y-2">
                      {s.nodes.map((nodeId) => {
                        const c = byNode.get(nodeId);
                        if (!c) return null;
                        const part = NODE_PART[nodeId];
                        return (
                          <li
                            key={nodeId}
                            onMouseEnter={() => isFinal && on && setHovered(part)}
                            onMouseLeave={() => setHovered(null)}
                            className={cn(
                              "flex items-center justify-between gap-4 rounded-lg border px-3.5 py-2.5 transition-colors",
                              on ? "border-line bg-panel" : "border-transparent bg-transparent"
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="shrink-0 font-mono text-[10px] font-bold tabular"
                                style={{ color: on ? s.accent : "#94a3b8" }}
                              >
                                {c.n < 10 ? `0${c.n}` : c.n}
                              </span>
                              <span className="truncate text-[13.5px] font-medium text-ink">{c.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[11.5px] font-semibold tabular text-ink2">
                              {c.live}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ---------------- filtration stack detail ---------------- */}
      <div className="mx-auto mt-16 max-w-7xl px-5 md:px-8">
        <FiltrationStack />
      </div>
    </section>
  );
}

/* ---------------- 4-stage filtration inspector ---------------- */

function FiltrationStack() {
  const [active, setActive] = useState("carbon");
  const stage = STAGES.find((s) => s.id === active) ?? STAGES[0];
  const idx = Math.max(0, STAGES.findIndex((s) => s.id === active));

  return (
    <>
      <Reveal>
        <div className="mb-6 flex items-center gap-3">
          <span className="h-2 w-2 rotate-45" style={{ background: "#059669" }} aria-hidden />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#059669" }}>
            4-Stage Filtration Stack
          </span>
          <span className="grad-rule h-px max-w-24 flex-1" />
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-2 md:mx-0 md:overflow-visible md:px-0">
          <div className="flex min-w-[720px] items-stretch gap-2 md:min-w-0">
            {STAGES.map((s, i) => {
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  aria-pressed={on}
                  className={cn(
                    "card-hover flex-1 rounded-xl border px-4 py-4 text-left transition-all",
                    on ? "bg-panel" : "border-line bg-panel/60"
                  )}
                  style={on ? { borderColor: STAGE_HUE[i], boxShadow: `0 10px 26px -18px ${STAGE_HUE[i]}` } : undefined}
                >
                  <div className="font-mono text-[9px] font-bold tracking-[0.2em]" style={{ color: on ? STAGE_HUE[i] : "#94a3b8" }}>
                    {s.tag}
                  </div>
                  <div className="mt-1 font-display text-[15px] font-bold leading-tight text-ink">{s.name}</div>
                  <div className="mt-2 font-mono text-[11px] font-semibold tabular text-ink2">{s.rows[0].v}</div>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="grad-border mt-5 grid grid-cols-1 gap-6 p-5 md:grid-cols-12 md:p-6">
          <div className="md:col-span-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: STAGE_HUE[idx] }}>
              {stage.tag}
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{stage.name}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink2">{stage.detail}</p>
          </div>
          <div className="md:col-span-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stage.rows.map((r) => (
                <div key={r.k} className="rounded-lg border border-line bg-subter px-3.5 py-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink3">{r.k}</div>
                  <div className="mt-1 font-display text-xl font-bold tabular text-ink">{r.v}</div>
                  <StatusWord status={r.status} className="mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}
