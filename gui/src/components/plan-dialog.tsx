/**
 * [INPUT]: Controlled plan hook and origin-attested shadcn Dialog/form controls with focusable field slots
 * [OUTPUT]: Plan dialog with locked recovery, stable feedback, validation focus, and focus restoration
 * [POS]: Fitness GUI components layer
 * [PROTOCOL]: Update this header when making changes, then check README.md.
 */

import { useEffect, useRef, type RefObject } from "react";
import type { Plan } from "../hooks/use-plan";
import type { LocaleContext } from "../lib/locale";
import type { Translator } from "../domain/types";
import { Dialog } from "./ui/overlays";
import { Button, Input } from "./ui/forms";
import { PlanRow } from "./plan-row";
function errorMessage(error: unknown, t: Translator): string {
  const detail = error as { code?: string; message?: string } | null;
  const key = `plan.error.${detail?.code ?? detail?.message}`;
  return t(key) === key ? t("plan.error.generic") : t(key);
}
function feedback(
  plan: Plan,
  t: Translator,
): { tone: string; message: string } {
  if (plan.error)
    return { tone: "error", message: errorMessage(plan.error, t) };
  const state = plan.attempt?.state;
  const known: Record<string, [string, string]> = {
    "committed-refresh-failed": ["done", "plan.savedRefreshFailed"],
    "hard-conflict": ["warn", "plan.hardConflict"],
    "retry-ready": ["info", "plan.retryReady"],
  };
  const entry = state ? known[state] : null;
  if (entry) return { tone: entry[0], message: t(entry[1]) };
  if (plan.policy.busy) return { tone: "busy", message: t("plan.busyClose") };
  return plan.attempt?.error
    ? { tone: "error", message: errorMessage(plan.attempt.error, t) }
    : { tone: "", message: "" };
}
export function PlanDialog({
  plan,
  copy,
  trigger,
}: {
  plan: Plan;
  copy: LocaleContext;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = copy,
    dateInput = useRef<HTMLInputElement | null>(null),
    form = useRef<HTMLFormElement | null>(null);
  const state = feedback(plan, t);
  useEffect(() => {
    const field = (plan.error as { field?: string } | null)?.field;
    if (!field) return;
    const name = field === "exercise_id" ? "items.0.exerciseId" : field;
    const control =
      Array.from(
        form.current?.querySelectorAll<HTMLElement>("[data-field]") ?? [],
      ).find((element) => element.dataset.field === name) ??
      form.current?.elements.namedItem(name);
    if (control instanceof HTMLElement) control.focus();
  }, [plan.error]);
  return (
    <Dialog.Root
      open={plan.open}
      onOpenChange={(open, details) => {
        if (open) return;
        if (plan.policy.locked) details.cancel();
        else plan.close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fitness-backdrop" />
        <Dialog.Popup
          id="plan-dialog"
          className="fitness-dialog"
          initialFocus={dateInput}
          finalFocus={trigger}
        >
          <form
            id="plan-form"
            ref={form}
            aria-busy={plan.policy.busy}
            onSubmit={(event) => {
              event.preventDefault();
              void plan.save();
            }}
          >
            <div className="sheet-head">
              <div>
                <p className="eyebrow">{t("plan.eyebrow")}</p>
                <Dialog.Title id="plan-title">{t("plan.title")}</Dialog.Title>
              </div>
              <Button
                id="plan-close"
                className="dialog-close"
                type="button"
                aria-label={t("dialog.close")}
                disabled={plan.policy.locked}
                onClick={plan.close}
              >
                ×
              </Button>
            </div>
            <Dialog.Description id="plan-hint" className="subtitle">
              {t("plan.hint")}
            </Dialog.Description>
            <label className="field plan-date-field">
              <span>{t("plan.date")}</span>
              <Input
                ref={dateInput}
                id="plan-date"
                name="date"
                type="date"
                required
                disabled={plan.policy.locked}
                value={plan.date}
                onChange={(event) => plan.setDate(event.target.value)}
              />
            </label>
            <fieldset id="plan-items">
              <legend>{t("plan.exercises")}</legend>
              <div className="plan-cols" aria-hidden="true">
                <span />
                <span>{t("plan.searchLabel")}</span>
                <span>{t("plan.exercise")}</span>
                <span>{t("plan.sets")}</span>
                <span>{t("plan.weightCol")}</span>
                <span />
              </div>
              <div id="plan-list">
                {plan.items.map((item, index) => (
                  <PlanRow
                    key={item.key}
                    item={item}
                    index={index}
                    copy={copy}
                    locked={plan.policy.locked}
                    only={plan.items.length === 1}
                    onChange={(value) => plan.update(item.key, value)}
                    onRemove={() => plan.remove(item.key)}
                  />
                ))}
              </div>
            </fieldset>
            <Button
              id="plan-add"
              className="btn"
              type="button"
              disabled={plan.policy.locked}
              onClick={plan.add}
            >
              {t("plan.add")}
            </Button>
            <p
              id="plan-state"
              className="plan-state"
              role="alert"
              aria-live="assertive"
              data-tone={state.tone}
            >
              {state.message}
              {state.message && plan.attempt && (
                <em>
                  {t("plan.frozenSummary", {
                    date: plan.attempt.frozen.date,
                    ...plan.attempt.frozen.summary,
                  })}
                </em>
              )}
            </p>
            <div className="dialog-actions">
              <Button
                id="plan-cancel"
                className="btn"
                type="button"
                disabled={plan.policy.locked}
                onClick={plan.close}
              >
                {t("plan.cancel")}
              </Button>
              <Button
                id="plan-save"
                className="primary"
                type="button"
                disabled={plan.policy.locked}
                onClick={() => void plan.save()}
              >
                {t(`plan.state.${plan.attempt?.state ?? "draft"}`)}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
