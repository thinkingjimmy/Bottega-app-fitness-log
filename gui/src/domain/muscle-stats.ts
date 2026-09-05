/**
 * [INPUT]: Typed Fitness domain data and explicit dependencies
 * [OUTPUT]: Completed-only weighted muscle coverage and exclusion diagnostics
 * [POS]: domain module of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { BaseRow, Exercise } from "./types";
import { parseDate } from "./schema";
export { REQUIRED_COLUMNS, validateColumns } from "./schema";
export type Contribution = {
  rowId: string;
  exerciseId: string;
  sets: number;
  points: number;
};
export function analyzeRows(
  rows: readonly BaseRow[],
  exercises: readonly Exercise[],
  range: string,
  nowValue: Date | string | number,
) {
  const byId = new Map(exercises.map((item) => [item.id, item]));
  const date = new Date(nowValue);
  const now = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const minimum = new Date(now);
  minimum.setDate(minimum.getDate() - (Number(range) - 1));
  const scores: Record<string, number> = {};
  const contributions: Record<string, Contribution[]> = {};
  const diagnostics: Record<string, number> = {};
  let includedRows = 0,
    completedSets = 0;
  for (const row of rows) {
    const values = row.values;
    const exercise = byId.get(String(values.exercise_id ?? ""));
    const reason = exclusionReason(
      values,
      Boolean(exercise),
      range === "all" ? null : minimum,
      now,
    );
    if (reason) {
      diagnostics[reason] = (diagnostics[reason] ?? 0) + 1;
      continue;
    }
    const sets = Number(values.sets);
    includedRows += 1;
    completedSets += sets;
    for (const [zone, weight] of Object.entries(exercise!.zone_weights)) {
      const points = sets * weight;
      scores[zone] = (scores[zone] ?? 0) + points;
      (contributions[zone] ??= []).push({
        rowId: row.id,
        exerciseId: exercise!.id,
        sets,
        points,
      });
    }
  }
  for (const items of Object.values(contributions))
    items.sort((a, b) => b.points - a.points || a.rowId.localeCompare(b.rowId));
  return {
    scores,
    contributions,
    diagnostics,
    excludedRows: Object.values(diagnostics).reduce(
      (sum, count) => sum + count,
      0,
    ),
    includedRows,
    completedSets,
  };
}
function exclusionReason(
  values: BaseRow["values"],
  known: boolean,
  minimum: Date | null,
  now: Date,
): string {
  if (values.status !== "completed")
    return values.status === "planned" ? "planned" : "status-unknown";
  if (!known) return "exercise-unknown";
  if (
    typeof values.sets !== "number" ||
    !Number.isInteger(values.sets) ||
    values.sets <= 0
  )
    return "sets-invalid";
  const date = parseDate(values.date);
  if (!date) return "date-invalid";
  return date > now || (minimum && date < minimum) ? "outside-range" : "";
}
export const intensity = (score: number) =>
  score > 0 ? 1 - Math.exp(-score / 12) : 0;
export type Analysis = ReturnType<typeof analyzeRows>;
