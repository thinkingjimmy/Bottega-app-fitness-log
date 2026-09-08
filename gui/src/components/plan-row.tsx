/**
 * [INPUT]: Controlled plan item, offline exercise choices, and shadcn Select control
 * [OUTPUT]: Search, exercise, sets, weight, and remove controls for one stable draft row
 * [POS]: Fitness GUI components layer
 * [PROTOCOL]: Update this header when making changes, then check README.md.
 */

import type { DraftItem } from "../hooks/use-plan";
import type { LocaleContext } from "../lib/locale";
import { exercises } from "../lib/resources";
import { Input, Button } from "./ui/forms";
import { SelectControl } from "./ui/select";
export function PlanRow({
  item,
  index,
  copy,
  locked,
  only,
  onChange,
  onRemove,
}: {
  item: DraftItem;
  index: number;
  copy: LocaleContext;
  locked: boolean;
  only: boolean;
  onChange(value: Partial<DraftItem>): void;
  onRemove(): void;
}) {
  const { t } = copy,
    query = item.query.trim().toLocaleLowerCase();
  const available = exercises.filter(
    (exercise) =>
      !query ||
      exercise.id === item.exerciseId ||
      `${exercise.name} ${exercise.aliases.join(" ")}`
        .toLocaleLowerCase()
        .includes(query),
  );
  return (
    <div className="plan-row">
      <span className="plan-no">{index + 1}</span>
      <span className="plan-cell plan-search-cell">
        <Input
          className="plan-exercise-search"
          type="search"
          autoComplete="off"
          placeholder={t("plan.search")}
          aria-label={t("plan.searchLabel")}
          value={item.query}
          disabled={locked}
          onChange={(event) => onChange({ query: event.target.value })}
        />
      </span>
      <span className="plan-cell plan-exercise-cell">
        <SelectControl
          className="plan-exercise-select"
          name={`items.${index}.exerciseId`}
          required
          label={t("plan.exercise")}
          value={item.exerciseId || null}
          disabled={locked}
          placeholder={t("plan.choose")}
          onValueChange={(exerciseId) => onChange({ exerciseId })}
          options={available.map((exercise) => ({
            value: exercise.id,
            label: copy.name(exercise),
          }))}
        />
      </span>
      <span className="plan-cell num plan-sets-cell">
        <Input
          className="plan-sets"
          name={`items.${index}.sets`}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          required
          aria-label={t("plan.sets")}
          value={item.sets}
          disabled={locked}
          onChange={(event) => onChange({ sets: event.target.value })}
        />
        <em className="unit">{t("plan.setsUnit")}</em>
      </span>
      <span className="plan-cell num plan-weight-cell">
        <Input
          className="plan-weight"
          name={`items.${index}.weight`}
          type="number"
          min={0}
          step={0.5}
          inputMode="decimal"
          required
          aria-label={t("plan.weight")}
          value={item.weight}
          disabled={locked}
          onChange={(event) => onChange({ weight: event.target.value })}
        />
        <em className="unit">{t("plan.weightUnit")}</em>
      </span>
      <Button
        className="plan-remove"
        type="button"
        aria-label={t("plan.remove")}
        disabled={locked || only}
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
}
