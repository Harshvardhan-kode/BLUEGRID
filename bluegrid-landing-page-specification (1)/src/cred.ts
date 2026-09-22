/* ------------------------------------------------------------------
   Unit economics + compliance reference data.
   Kept separate from live telemetry (src/data.ts) by design.
------------------------------------------------------------------- */

export const CAPEX = {
  unitHardware: 186000,
  installation: 24000,
  commissioning: 14000,
  borewellAdaptation: 16000,
  total: 240000,
};

export const OPEX_ANNUAL = {
  filters: 8200,
  telemetry: 6000,
  calibration: 3800,
  total: 18000,
};

export interface Consumable {
  part: string;
  node: string;
  cycle: string;
  unitCost: number;
  perYear: number;
  accent: string;
}

export const CONSUMABLES: Consumable[] = [
  { part: "Sediment cartridge", node: "bluegrid-filter-sediment", cycle: "Every 6 months", unitCost: 1400, perYear: 2800, accent: "#00F2FE" },
  { part: "Activated carbon bed", node: "bluegrid-filter-carbon", cycle: "Every 12 months", unitCost: 2600, perYear: 2600, accent: "#4FACFE" },
  { part: "UF membrane module", node: "bluegrid-filter-uf", cycle: "Every 24 months", unitCost: 7800, perYear: 3900, accent: "#7c5cff" },
  { part: "UV lamp", node: "bluegrid-uv-sterilizer", cycle: "Every 12 months", unitCost: 3200, perYear: 3200, accent: "#ffb020" },
  { part: "Sensor probe set", node: "ph / tds / flow", cycle: "Every 24 months", unitCost: 5200, perYear: 2600, accent: "#10B981" },
];

/* ---------------- compliance ------------------------------------------ */

export interface Standard {
  ref: string;
  body: string;
  what: string;
  status: "compliant" | "referenced";
  accent: string;
}

export const STANDARDS: Standard[] = [
  {
    ref: "CGWA Master Direction",
    body: "Central Ground Water Authority",
    what: "Artificial recharge obligation for bulk ground-water users. Recharge structures registered per notification.",
    status: "compliant",
    accent: "#00F2FE",
  },
  {
    ref: "IS 15792:2007",
    body: "Bureau of Indian Standards",
    what: "Rooftop rainwater harvesting guidelines — catchment, first-flush diversion and conveyance sizing.",
    status: "compliant",
    accent: "#4FACFE",
  },
  {
    ref: "IS 3025 (Parts 1–60)",
    body: "Bureau of Indian Standards",
    what: "Methods of sampling and test. pH, TDS and EC probes are calibrated against this reference.",
    status: "compliant",
    accent: "#10B981",
  },
  {
    ref: "DPDP Act, 2023",
    body: "Government of India",
    what: "Operator and site data handled as personal data; consent and minimisation applied throughout.",
    status: "compliant",
    accent: "#7c5cff",
  },
];

export const CONTACT = {
  email: "pilots@beyondtheflow.in",
  phone: "+91 98220 41700",
  phoneHref: "tel:+919822041700",
  address: "Baner, Pune 411045 · India",
  responseSla: "Responds to pilot enquiries within 2 working days",
};
