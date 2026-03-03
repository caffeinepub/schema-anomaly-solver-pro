import type { NormalFormViolation } from "../types/analysis";

const SEVERITY_WEIGHTS: Record<string, number> = {
  "1NF": 25,
  "2NF": 20,
  "3NF": 15,
  BCNF: 10,
  "4NF": 8,
  "5NF": 5,
};

export function calculateHealthScore(violations: NormalFormViolation[]): {
  score: number;
  grade: string;
} {
  if (violations.length === 0) return { score: 100, grade: "A" };

  let deduction = 0;
  for (const v of violations) {
    deduction += SEVERITY_WEIGHTS[v.normalForm] || 10;
  }

  const score = Math.max(0, 100 - deduction);

  let grade: string;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  return { score, grade };
}

export function getHighestNormalForm(
  violations: NormalFormViolation[],
): string {
  const forms = violations.map((v) => v.normalForm);
  if (forms.includes("1NF")) return "None (1NF violated)";
  if (forms.includes("2NF")) return "1NF";
  if (forms.includes("3NF")) return "2NF";
  if (forms.includes("BCNF")) return "3NF";
  if (forms.includes("4NF")) return "BCNF";
  if (forms.includes("5NF")) return "4NF";
  return "5NF";
}
