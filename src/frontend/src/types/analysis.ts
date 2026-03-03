export interface FunctionalDependency {
  determinant: string[]; // left-hand side columns
  dependent: string[]; // right-hand side columns
  type: "direct" | "partial" | "transitive" | "full" | "mvd" | "joinDep";
  confidence: number; // 0-1
}

export type NormalForm = "1NF" | "2NF" | "3NF" | "BCNF" | "4NF" | "5NF";

export interface NormalFormViolation {
  normalForm: NormalForm;
  description: string;
  affectedColumns: string[];
  fd?: FunctionalDependency;
}

export type AnomalyType = "Insert" | "Update" | "Delete";

export interface Anomaly {
  type: AnomalyType;
  description: string;
  fd: FunctionalDependency;
  goodSamples: Record<string, string>[];
  badSamples: Record<string, string>[];
  reason: string;
  normalFormCause?: NormalForm;
  cause?: string;
  affectedRows?: number[];
  fix?: string;
}

export type EntityType = "Partial" | "Transitive";

export interface HiddenEntity {
  name: string;
  type: EntityType;
  columns: string[];
  determinant: string[];
  suggestedTableName: string;
}

export interface AnalysisResult {
  tableName: string;
  functionalDependencies: FunctionalDependency[];
  candidateKeys: string[][];
  violations: NormalFormViolation[];
  anomalies: Anomaly[];
  hiddenEntities: HiddenEntity[];
  healthScore: number;
  grade: string;
  highestNormalForm: NormalForm | "BCNF" | "4NF" | "5NF" | "None";
  generatedSQL: string[];
  violationsSummary: string;
}
