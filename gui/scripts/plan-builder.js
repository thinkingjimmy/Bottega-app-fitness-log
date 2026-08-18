/**
 * [INPUT]: 接收 live Base meta/rows、离线动作目录、local Date、crypto.randomUUID 与用户 plan 草稿
 * [OUTPUT]: 通过 globalThis.FitnessPlanBuilder 提供本地日期、六列 schema、命名权威、planned 去重与 stable frozen batch 纯函数
 * [POS]: gui/scripts 的训练计划领域内核；不碰 DOM/fetch/storage，平台不知道 fitness 六列语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

(function exposePlanBuilder(global) {
  "use strict";

  const REQUIRED = {
    date: "date",
    exercise: "text",
    exercise_id: "text",
    status: "select",
    sets: "number",
    weight: "number",
  };

  class PlanValidationError extends Error {
    constructor(code, field, message) {
      super(message || code);
      this.name = "PlanValidationError";
      this.code = code;
      this.field = field || "";
    }
  }

  function localDate(date) {
    const value = date || new Date();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function validatePlanSchema(meta) {
    const columns = Array.isArray(meta && meta.columns) ? meta.columns : [];
    const seen = new Set();
    const issues = [];
    columns.forEach((column) => {
      if (seen.has(column.id)) issues.push({ id: column.id, reason: "duplicate-column-id" });
      seen.add(column.id);
    });
    Object.entries(REQUIRED).forEach(([id, type]) => {
      const column = columns.find((candidate) => candidate.id === id);
      if (!column) issues.push({ id, reason: "missing" });
      else if (column.type !== type) issues.push({ id, reason: `expected-${type}` });
    });
    const status = columns.find((column) => column.id === "status" && column.type === "select");
    if (status && !(status.options || []).some((option) => option.id === "planned")) {
      issues.push({ id: "status", reason: "missing-planned-option" });
    }
    return issues;
  }

  function preferredStorageName(exercise) {
    return String((exercise.aliases || [])[0] || exercise.name || "").trim();
  }

  function authoritativeNames(rows) {
    const names = new Map();
    (rows || []).forEach((row) => {
      const values = row.values || {};
      if (!values.exercise_id || !["planned", "completed"].includes(values.status)) return;
      const name = String(values.exercise || "").trim();
      if (!name) return;
      const current = names.get(values.exercise_id) || new Set();
      current.add(name);
      names.set(values.exercise_id, current);
    });
    return names;
  }

  function assertNoPlannedDuplicate(rows, date, exerciseIds) {
    const wanted = new Set(exerciseIds);
    const duplicate = (rows || []).find((row) => {
      const values = row.values || {};
      return values.date === date && values.status === "planned" && wanted.has(values.exercise_id);
    });
    if (duplicate) {
      throw new PlanValidationError(
        "planned-duplicate",
        "exercise_id",
        "该日期已存在相同动作的计划"
      );
    }
  }

  function freezePlan(input) {
    const schemaIssues = validatePlanSchema(input.meta);
    if (schemaIssues.length) {
      throw new PlanValidationError("invalid-plan-schema", schemaIssues[0].id, schemaIssues[0].reason);
    }
    if (!isCalendarDate(input.date)) {
      throw new PlanValidationError("invalid-date", "date");
    }
    if (!input.meta || typeof input.meta.baseInstanceId !== "string" || !input.meta.baseInstanceId) {
      throw new PlanValidationError("invalid-base-instance", "date");
    }
    if (!Array.isArray(input.items) || input.items.length < 1) {
      throw new PlanValidationError("exercise-required", "exercise_id");
    }
    const catalog = new Map((input.exercises || []).map((item) => [item.id, item]));
    const ids = new Set();
    input.items.forEach((item, index) => {
      if (!catalog.has(item.exerciseId)) throw new PlanValidationError("unknown-exercise", `items.${index}.exerciseId`);
      if (ids.has(item.exerciseId)) throw new PlanValidationError("duplicate-exercise", `items.${index}.exerciseId`);
      ids.add(item.exerciseId);
      if (!Number.isInteger(item.sets) || item.sets <= 0) throw new PlanValidationError("invalid-sets", `items.${index}.sets`);
      if (!Number.isFinite(item.weight) || item.weight < 0) throw new PlanValidationError("invalid-weight", `items.${index}.weight`);
    });
    assertNoPlannedDuplicate(input.rows, input.date, [...ids]);
    const names = authoritativeNames(input.rows);
    const submissionId = String(input.randomUUID()).replaceAll("-", "");
    if (!/^[a-f0-9]{32}$/i.test(submissionId)) {
      throw new PlanValidationError("invalid-submission-id", "submissionId");
    }
    const rows = input.items.map((item, index) => {
      const exercise = catalog.get(item.exerciseId);
      const known = names.get(item.exerciseId) || new Set();
      if (known.size > 1) {
        throw new PlanValidationError("ambiguous-exercise-name", `items.${index}.exerciseId`);
      }
      const exerciseName = known.size === 1 ? [...known][0] : preferredStorageName(exercise);
      return {
        id: `w-${input.date.replaceAll("-", "")}-${submissionId}-${index + 1}`,
        values: {
          date: input.date,
          exercise: exerciseName,
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
        sets: rows.reduce((sum, row) => sum + row.values.sets, 0),
      },
    };
  }

  function isCalendarDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  global.FitnessPlanBuilder = {
    PlanValidationError,
    assertNoPlannedDuplicate,
    authoritativeNames,
    freezePlan,
    localDate,
    preferredStorageName,
    validatePlanSchema,
  };
})(globalThis);
