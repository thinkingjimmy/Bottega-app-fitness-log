/**
 * [INPUT]: Typed plan state machine, React SDK writes, and the current Base snapshot
 * [OUTPUT]: Controlled plan editor with stable submission identity and restored drafts
 * [POS]: hooks layer of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBaseMutation, useHostAction } from "@bottega/app-react";
import type { BaseSnapshot, Translator } from "../domain/types";
import { exercises } from "../lib/resources";
import {
  assertNoPlannedDuplicate,
  freezePlan,
  localDate,
  type FrozenPlan,
  type PlanItem,
} from "../plan/builder";
import {
  Controller,
  createAttempt,
  statePolicy,
  type Attempt,
} from "../plan/submission";
export type DraftItem = {
  key: string;
  exerciseId: string;
  sets: string;
  weight: string;
  query: string;
};
const blank = (): DraftItem => ({
  key: crypto.randomUUID(),
  exerciseId: "",
  sets: "3",
  weight: "0",
  query: "",
});
export function usePlan(
  snapshot: BaseSnapshot | null,
  refresh: () => Promise<BaseSnapshot>,
  t: Translator,
) {
  const mutate = useBaseMutation(),
    hostAction = useHostAction();
  const [open, setOpen] = useState(false),
    [date, setDateValue] = useState(() => localDate());
  const [items, setItems] = useState<DraftItem[]>(() => [blank()]);
  const [attempt, setAttempt] = useState<Attempt | null>(null),
    [error, setError] = useState<unknown>(null);
  const [announcement, setAnnouncement] = useState("");
  const current = useRef<Attempt | null>(null),
    controller = useRef<Controller | null>(null);
  const api = useMemo(
    () => ({
      refresh,
      insertRows: (
        frozen: FrozenPlan,
        expectedRevision: number,
        signal?: AbortSignal,
      ) =>
        mutate(
          {
            kind: "insert",
            expectedBaseInstanceId: frozen.expectedBaseInstanceId,
            expectedRevision,
            rows: frozen.rows,
          },
          signal ? { signal } : undefined,
        ),
    }),
    [refresh, mutate],
  );
  const restoreDraft = useCallback((value: Attempt) => {
    setDateValue(value.frozen.date);
    setItems(
      value.frozen.rows.map((row) => ({
        key: row.id,
        exerciseId: String(row.values.exercise_id),
        sets: String(row.values.sets),
        weight: String(row.values.weight),
        query: "",
      })),
    );
  }, []);
  useEffect(() => {
    const owner = new Controller({
      api,
      onState: (value) => {
        if (value.state !== "done") {
          current.current = value;
          setAttempt(value);
          return;
        }
        current.current = null;
        setAttempt(null);
        setOpen(false);
        setAnnouncement(
          t("plan.success", {
            date: value.frozen.date,
            ...value.frozen.summary,
          }),
        );
        void hostAction(
          value.snapshot?.meta.activeViewId
            ? {
                type: "open-data-view",
                viewId: value.snapshot.meta.activeViewId,
              }
            : { type: "open-data" },
        ).catch(() => undefined);
      },
      validateRetry: (value, live) =>
        assertNoPlannedDuplicate(
          live.rows,
          value.frozen.date,
          value.frozen.rows.map((row) => String(row.values.exercise_id)),
        ),
    });
    controller.current = owner;
    const restored = owner.restore();
    if (restored) {
      current.current = restored;
      setAttempt(restored);
      restoreDraft(restored);
      setOpen(true);
      void owner.reconcileAttempt(restored);
    }
    return () => {
      owner.dispose();
      if (controller.current === owner) controller.current = null;
    };
  }, [api, restoreDraft, hostAction, t]);
  const policy = statePolicy[attempt?.state ?? "draft"];
  const edit = (change: () => void) => {
    if (current.current && statePolicy[current.current.state].locked) return;
    current.current = null;
    setAttempt(null);
    setError(null);
    controller.current?.clear();
    change();
  };
  const show = () => {
    setError(null);
    if (current.current) restoreDraft(current.current);
    else {
      setDateValue(localDate());
      setItems([blank()]);
    }
    setOpen(true);
  };
  const close = () => {
    if (current.current && statePolicy[current.current.state].locked) return;
    setOpen(false);
  };
  const save = async () => {
    if (
      !snapshot ||
      !controller.current ||
      (current.current && statePolicy[current.current.state].locked)
    )
      return;
    setError(null);
    try {
      const planItems: PlanItem[] = items.map((item) => ({
        exerciseId: item.exerciseId,
        sets: item.sets.trim() ? Number(item.sets) : NaN,
        weight: item.weight.trim() ? Number(item.weight) : NaN,
      }));
      current.current ??= createAttempt(
        freezePlan({
          meta: snapshot.meta,
          rows: snapshot.rows,
          exercises,
          date,
          items: planItems,
          randomUUID: () => crypto.randomUUID(),
        }),
        snapshot.meta.revision,
      );
      await controller.current.submit(current.current);
    } catch (error) {
      setError(error);
    }
  };
  return {
    open,
    show,
    close,
    date,
    items,
    attempt,
    error,
    announcement,
    policy,
    save,
    setDate: (value: string) => edit(() => setDateValue(value)),
    add: () => edit(() => setItems((current) => [...current, blank()])),
    remove: (key: string) =>
      edit(() =>
        setItems((current) =>
          current.length > 1
            ? current.filter((item) => item.key !== key)
            : current,
        ),
      ),
    update: (key: string, value: Partial<DraftItem>) =>
      edit(() =>
        setItems((current) =>
          current.map((item) =>
            item.key === key ? { ...item, ...value } : item,
          ),
        ),
      ),
  };
}
export type Plan = ReturnType<typeof usePlan>;
