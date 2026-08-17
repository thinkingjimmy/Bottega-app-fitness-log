/**
 * [INPUT]: 接收生成器产出的 72 项只读动作目录与关键词/body part/muscle/equipment 组合筛选
 * [OUTPUT]: 通过 globalThis.FitnessCatalog 提供 normalize、filterExercises 与 groupByBodyPart 纯函数
 * [POS]: gui/scripts 的动作检索模型；不接触 DOM、Base、网络或媒体
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

(function exposeCatalog(global) {
  "use strict";
  const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
  function filterExercises(exercises, filters) {
    const query = normalize(filters.query);
    return exercises.filter((exercise) => {
      const haystack = normalize([
        exercise.name, ...(exercise.aliases || []), exercise.target,
        exercise.muscle_group, ...(exercise.secondary_muscles || []), exercise.equipment,
      ].join(" "));
      return (!query || haystack.includes(query)) &&
        (!filters.bodyPart || exercise.body_part === filters.bodyPart) &&
        (!filters.muscle || exercise.canonical_zones.includes(filters.muscle)) &&
        (!filters.equipment || exercise.equipment === filters.equipment);
    });
  }
  function groupByBodyPart(exercises) {
    const groups = new Map();
    exercises.forEach((exercise) => {
      const items = groups.get(exercise.body_part) || [];
      items.push(exercise);
      groups.set(exercise.body_part, items);
    });
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }
  global.FitnessCatalog = { filterExercises, groupByBodyPart, normalize };
})(globalThis);
