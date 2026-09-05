/**
 * [INPUT]: Base snapshot, local body geometry, and completed-set statistics
 * [OUTPUT]: Keyboard-accessible male/female muscle heatmap and contribution detail
 * [POS]: components layer of the Fitness GUI
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import { useMemo, useState } from "react";
import type { BaseSnapshot, Gender, Range } from "../domain/types";
import { analyzeRows, intensity, type Analysis } from "../domain/muscle-stats";
import { bodyMap, byId, exercises } from "../lib/resources";
import type { LocaleContext } from "../lib/locale";
export function Heatmap({
  snapshot,
  status,
  error,
  copy,
}: {
  snapshot: BaseSnapshot | null;
  status: string;
  error: boolean;
  copy: LocaleContext;
}) {
  const [gender, setGender] = useState<Gender>("male"),
    [range, setRange] = useState<Range>("30");
  const [selected, setSelected] = useState("");
  const analysis = useMemo(
    () => analyzeRows(snapshot?.rows ?? [], exercises, range, new Date()),
    [snapshot, range],
  );
  const { t } = copy;
  return (
    <section className="heat-panel min-w-0" aria-labelledby="heat-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("map.eyebrow")}</p>
          <h2 id="heat-title">{t("map.title")}</h2>
        </div>
        <div className="map-controls">
          <label className="field">
            <span>{t("map.body")}</span>
            <span className="field-wrap">
              <select
                id="gender"
                value={gender}
                onChange={(event) => setGender(event.target.value as Gender)}
              >
                {(["male", "female"] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(`map.body.${value}`)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="field">
            <span>{t("map.range")}</span>
            <span className="field-wrap">
              <select
                id="range"
                value={range}
                onChange={(event) => setRange(event.target.value as Range)}
              >
                {["7", "30", "90", "all"].map((value) => (
                  <option key={value} value={value}>
                    {t(`map.range.${value}`)}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </div>
      <div
        id="status"
        className={`status${error ? " error" : ""}`}
        role="status"
      >
        {status}
      </div>
      <figure className="plate">
        <div className="plate-inner">
          <div className="body-maps">
            {(["front", "back"] as const).map((side) => {
              const model = bodyMap.genders[gender],
                view = model.views[side];
              const box = model.viewBox[side],
                [, , width, height] = box.split(" ");
              return (
                <figure key={side}>
                  <figcaption>{t(`map.${side}`)}</figcaption>
                  <svg
                    className="body"
                    data-view={side}
                    viewBox={box}
                    style={{ aspectRatio: `${width} / ${height}` }}
                    role="group"
                    aria-label={t(`map.${side}Aria`)}
                  >
                    <path className="body-outline" d={view.outline} />
                    <g className="figure" aria-hidden="true">
                      {view.figure.map((path, index) => (
                        <path key={index} d={path} />
                      ))}
                    </g>
                    {view.zones.map((zone) => {
                      const score = analysis.scores[zone.id] ?? 0;
                      return (
                        <g
                          key={zone.id}
                          className={`zone${selected === zone.id ? " selected" : ""}`}
                          data-muscle={zone.id}
                          data-level={Math.ceil(intensity(score) * 4)}
                          tabIndex={0}
                          role="button"
                          aria-pressed={selected === zone.id}
                          aria-label={`${copy.label(zone.id)} ${score.toFixed(1)}`}
                          onClick={() => setSelected(zone.id)}
                          onKeyDown={(event) => {
                            if (["Enter", " "].includes(event.key)) {
                              event.preventDefault();
                              setSelected(zone.id);
                            }
                          }}
                        >
                          {zone.paths.map((path, index) => (
                            <path key={index} d={path} />
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </figure>
              );
            })}
          </div>
          <div className="plate-key">
            <span className="key-title">{t("map.legendTitle")}</span>
            <div className="key-scale">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level}>
                  <i data-level={level} />
                  <span>{level}</span>
                </div>
              ))}
            </div>
            <span className="key-note">{t("map.legendNote")}</span>
          </div>
        </div>
      </figure>
      <MuscleDetail selected={selected} analysis={analysis} copy={copy} />
    </section>
  );
}
function MuscleDetail({
  selected,
  analysis,
  copy,
}: {
  selected: string;
  analysis: Analysis;
  copy: LocaleContext;
}) {
  const { t } = copy,
    items = analysis.contributions[selected] ?? [];
  return (
    <section id="muscle-detail" className="detail" aria-live="polite">
      <h3>{selected ? copy.label(selected) : t("map.pick")}</h3>
      {!selected ? (
        <p>{t("map.pickHint")}</p>
      ) : (
        <>
          <p>
            {t("map.score")}{" "}
            <strong>{(analysis.scores[selected] ?? 0).toFixed(1)}</strong> ·{" "}
            {t("map.sets")} {items.reduce((sum, item) => sum + item.sets, 0)} ·{" "}
            {t("map.records")} {new Set(items.map((item) => item.rowId)).size}
          </p>
          {items.length ? (
            <ol>
              {items.slice(0, 8).map((item) => (
                <li key={item.rowId}>
                  <span>
                    {byId.has(item.exerciseId)
                      ? copy.name(byId.get(item.exerciseId)!)
                      : item.exerciseId}
                  </span>
                  <em>
                    {t("map.setsUnit", { n: item.sets })}
                    {t("punct.pair")}
                    {t("map.contribution", { n: item.points.toFixed(1) })}
                  </em>
                </li>
              ))}
            </ol>
          ) : (
            <p>{t("map.noRows")}</p>
          )}
        </>
      )}
    </section>
  );
}
