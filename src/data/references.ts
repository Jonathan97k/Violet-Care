export interface ClinicalReferenceSeed {
  id: string;
  title: string;
  category: string;
  content: string;
}

export const clinicalReferences: ClinicalReferenceSeed[] = [
  {
    id: 'ref-vitals-adult',
    title: 'Adult Normal Vital Signs',
    category: 'Vitals',
    content: [
      'Heart rate: 60–100 bpm',
      'Respiratory rate: 12–20 / min',
      'Blood pressure: 90/60 – 120/80 mmHg',
      'Temperature: 36.1–37.2 °C (97–99 °F)',
      'SpO2: 95–100%',
    ].join('\n'),
  },
  {
    id: 'ref-vitals-paeds',
    title: 'Paediatric Normal Ranges',
    category: 'Vitals',
    content: [
      'Newborn HR: 100–160 bpm | RR: 30–60',
      'Infant HR: 90–150 bpm | RR: 25–40',
      'Toddler HR: 80–140 bpm | RR: 20–30',
      'School age HR: 70–120 bpm | RR: 18–25',
      'Adolescent HR: 60–100 bpm | RR: 12–20',
    ].join('\n'),
  },
  {
    id: 'ref-glasgow',
    title: 'Glasgow Coma Scale (GCS)',
    category: 'Assessment',
    content: [
      'Eye opening: Spontaneous 4 / Voice 3 / Pain 2 / None 1',
      'Verbal: Oriented 5 / Confused 4 / Words 3 / Sounds 2 / None 1',
      'Motor: Obeys 6 / Localizes 5 / Withdraws 4 / Flexion 3 / Extension 2 / None 1',
      'Severity: Mild 13–15 | Moderate 9–12 | Severe ≤ 8',
    ].join('\n'),
  },
  {
    id: 'ref-pain-scale',
    title: 'Pain Scale (0–10)',
    category: 'Assessment',
    content: [
      '0 — No pain',
      '1–3 — Mild, doesn\'t interfere with daily activity',
      '4–6 — Moderate, interferes with daily activity',
      '7–9 — Severe, disabling',
      '10 — Worst pain imaginable',
    ].join('\n'),
  },
  {
    id: 'ref-fluid-maint',
    title: 'Maintenance Fluids (4-2-1 Rule)',
    category: 'Calculations',
    content: [
      '4 mL/kg/hr for first 10 kg',
      '2 mL/kg/hr for next 10 kg',
      '1 mL/kg/hr for each kg over 20',
      'Example 70 kg adult: 40 + 20 + 50 = 110 mL/hr',
    ].join('\n'),
  },
  {
    id: 'ref-drip-factor',
    title: 'IV Drip Factors',
    category: 'Calculations',
    content: [
      'Macrodrip: 10, 15, or 20 gtts/mL',
      'Microdrip: 60 gtts/mL (for paeds & precise rates)',
      'Formula: gtts/min = (Volume × drop factor) / (time in minutes)',
    ].join('\n'),
  },
  {
    id: 'ref-bls',
    title: 'BLS — Adult CPR',
    category: 'Emergency',
    content: [
      'Compression depth: at least 5 cm (≤ 6 cm)',
      'Rate: 100–120 / min',
      'Ratio: 30 compressions : 2 breaths',
      'Allow full chest recoil; minimize interruptions (< 10s)',
    ].join('\n'),
  },
  {
    id: 'ref-blood-glucose',
    title: 'Blood Glucose Targets',
    category: 'Lab Values',
    content: [
      'Fasting: 70–99 mg/dL (3.9–5.5 mmol/L)',
      '2 hr post-meal: < 140 mg/dL (< 7.8 mmol/L)',
      'Hypoglycemia: < 70 mg/dL — give 15 g fast carbs',
      'Hyperglycemia: > 180 mg/dL post-meal',
    ].join('\n'),
  },
  {
    id: 'ref-electrolytes',
    title: 'Common Electrolyte Ranges',
    category: 'Lab Values',
    content: [
      'Sodium: 135–145 mmol/L',
      'Potassium: 3.5–5.0 mmol/L',
      'Chloride: 96–106 mmol/L',
      'Calcium (total): 8.5–10.5 mg/dL',
      'Magnesium: 1.7–2.2 mg/dL',
    ].join('\n'),
  },
  {
    id: 'ref-handhygiene',
    title: 'WHO 5 Moments for Hand Hygiene',
    category: 'Infection Control',
    content: [
      '1. Before touching a patient',
      '2. Before clean / aseptic procedure',
      '3. After body fluid exposure risk',
      '4. After touching a patient',
      '5. After touching patient surroundings',
    ].join('\n'),
  },
];
