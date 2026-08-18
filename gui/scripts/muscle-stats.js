/**
 * [INPUT]: 接收 Base rows、六列 meta、固定动作目录、时间范围与当前时间
 * [OUTPUT]: 通过 globalThis.FitnessMuscleStats 提供 schema 诊断、本地日历范围与正整数 sets 的 completed row 过滤、按最高字段权重计分、固定色阶和下钻贡献纯函数
 * [POS]: gui/scripts 的训练统计真相源；不接触 DOM/fetch，sample/planned/unknown/非法值永不混入得分
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

(function exposeStats(global) {
  "use strict";
  const REQUIRED_COLUMNS = { date: "date", exercise: "text", exercise_id: "text", status: "select", sets: "number", weight: "number" };

  function validateColumns(columns) {
    const byId = new Map(columns.map((column) => [column.id, column]));
    return Object.entries(REQUIRED_COLUMNS).flatMap(([id, type]) => {
      const column = byId.get(id);
      if (!column) return [{ id, reason: "missing", expected: type }];
      return column.type === type ? [] : [{ id, reason: "wrong-type", expected: type, actual: column.type }];
    });
  }

  function analyzeRows(rows, exercises, range, nowValue) {
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    const now = startOfDay(new Date(nowValue));
    const minimum = range === "all" ? null : subtractDays(now, Number(range) - 1);
    const scores = {};
    const contributions = {};
    const diagnostics = {};
    let includedRows = 0;
    let completedSets = 0;
    rows.forEach((row) => {
      const values = row.values || {};
      const reason = exclusionReason(row, values, byId, minimum, now);
      if (reason) {
        diagnostics[reason] = (diagnostics[reason] || 0) + 1;
        return;
      }
      const exercise = byId.get(values.exercise_id);
      const sets = Number(values.sets);
      includedRows += 1;
      completedSets += sets;
      Object.entries(exercise.zone_weights).forEach(([zone, weight]) => {
        const points = sets * Number(weight);
        scores[zone] = (scores[zone] || 0) + points;
        const list = contributions[zone] || [];
        list.push({ rowId: row.id, exerciseId: exercise.id, exercise: exercise.aliases[0] || exercise.name, sets, points });
        contributions[zone] = list;
      });
    });
    Object.values(contributions).forEach((items) => items.sort((left, right) => right.points - left.points || left.rowId.localeCompare(right.rowId)));
    return { scores, contributions, diagnostics, excludedRows: Object.values(diagnostics).reduce((sum, count) => sum + count, 0), includedRows, completedSets };
  }

  function exclusionReason(row, values, byId, minimum, now) {
    if (String(row.id).startsWith("sample-")) return "sample";
    if (values.status !== "completed") return values.status === "planned" ? "planned" : "status-unknown";
    if (!values.exercise_id || !byId.has(values.exercise_id)) return "exercise-unknown";
    if (!Number.isInteger(values.sets) || values.sets <= 0) return "sets-invalid";
    const date = parseDate(values.date);
    if (!date) return "date-invalid";
    if (date > now || (minimum && date < minimum)) return "outside-range";
    return "";
  }

  function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
      ? date
      : null;
  }
  function startOfDay(value) { return new Date(value.getFullYear(), value.getMonth(), value.getDate()); }
  function subtractDays(value, count) {
    const date = new Date(value.getTime());
    date.setDate(date.getDate() - count);
    return date;
  }
  function intensity(score) { return score > 0 ? 1 - Math.exp(-score / 12) : 0; }

  global.FitnessMuscleStats = { REQUIRED_COLUMNS, analyzeRows, intensity, validateColumns };
})(globalThis);
