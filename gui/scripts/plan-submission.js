/**
 * [INPUT]: 接收 FrozenSubmission、Base API client、clock/sessionStorage 与完整一致快照
 * [OUTPUT]: 通过 globalThis.FitnessPlanSubmission 提供 attempt 状态机、bounded 429 retry、revision rebase、identical/absent/partial reconcile 与无 token session 恢复
 * [POS]: gui/scripts 的提交协调内核；row ids+values 是幂等身份，expectedRevision 可 rebase，Base instance 永不 rebase
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

(function exposePlanSubmission(global) {
  "use strict";
  const STORAGE_KEY = "fitness-plan-pending-v1";

  function createAttempt(frozen, expectedRevision) {
    return { frozen, expectedRevision, state: "draft", automaticRetries: 0 };
  }

  function canonicalRow(row) {
    return JSON.stringify({
      id: row.id,
      values: Object.fromEntries(Object.entries(row.values || {}).sort(([a], [b]) => a.localeCompare(b))),
    });
  }

  function reconcile(attempt, snapshot) {
    if (snapshot.meta.baseInstanceId !== attempt.frozen.expectedBaseInstanceId) return "instance-changed";
    const live = new Map(snapshot.rows.map((row) => [row.id, row]));
    let identical = 0;
    let absent = 0;
    for (const row of attempt.frozen.rows) {
      const current = live.get(row.id);
      if (!current) absent += 1;
      else if (canonicalRow(current) === canonicalRow(row)) identical += 1;
      else return "different";
    }
    if (identical === attempt.frozen.rows.length) return "all-identical";
    if (absent === attempt.frozen.rows.length) return "all-absent";
    return "partial";
  }

  class Controller {
    constructor(options) {
      this.api = options.api;
      this.storage = options.storage || global.sessionStorage;
      this.clock = options.clock || { sleep: (ms) => new Promise((resolve) => global.setTimeout(resolve, ms)) };
      this.onState = options.onState || (() => {});
      this.validateRetry = options.validateRetry || (() => {});
    }

    transition(attempt, state, extra) {
      attempt.state = state;
      Object.assign(attempt, extra || {});
      this.onState({ ...attempt });
      if (["submitting", "retry-wait", "reconciling", "retry-ready", "hard-conflict", "committed-refresh-failed"].includes(state)) {
        this.save(attempt);
      } else if (state === "done") this.clear();
      return attempt;
    }

    async submit(attempt) {
      this.transition(attempt, "submitting");
      try {
        const result = await this.api.insertRows(attempt.frozen, attempt.expectedRevision);
        this.transition(attempt, "committed-refreshing", { result });
        return await this.refreshCommitted(attempt);
      } catch (error) {
        if (error && error.status === 429 && attempt.automaticRetries < 1) {
          attempt.automaticRetries += 1;
          this.transition(attempt, "retry-wait");
          await this.clock.sleep(Math.max(0, Number(error.retryAfter || 1)) * 1000);
          return this.submit(attempt);
        }
        if (error && error.status === 429) return this.transition(attempt, "retry-ready", { error });
        if (error && error.outcome === "not-committed" && error.code !== "revision_conflict") {
          return this.transition(attempt, "editable-error", { error });
        }
        return this.reconcileAttempt(attempt, error);
      }
    }

    async reconcileAttempt(attempt, error) {
      this.transition(attempt, "reconciling", { error });
      try {
        const snapshot = await this.api.refresh();
        const result = reconcile(attempt, snapshot);
        if (result === "all-identical") {
          this.transition(attempt, "committed-refreshing", { snapshot });
          return this.transition(attempt, "done", { snapshot });
        }
        if (result === "all-absent") {
          try {
            this.validateRetry(attempt, snapshot);
          } catch (validationError) {
            return this.transition(attempt, "hard-conflict", {
              error: validationError,
              snapshot,
              reconcile: "business-duplicate",
            });
          }
          attempt.expectedRevision = snapshot.meta.revision;
          return this.transition(attempt, "retry-ready", { snapshot });
        }
        return this.transition(attempt, "hard-conflict", { snapshot, reconcile: result });
      } catch (refreshError) {
        return this.transition(attempt, "hard-conflict", { error: refreshError });
      }
    }

    async refreshCommitted(attempt) {
      try {
        const snapshot = await this.api.refresh();
        return this.transition(attempt, "done", { snapshot });
      } catch (error) {
        return this.transition(attempt, "committed-refresh-failed", { error });
      }
    }

    save(attempt) {
      const persisted = {
        frozen: attempt.frozen,
        expectedRevision: attempt.expectedRevision,
        state: attempt.state,
        automaticRetries: attempt.automaticRetries,
      };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    }

    restore() {
      try {
        const value = JSON.parse(this.storage.getItem(STORAGE_KEY) || "null");
        if (
          !value ||
          !value.frozen ||
          typeof value.frozen.expectedBaseInstanceId !== "string" ||
          !Array.isArray(value.frozen.rows) ||
          value.frozen.rows.length < 1 ||
          !Number.isInteger(value.expectedRevision) ||
          value.expectedRevision < 0
        ) return null;
        return value;
      } catch {
        return null;
      }
    }

    clear() {
      this.storage.removeItem(STORAGE_KEY);
    }
  }

  global.FitnessPlanSubmission = { Controller, STORAGE_KEY, canonicalRow, createAttempt, reconcile };
})(globalThis);
