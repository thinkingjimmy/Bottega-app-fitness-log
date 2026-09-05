/**
 * [INPUT]: React, typed Fitness domain/hooks/components, and the host SDK provider
 * [OUTPUT]: Default zero-argument Fitness Log component owned by the trusted bootstrap
 * [POS]: Fitness GUI main.tsx layer
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import { useEffect, useRef, useState } from "react";
import type { Exercise } from "./domain/types";
import { exercises } from "./lib/resources";
import { useLocale } from "./lib/locale";
import { useFitnessBase } from "./hooks/use-fitness-base";
import { usePlan } from "./hooks/use-plan";
import { Button } from "./components/ui/forms";
import { Heatmap } from "./components/heatmap";
import { Catalog } from "./components/catalog";
import { ExerciseDialog } from "./components/exercise-dialog";
import { PlanDialog } from "./components/plan-dialog";
export default function FitnessLog() {
  const copy = useLocale(),
    { t } = copy;
  const base = useFitnessBase(t),
    plan = usePlan(base.snapshot, base.refresh, t);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const exerciseTrigger = useRef<HTMLButtonElement | null>(null);
  const planTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    document.title = t("app.title");
    document.documentElement.lang = copy.locale;
  }, [copy.locale, t]);
  return (
    <>
      <header className="app-header">
        <div className="masthead-rule" />
        <div className="masthead">
          <div className="masthead-text">
            <p className="eyebrow">{t("app.eyebrow")}</p>
            <h1>{t("app.heading")}</h1>
            <p className="subtitle">{t("app.subtitle")}</p>
          </div>
          <div className="header-actions">
            <div className="revision" aria-live="polite">
              <span>{t("app.revision")}</span>
              <strong id="revision">
                {base.snapshot?.meta.revision ?? "—"}
              </strong>
            </div>
            <div className="plan-entry">
              <Button
                id="create-plan"
                ref={planTrigger}
                className="primary"
                type="button"
                disabled={Boolean(base.disabledReason)}
                aria-describedby="plan-disabled-reason"
                onClick={plan.show}
              >
                {t("plan.create")}
              </Button>
            </div>
          </div>
        </div>
        <p
          id="plan-disabled-reason"
          className="plan-availability"
          role="status"
          hidden={!base.disabledReason}
        >
          {base.disabledReason}
        </p>
      </header>
      <main className="grid items-start gap-[36px] min-[901px]:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)]">
        <Heatmap
          snapshot={base.snapshot}
          status={base.status}
          error={base.error}
          copy={copy}
        />
        <Catalog
          copy={copy}
          onSelect={(item, trigger) => {
            exerciseTrigger.current = trigger;
            setSelected(item);
          }}
        />
      </main>
      <ExerciseDialog
        item={selected}
        copy={copy}
        onClose={() => setSelected(null)}
        trigger={exerciseTrigger}
      />
      <PlanDialog plan={plan} copy={copy} trigger={planTrigger} />
      <div id="plan-announcement" className="sr-only" aria-live="polite">
        {plan.announcement}
      </div>
      <footer>
        <span>{t("footer.sources")}</span>{" "}
        <span id="media-credit">{exercises[0]?.media.attribution}</span>{" "}
        <span>{t("footer.disclaimer")}</span>
      </footer>
    </>
  );
}
