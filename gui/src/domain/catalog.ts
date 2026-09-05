/**
 * [INPUT]: Typed Fitness domain data and explicit dependencies
 * [OUTPUT]: Catalog filtering and stable localized grouping
 * [POS]: domain module of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { Exercise, Filters } from "./types";
const normalize = (value: string) =>
  value.toLocaleLowerCase().normalize("NFKC").trim();
export function filterExercises(
  exercises: readonly Exercise[],
  filters: Filters,
  localize?: (item: Exercise) => string[],
): Exercise[] {
  const query = normalize(filters.query);
  return exercises.filter((item) => {
    const haystack = normalize(
      [
        item.name,
        ...item.aliases,
        item.target,
        item.muscle_group,
        ...item.secondary_muscles,
        item.equipment,
        ...(localize?.(item) ?? []),
      ].join(" "),
    );
    return (
      (!query || haystack.includes(query)) &&
      (!filters.bodyPart || item.body_part === filters.bodyPart) &&
      (!filters.muscle || item.canonical_zones.includes(filters.muscle)) &&
      (!filters.equipment || item.equipment === filters.equipment)
    );
  });
}
export function groupByBodyPart(
  exercises: readonly Exercise[],
  order = (key: string) => key,
): [string, Exercise[]][] {
  const groups = new Map<string, Exercise[]>();
  for (const item of exercises) {
    const group = groups.get(item.body_part) ?? [];
    group.push(item);
    groups.set(item.body_part, group);
  }
  return [...groups].sort(([left], [right]) =>
    order(left).localeCompare(order(right)),
  );
}
