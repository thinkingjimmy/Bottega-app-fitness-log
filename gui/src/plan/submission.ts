/**
 * [INPUT]: Typed Fitness domain data and explicit dependencies
 * [OUTPUT]: Single-flight plan submission, frozen identity reconciliation, and token-free recovery
 * [POS]: plan module of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { BaseRow, BaseSnapshot } from "../domain/types";
import type { FrozenPlan } from "./builder";
export const STORAGE_KEY = "fitness-plan-pending-v1";
export type PlanState =
  | "draft"
  | "submitting"
  | "retry-wait"
  | "reconciling"
  | "committed-refreshing"
  | "editable-error"
  | "retry-ready"
  | "hard-conflict"
  | "committed-refresh-failed"
  | "done";
export type Attempt = {
  frozen: FrozenPlan;
  expectedRevision: number;
  state: PlanState;
  automaticRetries: number;
  error?: unknown;
  snapshot?: BaseSnapshot;
  reconcile?: string;
  result?: unknown;
};
export type Api = {
  refresh(): Promise<BaseSnapshot>;
  insertRows(
    frozen: FrozenPlan,
    revision: number,
    signal?: AbortSignal,
  ): Promise<unknown>;
};
export const createAttempt = (
  frozen: FrozenPlan,
  expectedRevision: number,
): Attempt => ({
  frozen,
  expectedRevision,
  state: "draft",
  automaticRetries: 0,
});
export const canonicalRow = (row: BaseRow) =>
  JSON.stringify({
    id: row.id,
    values: Object.fromEntries(
      Object.entries(row.values).sort(([a], [b]) => a.localeCompare(b)),
    ),
  });
export function reconcile(attempt: Attempt, snapshot: BaseSnapshot): string {
  if (snapshot.meta.baseInstanceId !== attempt.frozen.expectedBaseInstanceId)
    return "instance-changed";
  const live = new Map(snapshot.rows.map((row) => [row.id, row]));
  let identical = 0,
    absent = 0;
  for (const row of attempt.frozen.rows) {
    const current = live.get(row.id);
    if (!current) absent += 1;
    else if (canonicalRow(current) === canonicalRow(row)) identical += 1;
    else return "different";
  }
  if (identical === attempt.frozen.rows.length) return "all-identical";
  return absent === attempt.frozen.rows.length ? "all-absent" : "partial";
}
export const statePolicy: Record<
  PlanState,
  { busy: boolean; locked: boolean; persistent: boolean }
> = {
  draft: { busy: false, locked: false, persistent: false },
  submitting: { busy: true, locked: true, persistent: true },
  "retry-wait": { busy: true, locked: true, persistent: true },
  reconciling: { busy: true, locked: true, persistent: true },
  "committed-refreshing": { busy: true, locked: true, persistent: true },
  "editable-error": { busy: false, locked: false, persistent: false },
  "retry-ready": { busy: false, locked: false, persistent: true },
  "hard-conflict": { busy: false, locked: true, persistent: true },
  "committed-refresh-failed": { busy: false, locked: true, persistent: true },
  done: { busy: false, locked: false, persistent: false },
};
type Options = {
  api: Api;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  clock?: { sleep(ms: number): Promise<unknown> };
  onState?(attempt: Attempt): void;
  validateRetry?(attempt: Attempt, snapshot: BaseSnapshot): void;
};
export class Controller {
  private readonly storage: NonNullable<Options["storage"]>;
  private readonly abort = new AbortController();
  private running: Promise<Attempt> | null = null;
  constructor(private readonly options: Options) {
    this.storage = options.storage ?? sessionStorage;
  }
  transition(
    attempt: Attempt,
    state: PlanState,
    extra: Partial<Attempt> = {},
  ): Attempt {
    if (this.abort.signal.aborted) return attempt;
    Object.assign(attempt, extra, { state });
    if (statePolicy[state].persistent) this.save(attempt);
    else this.clear();
    this.options.onState?.({ ...attempt });
    return attempt;
  }
  submit(attempt: Attempt): Promise<Attempt> {
    if (this.running) return this.running;
    this.running = this.performSubmit(attempt).finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async performSubmit(attempt: Attempt): Promise<Attempt> {
    this.transition(attempt, "submitting");
    try {
      const result = await this.options.api.insertRows(
        attempt.frozen,
        attempt.expectedRevision,
        this.abort.signal,
      );
      this.transition(attempt, "committed-refreshing", { result });
      return await this.refreshCommitted(attempt);
    } catch (error) {
      if (this.abort.signal.aborted) return attempt;
      const detail = (error ?? {}) as {
        status?: number;
        retryAfter?: string;
        outcome?: string;
        code?: string;
      };
      if (detail.status === 429 && attempt.automaticRetries < 1) {
        attempt.automaticRetries += 1;
        this.transition(attempt, "retry-wait");
        const seconds = Number(detail.retryAfter ?? 1);
        await this.sleep(
          Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 1000,
        );
        return this.abort.signal.aborted
          ? attempt
          : this.performSubmit(attempt);
      }
      if (detail.status === 429)
        return this.transition(attempt, "retry-ready", { error });
      if (
        detail.outcome === "not-committed" &&
        detail.code !== "revision_conflict"
      )
        return this.transition(attempt, "editable-error", { error });
      return this.reconcileAttempt(attempt, error);
    }
  }
  async reconcileAttempt(attempt: Attempt, error?: unknown): Promise<Attempt> {
    this.transition(attempt, "reconciling", { error });
    try {
      const snapshot = await this.options.api.refresh();
      if (this.abort.signal.aborted) return attempt;
      const result = reconcile(attempt, snapshot);
      if (result === "all-identical")
        return this.transition(attempt, "done", { snapshot });
      if (result !== "all-absent")
        return this.transition(attempt, "hard-conflict", {
          snapshot,
          reconcile: result,
        });
      try {
        this.options.validateRetry?.(attempt, snapshot);
      } catch (error) {
        return this.transition(attempt, "hard-conflict", {
          error,
          snapshot,
          reconcile: "business-duplicate",
        });
      }
      attempt.expectedRevision = snapshot.meta.revision;
      return this.transition(attempt, "retry-ready", { snapshot });
    } catch (error) {
      return this.transition(attempt, "hard-conflict", { error });
    }
  }
  async refreshCommitted(attempt: Attempt): Promise<Attempt> {
    try {
      return this.transition(attempt, "done", {
        snapshot: await this.options.api.refresh(),
      });
    } catch (error) {
      return this.transition(attempt, "committed-refresh-failed", { error });
    }
  }
  save(attempt: Attempt): void {
    const { frozen, expectedRevision, state, automaticRetries } = attempt;
    this.storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ frozen, expectedRevision, state, automaticRetries }),
    );
  }
  restore(): Attempt | null {
    try {
      const value = JSON.parse(
        this.storage.getItem(STORAGE_KEY) ?? "null",
      ) as Attempt | null;
      if (
        !value?.frozen?.rows?.length ||
        !value.frozen.expectedBaseInstanceId ||
        !value.frozen.date ||
        !value.frozen.summary ||
        !Number.isInteger(value.expectedRevision) ||
        value.expectedRevision < 0
      )
        return null;
      return {
        ...value,
        automaticRetries: Math.max(0, value.automaticRetries || 0),
        state: "reconciling",
      };
    } catch {
      return null;
    }
  }
  clear(): void {
    this.storage.removeItem(STORAGE_KEY);
  }
  dispose(): void {
    this.abort.abort();
  }
  private sleep(ms: number): Promise<unknown> {
    if (this.options.clock) return this.options.clock.sleep(ms);
    return new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.abort.signal.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      this.abort.signal.addEventListener("abort", done, { once: true });
    });
  }
}
