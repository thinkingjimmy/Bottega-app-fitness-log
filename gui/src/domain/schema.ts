/**
 * [INPUT]: Base column types and local calendar dates
 * [OUTPUT]: The six-column contract and calendar validation
 * [POS]: Single schema/date authority
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { BaseColumn } from "./types";
export const REQUIRED_COLUMNS = {
  date: "date",
  exercise: "text",
  exercise_id: "text",
  status: "select",
  sets: "number",
  weight: "number",
} as const;
export type SchemaIssue = {
  id: string;
  reason: string;
  expected?: string;
  actual?: string;
};
export function validateColumns(columns: readonly BaseColumn[]): SchemaIssue[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  return Object.entries(REQUIRED_COLUMNS).flatMap(([id, type]) => {
    const column = byId.get(id);
    if (!column) return [{ id, reason: "missing", expected: type }];
    return column.type === type
      ? []
      : [{ id, reason: "wrong-type", expected: type, actual: column.type }];
  });
}
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
export function localDate(value = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
