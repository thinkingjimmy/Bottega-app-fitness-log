/**
 * [INPUT]: Offline catalog, localized filters, and shadcn Input, Button, and Select controls
 * [OUTPUT]: Searchable grouped catalog with stable 24-item pagination
 * [POS]: components layer of the Fitness GUI
 * [PROTOCOL]: Update this header when making changes, then check README.md.
 */

import { useMemo, useState } from "react";
import type { Exercise, Filters } from "../domain/types";
import { filterExercises, groupByBodyPart } from "../domain/catalog";
import { exercises, regions } from "../lib/resources";
import type { LocaleContext } from "../lib/locale";
import { Button, Input } from "./ui/forms";
import { SelectControl } from "./ui/select";
const emptyFilters = (): Filters => ({
  query: "",
  bodyPart: "",
  muscle: "",
  equipment: "",
});
export function Catalog({
  copy,
  onSelect,
}: {
  copy: LocaleContext;
  onSelect(item: Exercise, trigger: HTMLButtonElement): void;
}) {
  const [filters, setFilters] = useState(emptyFilters),
    [visible, setVisible] = useState(24);
  const { t } = copy;
  const filtered = useMemo(
    () => filterExercises(exercises, filters, copy.localize),
    [filters, copy],
  );
  const update = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setVisible(24);
  };
  const entries = (values: string[], namespace: string) =>
    [...new Set(values)]
      .map((value) => [value, copy.term(namespace, value)] as const)
      .sort((a, b) => a[1].localeCompare(b[1], copy.locale));
  const controls = [
    {
      key: "bodyPart" as const,
      id: "body-filter",
      label: t("catalog.bodyPart"),
      options: entries(
        exercises.map((item) => item.body_part),
        "bodyParts",
      ),
    },
    {
      key: "muscle" as const,
      id: "muscle-filter",
      label: t("catalog.muscle"),
      options: regions.map(
        (region) => [region.id, copy.label(region.id)] as const,
      ),
    },
    {
      key: "equipment" as const,
      id: "equipment-filter",
      label: t("catalog.equipment"),
      options: entries(
        exercises.map((item) => item.equipment),
        "equipment",
      ),
    },
  ];
  const totals = new Map(
    groupByBodyPart(filtered).map(([key, items]) => [key, items.length]),
  );
  return (
    <section className="catalog-panel min-w-0" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow" id="catalog-eyebrow">
            {t("catalog.eyebrow", { n: exercises.length })}
          </p>
          <h2 id="catalog-title">{t("catalog.title")}</h2>
        </div>
        <Button
          id="clear"
          className="ghost"
          onClick={() => {
            setFilters(emptyFilters());
            setVisible(24);
          }}
        >
          {t("catalog.clear")}
        </Button>
      </div>
      <label className="field search">
        <span>{t("catalog.search")}</span>
        <Input
          id="query"
          type="search"
          placeholder={t("catalog.searchHint")}
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
        />
      </label>
      <div className="filters">
        {controls.map((control) => (
          <div key={control.key} className="field">
            <label htmlFor={control.id}>{control.label}</label>
            <SelectControl
              id={control.id}
              label={control.label}
              value={filters[control.key]}
              onValueChange={(value) => update(control.key, value)}
              options={[
                { value: "", label: t("catalog.all") },
                ...control.options.map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
        ))}
      </div>
      <p className="result-line">
        <span id="result-count">
          {t("catalog.count", { n: filtered.length })}
        </span>
        <span id="result-showing">
          {visible < filtered.length
            ? t("catalog.showing", { n: visible })
            : t("catalog.grouped")}
        </span>
      </p>
      <div id="catalog" className="catalog" aria-live="polite">
        {filtered.length ? (
          groupByBodyPart(filtered.slice(0, visible), (key) =>
            copy.term("bodyParts", key),
          ).map(([group, items]) => (
            <section className="catalog-group" key={group}>
              <h3>
                {copy.term("bodyParts", group)}
                <b>{totals.get(group)}</b>
              </h3>
              <div className="cards">
                {items.map((item) => (
                  <button
                    className="card"
                    key={item.id}
                    type="button"
                    data-exercise-id={item.id}
                    onClick={(event) => onSelect(item, event.currentTarget)}
                  >
                    <strong>{copy.name(item)}</strong>
                    <span className="card-kit">
                      {copy.term("equipment", item.equipment)}
                    </span>
                    <span className="card-meta">
                      {t("card.target")}
                      {t("punct.label")}
                      <b>{copy.term("muscles", item.target)}</b> ·{" "}
                      {t("card.secondary")}
                      {t("punct.label")}
                      {item.secondary_muscles.length
                        ? copy.list(
                            item.secondary_muscles.map((value) =>
                              copy.term("muscles", value),
                            ),
                          )
                        : t("card.none")}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="empty">{t("catalog.empty")}</p>
        )}
      </div>
      {visible < filtered.length && (
        <Button
          id="more"
          className="more"
          onClick={() => setVisible((value) => value + 24)}
        >
          {t("catalog.more")}
        </Button>
      )}
    </section>
  );
}
