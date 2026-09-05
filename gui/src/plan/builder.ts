/**
 * [INPUT]: Typed Fitness domain data and explicit dependencies
 * [OUTPUT]: Schema validation, authoritative names, duplicate prevention, and frozen plan batches
 * [POS]: plan module of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { BaseRow, BaseSnapshot, Exercise } from "../domain/types";
import { parseDate, validateColumns, type SchemaIssue } from "../domain/schema";
export { localDate } from "../domain/schema";
export type PlanItem = { exerciseId: string; sets: number; weight: number };
export type FrozenPlan = {
  submissionId: string;
  expectedBaseInstanceId: string;
  date: string;
  rows: BaseRow[];
  summary: { exercises: number; sets: number };
};
export class PlanValidationError extends Error {
  constructor(
    public code: string,
    public field = "",
    message = code,
  ) {
    super(message);
    this.name = "PlanValidationError";
  }
}
export function validatePlanSchema(meta: BaseSnapshot["meta"]): SchemaIssue[] {
  const issues = validateColumns(meta.columns);
  const seen = new Set<string>();
  for (const column of meta.columns) {
    if (seen.has(column.id))
      issues.push({ id: column.id, reason: "duplicate-column-id" });
    seen.add(column.id);
  }
  const status = meta.columns.find(
    (column) => column.id === "status" && column.type === "select",
  );
  if (status && !status.options?.some((option) => option.id === "planned"))
    issues.push({ id: "status", reason: "missing-planned-option" });
  return issues;
}
export const preferredStorageName = (exercise: Exercise) =>
  (exercise.aliases[0] || exercise.name).trim();
export function authoritativeNames(
  rows: readonly BaseRow[],
): Map<string, Set<string>> {
  const names = new Map<string, Set<string>>();
  for (const { values } of rows) {
    if (
      !values.exercise_id ||
      !["planned", "completed"].includes(String(values.status))
    )
      continue;
    const name = String(values.exercise ?? "").trim();
    if (!name) continue;
    const id = String(values.exercise_id),
      known = names.get(id) ?? new Set<string>();
    known.add(name);
    names.set(id, known);
  }
  return names;
}
export function assertNoPlannedDuplicate(
  rows: readonly BaseRow[],
  date: string,
  exerciseIds: readonly string[],
): void {
  const wanted = new Set(exerciseIds);
  if (
    rows.some(
      ({ values }) =>
        values.date === date &&
        values.status === "planned" &&
        wanted.has(String(values.exercise_id)),
    )
  ) {
    throw new PlanValidationError("planned-duplicate", "exercise_id");
  }
}
function validateItems(
  items: readonly PlanItem[],
  catalog: Map<string, Exercise>,
): void {
  if (!items.length)
    throw new PlanValidationError("exercise-required", "exercise_id");
  const ids = new Set<string>();
  items.forEach((item, index) => {
    const fail = (code: string, field: string) => {
      throw new PlanValidationError(code, `items.${index}.${field}`);
    };
    if (!catalog.has(item.exerciseId)) fail("unknown-exercise", "exerciseId");
    if (ids.has(item.exerciseId)) fail("duplicate-exercise", "exerciseId");
    ids.add(item.exerciseId);
    if (!Number.isInteger(item.sets) || item.sets <= 0)
      fail("invalid-sets", "sets");
    if (!Number.isFinite(item.weight) || item.weight < 0)
      fail("invalid-weight", "weight");
  });
}
export function freezePlan(input: {
  meta: BaseSnapshot["meta"];
  rows: readonly BaseRow[];
  exercises: readonly Exercise[];
  date: string;
  items: readonly PlanItem[];
  randomUUID(): string;
}): FrozenPlan {
  const issues = validatePlanSchema(input.meta);
  if (issues.length)
    throw new PlanValidationError(
      "invalid-plan-schema",
      issues[0]!.id,
      issues[0]!.reason,
    );
  if (!parseDate(input.date))
    throw new PlanValidationError("invalid-date", "date");
  if (!input.meta.baseInstanceId)
    throw new PlanValidationError("invalid-base-instance", "date");
  const catalog = new Map(input.exercises.map((item) => [item.id, item]));
  validateItems(input.items, catalog);
  assertNoPlannedDuplicate(
    input.rows,
    input.date,
    input.items.map((item) => item.exerciseId),
  );
  const names = authoritativeNames(input.rows);
  const submissionId = input.randomUUID().replaceAll("-", "");
  if (!/^[a-f0-9]{32}$/i.test(submissionId))
    throw new PlanValidationError("invalid-submission-id", "submissionId");
  const rows = input.items.map((item, index) => {
    const known = names.get(item.exerciseId) ?? new Set<string>();
    if (known.size > 1)
      throw new PlanValidationError(
        "ambiguous-exercise-name",
        `items.${index}.exerciseId`,
      );
    const exercise =
      [...known][0] ?? preferredStorageName(catalog.get(item.exerciseId)!);
    return {
      id: `w-${input.date.replaceAll("-", "")}-${submissionId}-${index + 1}`,
      values: {
        date: input.date,
        exercise,
        exercise_id: item.exerciseId,
        status: "planned",
        sets: item.sets,
        weight: item.weight,
      },
    };
  });
  return {
    submissionId,
    expectedBaseInstanceId: input.meta.baseInstanceId,
    date: input.date,
    rows,
    summary: {
      exercises: rows.length,
      sets: input.items.reduce((sum, item) => sum + item.sets, 0),
    },
  };
}
