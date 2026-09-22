import { STANDARDS } from "../cred";
import { Reveal, SectionHead, Icon } from "./ui";

/* ==================================================================
   Section 7 — Compliance Grid
   ================================================================== */

export function ComplianceSection({ id }: { id: string }) {
  return (
    <section id={id} className="relative border-t border-line abyss-bg py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead
          kicker="Compliance"
          accent="#059669"
          title="Regulated, referenced, and stated plainly"
          desc="Where BlueGrid complies with a standard, and where a standard is used strictly as a benchmark."
          align="center"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STANDARDS.map((s, i) => {
            const ok = s.status === "compliant";
            const tone = ok ? "#059669" : "#d97706";
            return (
              <Reveal key={s.ref} delay={i * 70}>
                <div className="card-hover relative h-full overflow-hidden rounded-xl border border-line bg-panel p-5 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tone }} aria-hidden />
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${tone}14`, border: `1px solid ${tone}38` }}>
                    <Icon name="shield" className="h-5 w-5" style={{ color: tone }} />
                  </div>
                  <h3 className="font-display text-base font-bold leading-snug text-ink">{s.ref}</h3>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink3">{s.body}</div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-ink2">{s.what}</p>
                  <div
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: tone, borderColor: `${tone}45`, background: `${tone}12` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                    {ok ? "COMPLIANT" : "REFERENCED"}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[12.5px] leading-relaxed text-ink3">
            Drinking-water benchmarks referenced elsewhere on this page are used strictly for inlet suitability.
            BlueGrid makes no potability or health claim anywhere in the product.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
