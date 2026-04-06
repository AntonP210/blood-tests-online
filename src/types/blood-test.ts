export interface BloodMarker {
  name: string;
  value: number;
  unit: string;
}

export interface BloodTestInput {
  inputType: "file" | "manual";
  fileData?: string;
  mimeType?: string;
  markers?: BloodMarker[];
  age: number;
  gender: "male" | "female" | "other";
}

export interface AnalyzedMarker {
  name: string;
  value: number;
  unit: string;
  normalRange: string;
  status: "normal" | "high" | "low" | "critical";
  explanation: string;
}

export interface AnalysisResult {
  summary: string;
  markers: AnalyzedMarker[];
  recommendations: string[];
  disclaimer: string;
}
