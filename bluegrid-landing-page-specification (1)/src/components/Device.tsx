import { useEffect, useMemo, useRef } from "react";
import { COMPONENTS } from "../data";
import { cn } from "../utils/cn";

/* Exploded-view geometry ------------------------------------------------
   Parts are drawn at their CLOSED positions; CSS (index.css) translates
   each part along (dx,dy) as --p goes 0→1 (0 = closed, 1 = fully exploded). */

const VB = { x: -210, y: -500, w: 1040, h: 1280 };

const ANCHORS: Record<string, { x: number; y: number; name: string }> = {
  cover: { x: 320, y: -160, name: "Enclosure Cover" },
  solar: { x: 320, y: -350, name: "Solar Panel" },
  charge: { x: 110, y: -40, name: "Charge Controller" },
  iot: { x: 250, y: -15, name: "IoT Module" },
  battery: { x: 400, y: -30, name: "Battery Pack" },
  control: { x: 150, y: 90, name: "Main Control Unit" },
  display: { x: 430, y: 90, name: "Display & Interface" },
  body: { x: -70, y: 460, name: "Enclosure Body" },
  sidepanel: { x: 651, y: 450, name: "Side Panel (Ventilation)" },
  sediment: { x: 110, y: 250, name: "Sediment Filter" },
  carbon: { x: 250, y: 250, name: "Carbon Filter" },
  uf: { x: 430, y: 250, name: "UF Membrane" },
  pump: { x: 150, y: 385, name: "Pressure Pump" },
  uv: { x: 470, y: 330, name: "UV Sterilizer" },
  flow: { x: 110, y: 480, name: "Flow Sensor" },
  ph: { x: 250, y: 480, name: "pH Sensor" },
  tds: { x: 510, y: 480, name: "TDS Sensor" },
  base: { x: 320, y: 585, name: "Base Plate" },
};

const LABELS: { n: string; name: string; y: number; tx: number; ty: number; side: "L" | "R"; part: string }[] = [
  { n: "02", name: "SOLAR PANEL", y: -360, tx: 167, ty: -350, side: "L", part: "solar" },
  { n: "03", name: "CHARGE CONTROLLER", y: -305, tx: 79, ty: -40, side: "L", part: "charge" },
  { n: "06", name: "MAIN CONTROL UNIT", y: -250, tx: 110, ty: 90, side: "L", part: "control" },
  { n: "09", name: "SEDIMENT FILTER", y: -195, tx: 79, ty: 250, side: "L", part: "sediment" },
  { n: "10", name: "CARBON FILTER", y: -140, tx: 219, ty: 165, side: "L", part: "carbon" },
  { n: "12", name: "PRESSURE PUMP", y: -85, tx: 112, ty: 385, side: "L", part: "pump" },
  { n: "13", name: "FLOW SENSOR", y: -30, tx: 86, ty: 480, side: "L", part: "flow" },
  { n: "17", name: "BASE PLATE", y: 25, tx: 140, ty: 585, side: "L", part: "base" },
  { n: "14", name: "pH SENSOR", y: 135, tx: 250, ty: 465, side: "L", part: "ph" },
  { n: "08", name: "ENCLOSURE BODY", y: 190, tx: 30, ty: 249, side: "L", part: "body" },
  { n: "01", name: "ENCLOSURE COVER", y: -360, tx: 397, ty: -160, side: "R", part: "cover" },
  { n: "04", name: "BATTERY PACK", y: -305, tx: 431, ty: -30, side: "R", part: "battery" },
  { n: "05", name: "IOT MODULE", y: -250, tx: 277, ty: -15, side: "R", part: "iot" },
  { n: "07", name: "DISPLAY & INTERFACE", y: -195, tx: 482, ty: 90, side: "R", part: "display" },
  { n: "11", name: "UF MEMBRANE", y: -140, tx: 430, ty: 228, side: "R", part: "uf" },
  { n: "16", name: "UV STERILIZER", y: -85, tx: 477, ty: 330, side: "R", part: "uv" },
  { n: "18", name: "SIDE PANEL (VENT)", y: -30, tx: 662, ty: 450, side: "R", part: "sidepanel" },
  { n: "15", name: "TDS SENSOR", y: 25, tx: 517, ty: 480, side: "R", part: "tds" },
];

const byNode = new Map(COMPONENTS.map((c) => [c.nodeId, c]));
export const PART_NODE: Record<string, string> = {
  cover: "bluegrid-enclosure-cover",
  solar: "bluegrid-solar-panel",
  charge: "bluegrid-charge-controller",
  iot: "bluegrid-iot-module",
  battery: "bluegrid-battery",
  control: "bluegrid-control-unit",
  display: "bluegrid-display",
  body: "bluegrid-enclosure-body",
  sidepanel: "bluegrid-side-panel",
  sediment: "bluegrid-filter-sediment",
  carbon: "bluegrid-filter-carbon",
  uf: "bluegrid-filter-uf",
  pump: "bluegrid-pressure-pump",
  uv: "bluegrid-uv-sterilizer",
  flow: "bluegrid-flow-sensor",
  ph: "bluegrid-ph-sensor",
  tds: "bluegrid-tds-sensor",
  base: "bluegrid-base-plate",
};
export const NODE_PART: Record<string, string> = Object.fromEntries(
  Object.entries(PART_NODE).map(([p, n]) => [n, p])
);

/** Animates the local --p CSS var toward a target progress (0..1). */
export function useExplodeToggle(target: number, duration = 760) {
  const ref = useRef<HTMLDivElement | null>(null);
  const from = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = performance.now();
    const startVal = from.current;
    let raf = 0;
    const step = (ts: number) => {
      const k = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = startVal + (target - startVal) * eased;
      el.style.setProperty("--p", v.toFixed(4));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}

function PartG({
  id,
  live,
  children,
  onHover,
  onSelect,
  selected,
  highlighted,
}: {
  id: string;
  live: boolean;
  selected: boolean;
  highlighted?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const a = ANCHORS[id];
  return (
    <g
      className={cn("xpart animated part", `xp-${id}`, selected && "sel", highlighted && "hl")}
      data-part={id}
      tabIndex={live ? 0 : -1}
      role={live ? "button" : undefined}
      aria-label={live ? `${a.name} — open component data` : undefined}
      onMouseEnter={() => live && onHover(id)}
      onMouseLeave={() => live && onHover(null)}
      onClick={() => live && onSelect(id)}
      onKeyDown={(e) => {
        if (live && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(id);
        }
      }}
    >
      {children}
    </g>
  );
}

/* light-theme material palette */
const stroke = "#475569";
const M = {
  shellFill: "#e2e8f0",
  shellInner: "#f1f5f9",
  bolt: "#cbd5e1",
  bodyDark: "#94a3b8",
  screen: "#0f172a",
  metal: "#cbd5e1",
  metalDeep: "#94a3b8",
  teal: "#0d9488",
  aqua: "#0284c7",
  mint: "#059669",
  amber: "#d97706",
  violet: "#7c3aed",
};

export function DeviceSVG({
  mode,
  live = false,
  onHover,
  onSelect,
  selected,
  hovered,
  showLabels = false,
  highlight,
}: {
  mode: "hero" | "exploded";
  live?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  selected?: string | null;
  hovered?: string | null;
  showLabels?: boolean;
  highlight?: string[];
}) {
  const P = (id: string, children: React.ReactNode) => (
    <PartG
      id={id}
      live={live}
      selected={selected === id}
      highlighted={highlight?.includes(id)}
      onHover={onHover ?? (() => {})}
      onSelect={onSelect ?? (() => {})}
    >
      {children}
    </PartG>
  );

  return (
    <svg
      viewBox={mode === "hero" ? "60 110 520 700" : `${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className="h-full w-full"
      role="img"
      aria-label="BlueGrid BG-014 recharge unit — 18 labelled components"
    >
      <defs>
        <linearGradient id="coverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#eef2f7" />
          <stop offset="1" stopColor="#dbe3ec" />
        </linearGradient>
        <linearGradient id="cylLight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.4" stopColor="#dbe4ee" />
          <stop offset="0.78" stopColor="#bcc9d8" />
          <stop offset="1" stopColor="#a6b5c7" />
        </linearGradient>
        <linearGradient id="cylDark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8496ab" />
          <stop offset="0.45" stopColor="#64748b" />
          <stop offset="1" stopColor="#4a5768" />
        </linearGradient>
        <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e4f7a" />
          <stop offset="0.5" stopColor="#173e63" />
          <stop offset="1" stopColor="#10304e" />
        </linearGradient>
      </defs>

      {/* ---------- 08 · ENCLOSURE BODY ---------- */}
      {P(
        "body",
        <>
          <rect className="part-outline" x="150" y="210" width="340" height="526" rx="12" fill={M.shellFill} stroke={stroke} strokeWidth="1.6" />
          <rect x="166" y="226" width="308" height="494" rx="8" fill={M.shellInner} stroke="#cbd5e1" strokeWidth="1" />
          {[[162, 222], [478, 222], [162, 724], [478, 724]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="4" fill={M.bolt} stroke={stroke} strokeWidth="1" />
          ))}
        </>
      )}

      {/* ---------- 02 · SOLAR PANEL ---------- */}
      {P(
        "solar",
        <>
          <rect x="170" y="196" width="12" height="16" fill={M.bolt} stroke={stroke} strokeWidth="1.2" />
          <rect x="458" y="196" width="12" height="16" fill={M.bolt} stroke={stroke} strokeWidth="1.2" />
          <rect className="part-outline" x="130" y="150" width="380" height="46" rx="4" fill="url(#solarGrad)" stroke={stroke} strokeWidth="1.6" />
          {[168, 206, 244, 282, 320, 358, 396, 434, 472].map((x) => (
            <line key={x} x1={x} y1="152" x2={x} y2="194" stroke="#7dd3fc" strokeWidth="1" opacity="0.4" />
          ))}
          <line x1="132" y1="173" x2="508" y2="173" stroke="#7dd3fc" strokeWidth="1" opacity="0.4" />
        </>
      )}

      {/* ---------- 18 · SIDE PANEL ---------- */}
      {P(
        "sidepanel",
        <>
          <rect x="486" y="320" width="6" height="18" fill={M.bolt} stroke={stroke} strokeWidth="1" />
          <rect x="486" y="560" width="6" height="18" fill={M.bolt} stroke={stroke} strokeWidth="1" />
          <rect className="part-outline" x="490" y="300" width="22" height="300" rx="4" fill={M.metal} stroke={stroke} strokeWidth="1.6" />
          {[330, 365, 400, 435, 470, 505, 540, 570].map((y) => (
            <line key={y} x1="495" y1={y} x2="507" y2={y} stroke={M.metalDeep} strokeWidth="2" />
          ))}
        </>
      )}

      {/* ---------- 03 · CHARGE CONTROLLER ---------- */}
      {P(
        "charge",
        <>
          <rect className="part-outline" x="182" y="240" width="70" height="80" rx="6" fill="#e8edf3" stroke={stroke} strokeWidth="1.5" />
          <rect x="192" y="252" width="50" height="20" rx="2" fill={M.screen} />
          <text x="217" y="266" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5eead4">MPPT</text>
          <circle cx="198" cy="296" r="4" fill={M.mint} className="blink" />
          <circle cx="214" cy="296" r="4" fill={M.amber} opacity="0.45" />
          <line x1="236" y1="286" x2="236" y2="308" stroke={M.metalDeep} strokeWidth="2" />
        </>
      )}

      {/* ---------- 05 · IOT MODULE ---------- */}
      {P(
        "iot",
        <>
          <line x1="440" y1="240" x2="440" y2="218" stroke={stroke} strokeWidth="1.5" />
          <circle cx="440" cy="215" r="3" fill={M.teal} className="blink" />
          <path d="M428 224 a16 16 0 0 1 24 0" fill="none" stroke={M.teal} strokeWidth="1.4" opacity="0.6" />
          <rect className="part-outline" x="392" y="240" width="60" height="60" rx="6" fill="#e8edf3" stroke={stroke} strokeWidth="1.5" />
          <rect x="402" y="252" width="40" height="6" rx="3" fill={M.metalDeep} />
          <rect x="402" y="264" width="40" height="6" rx="3" fill={M.metalDeep} />
          <circle cx="410" cy="286" r="4" fill={M.teal} className="blink" />
        </>
      )}

      {/* ---------- 04 · BATTERY PACK ---------- */}
      {P(
        "battery",
        <>
          <rect x="398" y="302" width="10" height="6" fill={M.metalDeep} stroke={stroke} strokeWidth="1" />
          <rect x="446" y="302" width="10" height="6" fill={M.metalDeep} stroke={stroke} strokeWidth="1" />
          <rect className="part-outline" x="392" y="308" width="70" height="54" rx="6" fill="#dbe3ec" stroke={stroke} strokeWidth="1.5" />
          <line x1="415" y1="312" x2="415" y2="358" stroke={M.metalDeep} strokeWidth="1.4" />
          <line x1="438" y1="312" x2="438" y2="358" stroke={M.metalDeep} strokeWidth="1.4" />
          <text x="427" y="340" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#475569">87%</text>
        </>
      )}

      {/* ---------- 06 · MAIN CONTROL UNIT ---------- */}
      {P(
        "control",
        <>
          <rect className="part-outline" x="182" y="330" width="90" height="58" rx="6" fill="#e8edf3" stroke={stroke} strokeWidth="1.5" />
          <rect x="196" y="342" width="26" height="26" rx="2" fill={M.screen} />
          {[350, 356, 362].map((y) => (
            <line key={y} x1="228" y1={y} x2="258" y2={y} stroke={M.metalDeep} strokeWidth="1.6" />
          ))}
          <circle cx="204" cy="378" r="3" fill={M.mint} className="blink" />
        </>
      )}

      {/* ---------- 16 · UV STERILIZER ---------- */}
      {P(
        "uv",
        <>
          <rect className="part-outline" x="452" y="405" width="16" height="230" rx="8" fill="#dbe3ec" stroke={stroke} strokeWidth="1.5" />
          <rect x="455" y="412" width="10" height="216" rx="5" fill={M.violet} className="uv-glow" />
          <rect x="448" y="405" width="24" height="10" rx="3" fill={M.metalDeep} stroke={stroke} strokeWidth="1.2" />
          <rect x="448" y="625" width="24" height="10" rx="3" fill={M.metalDeep} stroke={stroke} strokeWidth="1.2" />
        </>
      )}

      {/* ---------- 09 · SEDIMENT FILTER ---------- */}
      {P(
        "sediment",
        <>
          <rect x="186" y="405" width="64" height="22" rx="8" fill="#94a3b8" stroke={stroke} strokeWidth="1.5" />
          <rect className="part-outline" x="186" y="418" width="64" height="202" rx="24" fill="url(#cylLight)" stroke={stroke} strokeWidth="1.6" />
          {[470, 520, 570].map((y) => (
            <line key={y} x1="190" y1={y} x2="246" y2={y} stroke="#94a3b8" strokeWidth="1.2" opacity="0.7" />
          ))}
          <text x="218" y="505" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#475569" transform="rotate(-90 218 505)">SEDIMENT</text>
        </>
      )}

      {/* ---------- 10 · CARBON FILTER ---------- */}
      {P(
        "carbon",
        <>
          <rect x="270" y="405" width="64" height="22" rx="8" fill="#4a5768" stroke={stroke} strokeWidth="1.5" />
          <rect className="part-outline" x="270" y="418" width="64" height="202" rx="24" fill="url(#cylDark)" stroke={stroke} strokeWidth="1.6" />
          {[470, 520, 570].map((y) => (
            <line key={y} x1="274" y1={y} x2="330" y2={y} stroke="#475569" strokeWidth="1.2" opacity="0.7" />
          ))}
          <text x="302" y="505" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#f1f5f9" transform="rotate(-90 302 505)">CARBON</text>
        </>
      )}

      {/* ---------- 11 · UF MEMBRANE ---------- */}
      {P(
        "uf",
        <>
          <circle cx="382" cy="455" r="12" fill="#94a3b8" stroke={stroke} strokeWidth="1.4" />
          <circle cx="463" cy="455" r="12" fill="#94a3b8" stroke={stroke} strokeWidth="1.4" />
          <rect className="part-outline" x="380" y="430" width="85" height="50" rx="25" fill="url(#cylLight)" stroke={stroke} strokeWidth="1.6" />
          {[398, 412, 426, 440, 452].map((x) => (
            <line key={x} x1={x} y1="436" x2={x} y2="474" stroke="#8496ab" strokeWidth="1" opacity="0.8" />
          ))}
        </>
      )}

      {/* ---------- 12 · PRESSURE PUMP ---------- */}
      {P(
        "pump",
        <>
          <rect className="part-outline" x="380" y="505" width="85" height="70" rx="10" fill="#dbe3ec" stroke={stroke} strokeWidth="1.6" />
          <circle cx="422" cy="540" r="24" fill="#bcc9d8" stroke={stroke} strokeWidth="1.5" />
          <g className="spin-slow">
            <line x1="422" y1="522" x2="422" y2="558" stroke={M.aqua} strokeWidth="2" />
            <line x1="404" y1="540" x2="440" y2="540" stroke={M.aqua} strokeWidth="2" />
          </g>
          <circle cx="422" cy="540" r="4" fill={M.teal} />
          <rect x="388" y="512" width="18" height="8" rx="2" fill={M.metalDeep} />
        </>
      )}

      {/* ---------- pipes / manifold ---------- */}
      <g className="xp-pipes">
        <ellipse cx="320" cy="778" rx="215" ry="11" fill="#0f172a" opacity="0.07" />
        <rect x="186" y="648" width="284" height="14" rx="7" fill="#cbd5e1" stroke={stroke} strokeWidth="1.4" />
        <rect x="200" y="400" width="130" height="10" rx="5" fill="#cbd5e1" stroke={stroke} strokeWidth="1.2" />
        <path d="M 422 480 V 505" stroke="#cbd5e1" strokeWidth="9" strokeLinecap="round" />
        <path d="M 305 620 V 640 H 372 V 455 H 380" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeLinecap="round" />
        {/* animated water flow */}
        {["M 168 655 H 218 V 616", "M 218 412 V 405 H 302 V 412", "M 302 616 V 636 H 368 V 455 H 378", "M 422 482 V 503", "M 460 575 V 648", "M 440 655 H 200"].map((d, i) => (
          <path key={i} className="flowline" d={d} fill="none" stroke={M.teal} strokeWidth="2.4" strokeLinecap="round" />
        ))}
        <circle cx="250" cy="655" r="5" fill={M.teal} className="ping-dot" />
        <circle cx="330" cy="660" r="5" fill={M.teal} className="ping-dot" style={{ animationDelay: "0.8s" }} />
        <circle cx="400" cy="660" r="5" fill={M.teal} className="ping-dot" style={{ animationDelay: "1.6s" }} />
      </g>

      {/* ---------- 13 · FLOW SENSOR ---------- */}
      {P(
        "flow",
        <>
          <rect className="part-outline" x="222" y="634" width="56" height="30" rx="6" fill="#e8edf3" stroke={stroke} strokeWidth="1.5" />
          <rect x="230" y="640" width="26" height="14" rx="2" fill={M.screen} />
          <text x="243" y="650" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#5eead4">8.4</text>
          <circle cx="266" cy="649" r="6" fill="#bcc9d8" stroke={stroke} strokeWidth="1.2" />
          <rect x="244" y="664" width="12" height="16" fill="#cbd5e1" stroke={stroke} strokeWidth="1.2" />
        </>
      )}

      {/* ---------- 14 · pH SENSOR ---------- */}
      {P(
        "ph",
        <>
          <line x1="330" y1="640" x2="330" y2="628" stroke={stroke} strokeWidth="1.4" />
          <rect className="part-outline" x="322" y="640" width="16" height="40" rx="8" fill={M.mint} stroke={stroke} strokeWidth="1.5" />
          <rect x="325" y="646" width="10" height="8" rx="2" fill="#ecfdf5" opacity="0.9" />
        </>
      )}

      {/* ---------- 15 · TDS SENSOR ---------- */}
      {P(
        "tds",
        <>
          <line x1="400" y1="640" x2="400" y2="628" stroke={stroke} strokeWidth="1.4" />
          <rect className="part-outline" x="392" y="640" width="16" height="40" rx="8" fill={M.violet} stroke={stroke} strokeWidth="1.5" />
          <rect x="395" y="646" width="10" height="8" rx="2" fill="#f5f3ff" opacity="0.9" />
        </>
      )}

      {/* ---------- 01 · ENCLOSURE COVER ---------- */}
      {P(
        "cover",
        <>
          <rect className="part-outline" x="150" y="210" width="340" height="526" rx="12" fill="url(#coverGrad)" stroke={stroke} strokeWidth="1.8" />
          <rect x="240" y="248" width="160" height="76" rx="6" fill={M.screen} stroke={stroke} strokeWidth="1.4" />
          <text x="252" y="272" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="2" fill="#64748b">F</text>
          <text x="264" y="273" fontFamily="IBM Plex Mono, monospace" fontSize="14" fontWeight="500" fill="#5eead4">8.4</text>
          <text x="298" y="273" fontFamily="IBM Plex Mono, monospace" fontSize="9" letterSpacing="1.5" fill="#64748b">L/MIN</text>
          <rect x="252" y="282" width="96" height="22" rx="3" fill="#020617" stroke="#1e293b" strokeWidth="0.8" />
          <rect className="disp-scan" x="258" y="292" width="2" height="10" fill="#5eead4" opacity="0.7" />
          <polyline points="258,300 266,296 274,298 282,292 290,295 298,289 306,293 314,287 322,290 330,284 338,288 346,283" fill="none" stroke="#34d399" strokeWidth="1.6" />
          <rect x="346" y="294" width="3" height="7" fill="#34d399" />
          <text x="252" y="318" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#7dd3fc">pH 7.1</text>
          <circle cx="452" cy="240" r="4" fill={M.mint} className="blink" />
          {/* cutaway window */}
          <rect x="185" y="392" width="285" height="288" rx="8" fill="#334155" stroke={stroke} strokeWidth="1.4" />
          <text x="320" y="706" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="3" fill="#64748b">BEYOND THE FLOW</text>
          {[700, 708, 716].map((y) => (
            <line key={y} x1="200" y1={y} x2="440" y2={y} stroke="#cbd5e1" strokeWidth="1.4" />
          ))}
          <rect x="472" y="440" width="8" height="60" rx="4" fill={M.bolt} stroke={stroke} strokeWidth="1.2" />
        </>
      )}

      {/* ---------- 07 · DISPLAY ---------- */}
      {P(
        "display",
        <>
          <rect className="part-outline" x="264" y="250" width="112" height="70" rx="5" fill={M.screen} stroke={stroke} strokeWidth="1.5" />
          <text x="276" y="272" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#5eead4">pH 7.1</text>
          <text x="276" y="289" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#7dd3fc">8.4 L/min</text>
          <polyline points="276,308 288,304 300,306 312,300 324,303 336,297 348,301 360,295" fill="none" stroke="#5eead4" strokeWidth="1.6" />
          <circle cx="364" cy="258" r="3" fill="#34d399" className="blink" />
        </>
      )}

      {/* ---------- 17 · BASE PLATE ---------- */}
      {P(
        "base",
        <>
          <rect x="150" y="762" width="34" height="8" rx="2" fill={M.metalDeep} stroke={stroke} strokeWidth="1.2" />
          <rect x="456" y="762" width="34" height="8" rx="2" fill={M.metalDeep} stroke={stroke} strokeWidth="1.2" />
          <rect className="part-outline" x="120" y="736" width="400" height="26" rx="4" fill={M.shellFill} stroke={stroke} strokeWidth="1.6" />
          {[140, 320, 500].map((x) => (
            <circle key={x} cx={x} cy="749" r="3.5" fill={M.bolt} stroke={stroke} strokeWidth="1" />
          ))}
        </>
      )}

      {/* ---------- hover tooltip ---------- */}
      {mode === "exploded" && live && hovered && !selected && ANCHORS[hovered] && (
        <foreignObject x={ANCHORS[hovered].x - 120} y={ANCHORS[hovered].y - 148} width={240} height={140} className="pointer-events-none" style={{ overflow: "visible" }}>
          <div {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)} className="flex h-full items-end justify-center">
            <div className="glass-strong px-3.5 py-2 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink3">{ANCHORS[hovered].name}</div>
              <div className="mt-0.5 font-mono text-[13px] font-semibold tabular" style={{ color: M.teal }}>
                {byNode.get(PART_NODE[hovered])?.live ?? "—"}
              </div>
            </div>
          </div>
        </foreignObject>
      )}

      {/* ---------- leader labels ---------- */}
      {mode === "exploded" && showLabels && (
        <g className="xlabel">
          {LABELS.map((l) => {
            const on = !highlight || highlight.includes(l.part);
            return (
              <g key={l.n} opacity={on ? 1 : 0.28} style={{ transition: "opacity 0.3s ease-out" }}>
                <line x1={l.side === "L" ? 60 : 750} y1={l.y} x2={l.tx} y2={l.ty} stroke={on ? M.teal : "#cbd5e1"} strokeWidth="1" opacity={on ? 0.6 : 0.4} />
                <circle cx={l.tx} cy={l.ty} r="2.5" fill={on ? M.teal : "#94a3b8"} />
                <text x={l.side === "L" ? -150 : 810} y={l.y + 4} textAnchor={l.side === "L" ? "start" : "end"} fontFamily="IBM Plex Mono, monospace" fontSize="12" letterSpacing="1.5" fill={on ? "#334155" : "#94a3b8"}>
                  <tspan fill={on ? M.teal : "#94a3b8"} fontWeight="700">{l.n}</tspan>
                  <tspan dx="6">{l.name}</tspan>
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

/* ------- docked component panel ------- */

export function DeviceStageOverlay({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const selRow = useMemo(() => (selected ? byNode.get(PART_NODE[selected]) : null), [selected]);

  if (!selRow || !selected) return null;
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 md:right-auto md:w-80">
      <div className="grad-border-strong p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#0d9488" }}>
              Component {selRow.n < 10 ? `0${selRow.n}` : selRow.n}
            </div>
            <div className="mt-1 font-display text-lg font-bold leading-tight text-ink">{selRow.name}</div>
          </div>
          <button
            onClick={() => onSelect(null)}
            aria-label="Close component panel"
            className="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-ink3 transition-colors hover:border-ink3 hover:text-ink"
          >
            ESC
          </button>
        </div>
        <div className="mt-3 space-y-1 border-t border-line pt-3">
          <Row k="Current" v={selRow.live ?? "—"} strong />
          <div className="flex items-baseline justify-between py-1">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink3">Status</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-ok">
              <span className="led h-1.5 w-1.5 rounded-full bg-ok" /> NORMAL
            </span>
          </div>
          <Row k="Data key" v={selRow.dataKey} />
          <Row k="Node ID" v={selRow.nodeId} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-1">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink3">{k}</span>
      <span className={cn("truncate font-mono tabular", strong ? "text-[15px] font-bold text-ink" : "text-[11px] text-ink2")}>{v}</span>
    </div>
  );
}
