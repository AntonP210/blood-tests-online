export interface MarkerDefinition {
  name: string;
  unit: string;
  category: string;
}

export const BLOOD_MARKERS: MarkerDefinition[] = [
  // Complete Blood Count (CBC)
  { name: "White Blood Cells (WBC)", unit: "x10^3/uL", category: "CBC" },
  { name: "Red Blood Cells (RBC)", unit: "x10^6/uL", category: "CBC" },
  { name: "Hemoglobin (Hgb)", unit: "g/dL", category: "CBC" },
  { name: "Hematocrit (Hct)", unit: "%", category: "CBC" },
  { name: "Platelets", unit: "x10^3/uL", category: "CBC" },
  { name: "Mean Corpuscular Volume (MCV)", unit: "fL", category: "CBC" },
  { name: "Mean Corpuscular Hemoglobin (MCH)", unit: "pg", category: "CBC" },
  { name: "MCHC", unit: "g/dL", category: "CBC" },
  { name: "RDW", unit: "%", category: "CBC" },
  { name: "Neutrophils", unit: "%", category: "CBC" },
  { name: "Lymphocytes", unit: "%", category: "CBC" },
  { name: "Monocytes", unit: "%", category: "CBC" },
  { name: "Eosinophils", unit: "%", category: "CBC" },
  { name: "Basophils", unit: "%", category: "CBC" },

  // Basic Metabolic Panel (BMP)
  { name: "Glucose", unit: "mg/dL", category: "Metabolic" },
  { name: "BUN (Blood Urea Nitrogen)", unit: "mg/dL", category: "Metabolic" },
  { name: "Creatinine", unit: "mg/dL", category: "Metabolic" },
  { name: "Sodium", unit: "mEq/L", category: "Metabolic" },
  { name: "Potassium", unit: "mEq/L", category: "Metabolic" },
  { name: "Chloride", unit: "mEq/L", category: "Metabolic" },
  { name: "CO2 (Carbon Dioxide)", unit: "mEq/L", category: "Metabolic" },
  { name: "Calcium", unit: "mg/dL", category: "Metabolic" },

  // Comprehensive Metabolic Panel additions
  { name: "Total Protein", unit: "g/dL", category: "Metabolic" },
  { name: "Albumin", unit: "g/dL", category: "Metabolic" },
  { name: "Bilirubin (Total)", unit: "mg/dL", category: "Metabolic" },
  { name: "Alkaline Phosphatase (ALP)", unit: "U/L", category: "Metabolic" },
  { name: "AST (SGOT)", unit: "U/L", category: "Metabolic" },
  { name: "ALT (SGPT)", unit: "U/L", category: "Metabolic" },
  { name: "GGT", unit: "U/L", category: "Metabolic" },

  // Lipid Panel
  { name: "Total Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "HDL Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "LDL Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "Triglycerides", unit: "mg/dL", category: "Lipids" },
  { name: "VLDL Cholesterol", unit: "mg/dL", category: "Lipids" },

  // Thyroid
  { name: "TSH", unit: "mIU/L", category: "Thyroid" },
  { name: "Free T4", unit: "ng/dL", category: "Thyroid" },
  { name: "Free T3", unit: "pg/mL", category: "Thyroid" },

  // Iron Studies
  { name: "Iron", unit: "ug/dL", category: "Iron" },
  { name: "Ferritin", unit: "ng/mL", category: "Iron" },
  { name: "TIBC", unit: "ug/dL", category: "Iron" },
  { name: "Transferrin Saturation", unit: "%", category: "Iron" },

  // Vitamins
  { name: "Vitamin D (25-OH)", unit: "ng/mL", category: "Vitamins" },
  { name: "Vitamin B12", unit: "pg/mL", category: "Vitamins" },
  { name: "Folate", unit: "ng/mL", category: "Vitamins" },

  // Diabetes
  { name: "HbA1c", unit: "%", category: "Diabetes" },
  { name: "Insulin (Fasting)", unit: "uIU/mL", category: "Diabetes" },

  // Inflammation
  { name: "CRP (C-Reactive Protein)", unit: "mg/L", category: "Inflammation" },
  { name: "ESR (Sed Rate)", unit: "mm/hr", category: "Inflammation" },

  // Kidney
  { name: "eGFR", unit: "mL/min/1.73m2", category: "Kidney" },
  { name: "Uric Acid", unit: "mg/dL", category: "Kidney" },

  // Hormones
  { name: "Testosterone (Total)", unit: "ng/dL", category: "Hormones" },
  { name: "Estradiol", unit: "pg/mL", category: "Hormones" },
  { name: "Cortisol", unit: "ug/dL", category: "Hormones" },
  { name: "PSA", unit: "ng/mL", category: "Hormones" },
];

export const MARKER_CATEGORIES = [
  "CBC",
  "Metabolic",
  "Lipids",
  "Thyroid",
  "Iron",
  "Vitamins",
  "Diabetes",
  "Inflammation",
  "Kidney",
  "Hormones",
] as const;
