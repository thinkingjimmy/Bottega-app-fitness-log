/**
 * [INPUT]: Selected exercise, localized terms, static GIF imports, and shadcn Dialog
 * [OUTPUT]: Accessible exercise details with inseparable media attribution
 * [POS]: Fitness GUI components layer
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import type { RefObject } from "react";
import type { Exercise } from "../domain/types";
import { splitSteps, type LocaleContext } from "../lib/locale";
import { media } from "../lib/media";
import { Dialog } from "./ui/overlays";
import { Button } from "./ui/forms";
export function ExerciseDialog({
  item,
  copy,
  onClose,
  trigger,
}: {
  item: Exercise | null;
  copy: LocaleContext;
  onClose(): void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = copy;
  return (
    <Dialog.Root
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fitness-backdrop" />
        <Dialog.Popup
          id="exercise-dialog"
          className="fitness-dialog"
          finalFocus={trigger}
        >
          {item && (
            <div className="sheet-inner">
              <div className="sheet-head">
                <div>
                  <p className="eyebrow">{t("dialog.eyebrow")}</p>
                  <Dialog.Title id="exercise-title">
                    {copy.name(item)}
                  </Dialog.Title>
                </div>
                <Button
                  className="dialog-close"
                  aria-label={t("dialog.close")}
                  onClick={onClose}
                >
                  ×
                </Button>
              </div>
              <div id="exercise-detail">
                <div className="detail-body">
                  <dl className="facts">
                    <dt>{t("card.equipment")}</dt>
                    <dd>{copy.term("equipment", item.equipment)}</dd>
                    <dt>{t("card.target")}</dt>
                    <dd>
                      <b>{copy.term("muscles", item.target)}</b>
                    </dd>
                    <dt>{t("dialog.group")}</dt>
                    <dd>{copy.term("muscles", item.muscle_group)}</dd>
                    <dt>{t("card.secondary")}</dt>
                    <dd>
                      {item.secondary_muscles.length
                        ? copy.list(
                            item.secondary_muscles.map((value) =>
                              copy.term("muscles", value),
                            ),
                          )
                        : t("card.none")}
                    </dd>
                    <dt>{t("dialog.zones")}</dt>
                    <dd>{copy.list(item.canonical_zones.map(copy.label))}</dd>
                  </dl>
                  <figure className="exercise-media">
                    <img
                      src={media[item.id]}
                      width={180}
                      height={180}
                      alt={t("media.alt", { name: copy.name(item) })}
                      loading="lazy"
                    />
                    <figcaption>{item.media.attribution}</figcaption>
                  </figure>
                </div>
                <div className="howto">
                  <h3>{t("dialog.howto")}</h3>
                  <ol className="steps">
                    {splitSteps(
                      copy.locale === "zh-CN"
                        ? item.instructions.zh
                        : item.instructions.en,
                    ).map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
