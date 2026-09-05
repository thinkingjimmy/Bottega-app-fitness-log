/**
 * [INPUT]: Host language and typed offline vocabulary
 * [OUTPUT]: Localized display projections and numbered instructions
 * [POS]: Shared presentation vocabulary
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import { useMemo } from "react";
import { useAppEnvironment } from "@bottega/app-react";
import { resolve, translator } from "./i18n";
import { regions, terms } from "./resources";
import type { Exercise } from "../domain/types";
export function useLocale() {
  const { language } = useAppEnvironment();
  return useMemo(() => {
    const locale = resolve(language);
    const t = translator(locale);
    const label = (id: string) =>
      regions.find((region) => region.id === id)?.labels[locale] ?? id;
    const term = (namespace: string, value: string) =>
      terms[namespace]?.[value]?.[locale] ??
      terms[namespace]?.[value]?.en ??
      value;
    const name = (item: Exercise) =>
      locale === "zh-CN" ? item.aliases[0] || item.name : item.name;
    const list = (values: readonly string[]) => values.join(t("punct.list"));
    const localize = (item: Exercise) => [
      term("bodyParts", item.body_part),
      term("equipment", item.equipment),
      ...[item.target, item.muscle_group, ...item.secondary_muscles].map(
        (value) => term("muscles", value),
      ),
      ...item.canonical_zones.map(label),
    ];
    return { locale, t, label, term, name, list, localize };
  }, [language]);
}
export type LocaleContext = ReturnType<typeof useLocale>;
export function splitSteps(text: string): string[] {
  const sentences = text
    .split(/(?<=[。．.!?！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.length ? sentences : [text];
}
