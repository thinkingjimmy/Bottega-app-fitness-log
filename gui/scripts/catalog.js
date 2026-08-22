/**
 * [INPUT]: 接收生成器产出的 72 项只读动作目录、关键词/body part/muscle/equipment 组合筛选，以及可选的本地化词条投影
 * [OUTPUT]: 通过 globalThis.FitnessCatalog 提供 normalize、filterExercises 与 groupByBodyPart 纯函数
 * [POS]: gui/scripts 的动作检索模型；不接触 DOM、Base、网络或媒体
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

(function exposeCatalog(global) {
  "use strict";
  const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
  /* localize 由 main.js 注入，返回该动作的本地化词条数组。目录只知道"还有一组
     可搜的词"，不知道词表长什么样——界面全中文之后，用户搜"杠铃"、"胸大肌"
     必须命中，而上游英文原名仍然可搜。 */
  function filterExercises(exercises, filters, localize) {
    const query = normalize(filters.query);
    return exercises.filter((exercise) => {
      const haystack = normalize([
        exercise.name, ...(exercise.aliases || []), exercise.target,
        exercise.muscle_group, ...(exercise.secondary_muscles || []), exercise.equipment,
        ...(localize ? localize(exercise) : []),
      ].join(" "));
      return (!query || haystack.includes(query)) &&
        (!filters.bodyPart || exercise.body_part === filters.bodyPart) &&
        (!filters.muscle || exercise.canonical_zones.includes(filters.muscle)) &&
        (!filters.equipment || exercise.equipment === filters.equipment);
    });
  }
  /* order 把分组键投影成排序用的显示文案；不传就按上游原文排。中文界面照英文
     字母序排出来的分组是乱的，但分组键本身必须仍是上游原文，口径不能漂。 */
  function groupByBodyPart(exercises, order) {
    const groups = new Map();
    exercises.forEach((exercise) => {
      const items = groups.get(exercise.body_part) || [];
      items.push(exercise);
      groups.set(exercise.body_part, items);
    });
    const key = order || ((value) => value);
    return [...groups.entries()].sort(([left], [right]) => key(left).localeCompare(key(right)));
  }
  global.FitnessCatalog = { filterExercises, groupByBodyPart, normalize };
})(globalThis);
