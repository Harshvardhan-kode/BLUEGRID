import { useState } from "react";
import { FAQS } from "../data";
import { CONTACT } from "../cred";
import { Icon, Reveal, SectionHead } from "./ui";

const ACCENT = "#0d9488";

/* ==================================================================
   Section 8 — FAQ
   ================================================================== */

export function FaqSection({ id }: { id: string }) {
  return (
    <section id={id} className="relative border-t border-line subter-bg py-16 md:py-24">
      <div className="relative mx-auto max-w-4xl px-5 md:px-8">
        <SectionHead kicker="FAQ" accent={ACCENT} title="Common questions" align="center" />

        <div className="grad-border divide-y divide-line overflow-hidden">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 50}>
              <details className="faq group px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 transition-colors hover:text-[#0f766e]">
                  <span className="flex items-center gap-3 font-display text-base font-bold tracking-tight text-ink md:text-lg">
                    <span className="h-2 w-2 shrink-0 rounded-full transition-transform duration-200 group-open:scale-125" style={{ background: ACCENT }} />
                    {f.q}
                  </span>
                  <Icon name="plus" className="faq-x h-4 w-4 shrink-0 text-ink3" />
                </summary>
                <p className="max-w-2xl pb-5 pl-5 text-[13.5px] leading-relaxed text-ink2">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   Footer — contact form + direct details
   ================================================================== */

export function Footer() {
  const [sent, setSent] = useState(false);
  return (
    <footer className="relative border-t border-line abyss-bg pb-10 pt-16">
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
                <defs>
                  <linearGradient id="fLogo" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#0d9488" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="25" height="25" rx="5" fill="none" stroke="url(#fLogo)" strokeWidth="1.8" />
                <path d="M14 6c3 3.6 5 6.2 5 8.7A5 5 0 0 1 9 14.7C9 12.2 11 9.6 14 6Z" fill="url(#fLogo)" fillOpacity="0.28" stroke="url(#fLogo)" strokeWidth="1.4" />
              </svg>
              <span className="font-display text-xl font-bold tracking-tight text-ink">BlueGrid</span>
            </div>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink2">
              Smart groundwater recharge infrastructure — Beyond the Flow. Traceable inline filtration and deep borewell
              injection, with every reading sourced from a physical sensor.
            </p>

            <div className="mt-6 space-y-2.5">
              <a href={`mailto:${CONTACT.email}`} className="flex max-w-xs items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2.5 font-mono text-[12px] transition-colors hover:border-[#0d9488]">
                <Icon name="mail" className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="truncate text-ink2">{CONTACT.email}</span>
              </a>
              <a href={CONTACT.phoneHref} className="flex max-w-xs items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2.5 font-mono text-[12px] transition-colors hover:border-[#0d9488]">
                <Icon name="phone" className="h-4 w-4 shrink-0" style={{ color: "#0284c7" }} />
                <span className="tabular text-ink2">{CONTACT.phone}</span>
              </a>
              <div className="flex max-w-xs items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2.5 font-mono text-[12px]">
                <Icon name="pin" className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />
                <span className="text-ink2">{CONTACT.address}</span>
              </div>
            </div>
          </div>

          <div id="footer-contact" className="scroll-mt-24 lg:col-span-7">
            <div className="grad-border p-6">
              <h3 className="font-display text-lg font-bold text-ink">Request a pilot</h3>
              <p className="mt-1 text-[12.5px] text-ink3">{CONTACT.responseSla}.</p>
              <form
                className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                  setTimeout(() => setSent(false), 3200);
                }}
              >
                <Field label="Name" name="name" type="text" required />
                <Field label="Organization" name="org" type="text" />
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" type="tel" />
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">Message</span>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Site details, expected catchment, or questions about deployment…"
                    className="w-full resize-none rounded-lg border border-line bg-panel px-3 py-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink3 focus:border-[#0d9488]"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2.5 rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:brightness-110"
                    style={{ background: ACCENT, boxShadow: "0 10px 24px -14px rgba(13,148,136,0.9)" }}
                  >
                    Send request <Icon name="arrow" className="h-3.5 w-3.5" />
                  </button>
                  {sent && (
                    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase text-ok">
                      <Icon name="check" className="h-4 w-4" /> Received — we'll respond within 2 working days
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-ink3 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Beyond the Flow · BlueGrid Smart Recharge Infrastructure</span>
          <span>Demo telemetry generated from believable operating ranges</span>
        </div>
      </div>
    </footer>
  );
}

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <label>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">
        {label} {required && <span className="text-crit">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-[#0d9488]"
      />
    </label>
  );
}
