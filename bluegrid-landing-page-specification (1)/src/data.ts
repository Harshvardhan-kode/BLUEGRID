/* ------------------------------------------------------------------
   BlueGrid shared data layer.
   Every chart, card and status pulls from these abstraction functions.
   Mock phase and real-sensor phase must never diverge in behaviour:
   swap the bodies of these functions for real API calls, nothing else.
------------------------------------------------------------------- */

export type Status = "normal" | "monitor" | "critical" | "stale" | "unavailable";

export type MetricKey =
  | "waterLevel"
  | "flowRate"
  | "ph"
  | "tds"
  | "ec"
  | "rainfall"
  | "filterPressure"
  | "filterCondition";

export const METRICS: Record<
  MetricKey,
  { label: string; unit: string | null; color: string; decimals: number; correlate?: MetricKey }
> = {
  waterLevel: { label: "Water Level", unit: "m", color: "#0d9488", decimals: 2, correlate: "rainfall" },
  flowRate: { label: "Flow Rate", unit: "L/min", color: "#0284c7", decimals: 1, correlate: "filterPressure" },
  ph: { label: "pH", unit: null, color: "#059669", decimals: 2, correlate: "tds" },
  tds: { label: "TDS", unit: "ppm", color: "#7c3aed", decimals: 0, correlate: "ec" },
  ec: { label: "EC", unit: "µS/cm", color: "#9333ea", decimals: 0, correlate: "tds" },
  rainfall: { label: "Rainfall", unit: "mm", color: "#38bdf8", decimals: 1, correlate: "waterLevel" },
  filterPressure: { label: "Filter Pressure", unit: "bar", color: "#d97706", decimals: 2, correlate: "flowRate" },
  filterCondition: { label: "Filter Condition", unit: "%", color: "#059669", decimals: 0 },
};

export const STATUS_WORD: Record<Status, string> = {
  normal: "NORMAL",
  monitor: "MONITOR",
  critical: "OUT OF RANGE",
  stale: "STALE",
  unavailable: "UNAVAILABLE",
};

export const STATUS_COLOR: Record<Status, string> = {
  normal: "text-ok",
  monitor: "text-warn",
  critical: "text-crit",
  stale: "text-stale",
  unavailable: "text-stale",
};

/* ---------------- thresholds — config layer, never in components ---- */

export const THRESHOLDS: Record<
  string,
  { unit: string | null; normalMin?: number; normalMax?: number; watchMax?: number; criticalMax?: number; note?: string }
> = {
  flowRate: { unit: "L/min", normalMin: 7, normalMax: 10 },
  ph: { unit: null, normalMin: 6.5, normalMax: 8.5 },
  tds: { unit: "ppm", normalMax: 500, watchMax: 650 },
  ec: { unit: "µS/cm", normalMax: 1000, watchMax: 1300, note: "Derived from the TDS conductivity probe — not a separate sensor." },
  waterLevel: { unit: "m", normalMin: 4.5, normalMax: 9.5 },
  filterPressure: { unit: "bar", normalMax: 2.2, watchMax: 2.5, criticalMax: 3.0 },
  rainfall: { unit: "mm" },
};

export function statusOf(metric: MetricKey, v: number): Status {
  const t = THRESHOLDS[metric];
  if (!t) return "normal";
  if (t.criticalMax !== undefined && v > t.criticalMax) return "critical";
  if (t.normalMax !== undefined && v > t.normalMax) return "monitor";
  if (t.normalMin !== undefined && v < t.normalMin) return "monitor";
  return "normal";
}

/* ---------------- deterministic pseudo-random series --------------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type Range = "24H" | "7D" | "30D" | "3M";
export const RANGES: Range[] = ["24H", "7D", "30D", "3M"];
export const RANGE_POINTS: Record<Range, { n: number; stepMin: number }> = {
  "24H": { n: 96, stepMin: 15 },
  "7D": { n: 168, stepMin: 60 },
  "30D": { n: 120, stepMin: 360 },
  "3M": { n: 90, stepMin: 1440 },
};

export interface SeriesPoint { t: number; v: number }
export interface SeriesEvent {
  idx: number;
  title: string;
  detected: string;
  observed: string;
  expected: string;
  duration: string;
  correlated: string;
  metric: MetricKey;
}
export interface Series {
  metric: MetricKey;
  unit: string | null;
  points: SeriesPoint[];
  events: SeriesEvent[];
}

const NOW = Date.now();

function anomalyWindow(range: Range): [number, number] | null {
  if (range === "24H") return [52, 64];
  if (range === "7D") return [118, 130];
  return null;
}

export function getHistoricalMetrics(metric: MetricKey, range: Range): Series {
  const { n, stepMin } = RANGE_POINTS[range];
  const rnd = mulberry32(hash(metric + range));
  const end = NOW;
  const start = end - n * stepMin * 60000;
  const aw = anomalyWindow(range);
  const points: SeriesPoint[] = [];

  for (let i = 0; i < n; i++) {
    const t = start + i * stepMin * 60000;
    const phase = (i / n) * Math.PI * 2;
    const noise = () => (rnd() - 0.5) * 2;
    let v = 0;
    switch (metric) {
      case "flowRate": {
        v = 8.4 + Math.sin(phase * 3) * 0.7 + noise() * 0.5;
        if (aw && i >= aw[0] && i <= aw[1]) v = 4.2 + noise() * 0.4;
        break;
      }
      case "filterPressure": {
        v = 1.8 + Math.sin(phase * 3 + 1) * 0.08 + noise() * 0.05;
        if (aw && i >= aw[0] && i <= aw[1]) v = 2.35 + noise() * 0.08;
        break;
      }
      case "ph":
        v = 7.1 + Math.sin(phase * 2) * 0.12 + noise() * 0.06;
        break;
      case "tds":
        v = 182 + Math.sin(phase * 2 + 0.6) * 9 + noise() * 5;
        break;
      case "ec":
        v = (182 + Math.sin(phase * 2 + 0.6) * 9 + noise() * 5) * 2;
        break;
      case "waterLevel": {
        const drift = range === "24H" ? Math.sin(phase) * 0.05 : (i / n) * 0.39 - 0.1;
        v = 6.8 + drift + Math.sin(phase * 5) * 0.02 + noise() * 0.02;
        break;
      }
      case "rainfall": {
        v = 0;
        const eventCenters = range === "24H" ? [30] : range === "7D" ? [40, 130] : range === "30D" ? [25, 70, 100] : [20, 55, 80];
        for (const c of eventCenters) {
          const d = Math.abs(i - c);
          if (d < 4) v += (4 - d) * (0.9 + rnd() * 0.7);
        }
        break;
      }
      case "filterCondition":
        v = 92 - (i / n) * 8 + noise() * 0.6;
        break;
    }
    points.push({ t, v: Math.max(0, v) });
  }

  const events: SeriesEvent[] = [];
  if (metric === "flowRate" && aw) {
    events.push({
      idx: aw[0],
      title: "FLOW RATE DROP",
      detected: fmtTime(points[aw[0]].t),
      observed: "4.2 L/min",
      expected: "7–10 L/min",
      duration: range === "24H" ? "18 minutes" : "≈ 12 samples",
      correlated: "Filter pressure UP during the same window.",
      metric: "filterPressure",
    });
  }
  if (metric === "filterPressure" && aw) {
    events.push({
      idx: aw[0],
      title: "PRESSURE RISE",
      detected: fmtTime(points[aw[0]].t),
      observed: "2.35 bar",
      expected: "≤ 2.2 bar normal band",
      duration: range === "24H" ? "18 minutes" : "≈ 12 samples",
      correlated: "Flow rate DOWN during the same window — potential contributing factor: filter loading.",
      metric: "flowRate",
    });
  }
  return { metric, unit: METRICS[metric].unit, points, events };
}

/* ---------------- current snapshot (GET /api/metrics/current) ------ */

export interface CurrentMetric {
  key: MetricKey;
  value: number | null;
  unit: string | null;
  status: Status;
  trend?: number;
  updatedAt: string;
  period?: string;
}

export function getCurrentMetrics(): CurrentMetric[] {
  return [
    { key: "waterLevel", value: 6.8, unit: "m", status: "normal", trend: 1, updatedAt: fmtTime(NOW - 4 * 60000) },
    { key: "flowRate", value: 8.4, unit: "L/min", status: "normal", trend: -1, updatedAt: fmtTime(NOW - 2 * 60000) },
    { key: "ph", value: 7.1, unit: null, status: "normal", trend: 0, updatedAt: fmtTime(NOW - 2 * 60000) },
    { key: "tds", value: 182, unit: "ppm", status: "normal", trend: 0, updatedAt: fmtTime(NOW - 2 * 60000) },
    { key: "ec", value: 364, unit: "µS/cm", status: "normal", trend: 0, updatedAt: fmtTime(NOW - 2 * 60000) },
    { key: "filterPressure", value: 1.8, unit: "bar", status: "normal", trend: 0, updatedAt: fmtTime(NOW - 2 * 60000) },
  ];
}

/* ---------------- alerts -------------------------------------------- */

export type Severity = "INFO" | "WATCH" | "WARNING" | "CRITICAL";
export const SEVERITY_COLOR: Record<Severity, string> = {
  INFO: "#0284c7",
  WATCH: "#d97706",
  WARNING: "#ea580c",
  CRITICAL: "#dc2626",
};

/** Icon shape per severity — makes the event log scannable at a glance. */
export const SEVERITY_ICON: Record<Severity, "info" | "triangle" | "octagon"> = {
  INFO: "info",
  WATCH: "triangle",
  WARNING: "triangle",
  CRITICAL: "octagon",
};

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  time: string;
  desc: string;
  metric: MetricKey;
  range: Range;
}

export function getAlerts(): Alert[] {
  return [
    { id: "a1", severity: "WARNING", title: "Flow rate drop", time: fmtTime(NOW - 52 * 60000), desc: "4.2 L/min observed against 7–10 L/min band. Pressure rise correlated in same window.", metric: "flowRate", range: "24H" },
    { id: "a2", severity: "WATCH", title: "Filter pressure approaching watch band", time: fmtTime(NOW - 58 * 60000), desc: "2.35 bar — watch threshold 2.5 bar. Potential contributing factor: filter loading.", metric: "filterPressure", range: "24H" },
    { id: "a3", severity: "INFO", title: "Rainfall event recorded", time: fmtTime(NOW - 5 * 3600000), desc: "9.6 mm over 45 min at external gauge. Source-water availability window opened.", metric: "rainfall", range: "24H" },
    { id: "a4", severity: "INFO", title: "Rain gauge heartbeat delayed", time: fmtTime(NOW - 41 * 60000), desc: "Last packet 41 min ago. Reading held as STALE until next packet — never backfilled.", metric: "rainfall", range: "24H" },
    { id: "a5", severity: "INFO", title: "UV sterilizer cycle completed", time: fmtTime(NOW - 90 * 60000), desc: "Stage 4 active for full recharge window. Lamp runtime counter incremented.", metric: "flowRate", range: "24H" },
  ];
}

/* ---------------- component map -------------------------------------- */

export interface ComponentRow {
  n: number;
  name: string;
  nodeId: string;
  dataKey: string;
  live?: string;
}

export const COMPONENTS: ComponentRow[] = [
  { n: 1, name: "Enclosure Cover", nodeId: "bluegrid-enclosure-cover", dataKey: "device.status", live: "Sealed" },
  { n: 2, name: "Solar Panel", nodeId: "bluegrid-solar-panel", dataKey: "power.solarInputW", live: "42 W" },
  { n: 3, name: "Charge Controller", nodeId: "bluegrid-charge-controller", dataKey: "power.chargeStatus", live: "MPPT · CHARGING" },
  { n: 4, name: "Battery Pack", nodeId: "bluegrid-battery", dataKey: "power.batteryPct", live: "87 %" },
  { n: 5, name: "IoT Module", nodeId: "bluegrid-iot-module", dataKey: "comms.status", live: "LTE · RSSI −71" },
  { n: 6, name: "Main Control Unit", nodeId: "bluegrid-control-unit", dataKey: "device.controlStatus", live: "RUN" },
  { n: 7, name: "Display & Interface", nodeId: "bluegrid-display", dataKey: "—", live: "—" },
  { n: 8, name: "Enclosure Body", nodeId: "bluegrid-enclosure-body", dataKey: "structural", live: "—" },
  { n: 9, name: "Sediment Filter", nodeId: "bluegrid-filter-sediment", dataKey: "filtration.stage1", live: "ΔP 0.2 bar · GOOD" },
  { n: 10, name: "Carbon Filter", nodeId: "bluegrid-filter-carbon", dataKey: "filtration.stage2", live: "ΔP 0.4 bar · GOOD" },
  { n: 11, name: "UF Membrane", nodeId: "bluegrid-filter-uf", dataKey: "filtration.stage3", live: "ΔP 0.6 bar · GOOD" },
  { n: 12, name: "Pressure Pump", nodeId: "bluegrid-pressure-pump", dataKey: "filtration.pressureBar", live: "1.8 bar" },
  { n: 13, name: "Flow Sensor", nodeId: "bluegrid-flow-sensor", dataKey: "flow.rateLPM", live: "8.4 L/min" },
  { n: 14, name: "pH Sensor", nodeId: "bluegrid-ph-sensor", dataKey: "quality.ph", live: "7.1" },
  { n: 15, name: "TDS Sensor", nodeId: "bluegrid-tds-sensor", dataKey: "quality.tdsPPM · quality.ecUScm", live: "182 ppm" },
  { n: 16, name: "UV Sterilizer", nodeId: "bluegrid-uv-sterilizer", dataKey: "filtration.uvStatus", live: "ACTIVE" },
  { n: 17, name: "Base Plate", nodeId: "bluegrid-base-plate", dataKey: "structural", live: "—" },
  { n: 18, name: "Side Panel (Ventilation)", nodeId: "bluegrid-side-panel", dataKey: "structural", live: "—" },
];

/* ---------------- 8-step disassembly sequence -----------------------
   Consolidates all 18 components into 8 narrative groups so the
   scrollytelling stays manageable. `progress` drives the exploded view. */

export interface SequenceStep {
  n: string;
  label: string;
  progress: number;
  /** part ids highlighted on the diagram while this step is active */
  parts: string[];
  summary: string;
  /** nodeIds resolved against COMPONENTS for the live readouts */
  nodes: string[];
  accent: string;
}

export const SEQUENCE: SequenceStep[] = [
  {
    n: "01",
    label: "Closed Unit",
    progress: 0,
    parts: ["cover", "body"],
    accent: "#0d9488",
    summary:
      "Sealed IP65 enclosure at rest. The door display shows live flow and pH so an operator can read the unit without opening it or pulling out a laptop.",
    nodes: ["bluegrid-enclosure-cover", "bluegrid-enclosure-body"],
  },
  {
    n: "02",
    label: "Cover Release",
    progress: 0.12,
    parts: ["cover"],
    accent: "#0284c7",
    summary:
      "The enclosure cover lifts away. Behind it sits the cutaway window onto the filtration column — the part of the machine operators actually service.",
    nodes: ["bluegrid-enclosure-cover"],
  },
  {
    n: "03",
    label: "Power & Comms",
    progress: 0.3,
    parts: ["solar", "charge", "battery", "iot"],
    accent: "#059669",
    summary:
      "Solar panel, MPPT charge controller, battery pack and the LTE IoT module. This is the layer that keeps the unit reporting through a monsoon grid outage.",
    nodes: ["bluegrid-solar-panel", "bluegrid-charge-controller", "bluegrid-battery", "bluegrid-iot-module"],
  },
  {
    n: "04",
    label: "Control + Display",
    progress: 0.4,
    parts: ["control", "display"],
    accent: "#7c3aed",
    summary:
      "The main control unit runs the duty cycle and threshold logic; the front display mirrors it physically so the machine is readable with no network at all.",
    nodes: ["bluegrid-control-unit", "bluegrid-display"],
  },
  {
    n: "05",
    label: "Body Panels",
    progress: 0.55,
    parts: ["body", "sidepanel"],
    accent: "#0284c7",
    summary:
      "Structural body and the ventilated side panel fall away, exposing the full treatment column. Neither carries a sensor — they are listed as structural, not as data.",
    nodes: ["bluegrid-enclosure-body", "bluegrid-side-panel"],
  },
  {
    n: "06",
    label: "Filtration Stack",
    progress: 0.76,
    parts: ["sediment", "carbon", "uf", "uv", "pump"],
    accent: "#0d9488",
    summary:
      "The four treatment barriers plus the pressure pump. Each stage reports its own pressure differential, so a rising ΔP localises to one cartridge instead of the whole machine.",
    nodes: [
      "bluegrid-filter-sediment",
      "bluegrid-filter-carbon",
      "bluegrid-filter-uf",
      "bluegrid-uv-sterilizer",
      "bluegrid-pressure-pump",
    ],
  },
  {
    n: "07",
    label: "Sensor Manifold",
    progress: 0.88,
    parts: ["flow", "ph", "tds"],
    accent: "#059669",
    summary:
      "Flow, pH and the TDS/EC conductivity probe sit inline on the outlet manifold. Every litre is measured here before a drop reaches the borewell.",
    nodes: ["bluegrid-flow-sensor", "bluegrid-ph-sensor", "bluegrid-tds-sensor"],
  },
  {
    n: "08",
    label: "Base Plate",
    progress: 1,
    parts: ["base"],
    accent: "#d97706",
    summary:
      "Base plate and mounting feet drop away — full exploded view. Every one of the 18 components is now separated and individually inspectable.",
    nodes: ["bluegrid-base-plate"],
  },
];

/* ---------------- filtration stages --------------------------------- */

export interface Stage {
  id: string;
  name: string;
  tag: string;
  rows: { k: string; v: string; status: Status }[];
  detail: string;
}

export const STAGES: Stage[] = [
  { id: "sediment", name: "Sediment Filter", tag: "STAGE 1", rows: [
    { k: "Pressure differential", v: "0.2 bar", status: "normal" },
    { k: "Flow rate", v: "NORMAL", status: "normal" },
    { k: "Loading", v: "LOW", status: "normal" },
    { k: "Status", v: "GOOD", status: "normal" },
  ], detail: "Suspended solids removed first — protects every stage downstream." },
  { id: "carbon", name: "Carbon Filter", tag: "STAGE 2", rows: [
    { k: "Pressure differential", v: "0.4 bar", status: "normal" },
    { k: "Flow rate", v: "NORMAL", status: "normal" },
    { k: "Loading", v: "LOW", status: "normal" },
    { k: "Status", v: "GOOD", status: "normal" },
  ], detail: "Organics and chlorine fractions adsorbed before the membrane." },
  { id: "uf", name: "UF Membrane", tag: "STAGE 3", rows: [
    { k: "Pressure differential", v: "0.6 bar", status: "normal" },
    { k: "Flow rate", v: "NORMAL", status: "normal" },
    { k: "Loading", v: "MODERATE", status: "monitor" },
    { k: "Status", v: "GOOD", status: "normal" },
  ], detail: "Ultrafiltration membrane — the tightest physical barrier in the stack." },
  { id: "uv", name: "UV Sterilizer", tag: "STAGE 4", rows: [
    { k: "Lamp", v: "ACTIVE", status: "normal" },
    { k: "Runtime", v: "1,204 h", status: "normal" },
    { k: "Status", v: "GOOD", status: "normal" },
  ], detail: "Final biological stage before the water is measured and released." },
];

/* ---------------- borewell / aquifer ---------------------------------- */

export function getBorewellData() {
  const rain = getHistoricalMetrics("rainfall", "30D").points;
  const level = getHistoricalMetrics("waterLevel", "30D").points;
  return { rain, level, currentLevel: 6.8, historicalLow: 8.9, depth: 12 };
}

/* ---------------- FAQ -------------------------------------------------- */

export const FAQS = [
  {
    q: "What happens when a sensor goes offline?",
    a: "The metric switches to STALE or UNAVAILABLE — dashed border, no number, timestamp emphasized. The dashboard never renders a fake “normal” to fill the gap.",
  },
  {
    q: "Is the recharged water safe to drink?",
    a: "BlueGrid makes no health claims. You will never see “safe”, “drinkable” or “potable” anywhere in this product. pH, TDS and EC are reported against recharge-suitability bands only — potability is your water authority's call.",
  },
  {
    q: "Can the unit take RO reject water?",
    a: "Yes. The intake accepts rainwater, RO-reject water, or other suitable wastewater. The sediment → carbon → UF → UV stack is sized for exactly that mix.",
  },
  {
    q: "Are EC and TDS measured by separate probes?",
    a: "No — both are read from one conductivity probe, with TDS derived from EC. Two data keys, one physical instrument, stated openly rather than implying extra hardware.",
  },
  {
    q: "Where do the alert thresholds come from?",
    a: "A separate configuration layer, never hard-coded in the interface. Current values are visible read-only. Changing a threshold is an operations decision, not a code change.",
  },
];

/* ---------------- formatting helpers --------------------------------- */

export function fmtTime(t: number) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
export function fmtClock(t: number) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function fmtDay(t: number) {
  const d = new Date(t);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase();
}
