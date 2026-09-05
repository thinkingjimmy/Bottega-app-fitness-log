/**
 * [INPUT]: The public Base SDK and local exercise data
 * [OUTPUT]: Fitness domain types
 * [POS]: Shared domain vocabulary
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

export type { BaseColumn, BaseRow, BaseSnapshot } from "@bottega/app-react";
export type Locale = "zh-CN" | "en" | "ja" | "fr" | "es";
export type Gender = "male" | "female";
export type Range = "7" | "30" | "90" | "all";
export type Exercise = {
  id: string;
  name: string;
  aliases: string[];
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  secondary_muscles: string[];
  canonical_zones: string[];
  zone_weights: Record<string, number>;
  instructions: { zh: string; en: string };
  media: { gif: string; attribution: string };
};
export type Region = { id: string; labels: Record<string, string> };
export type Terms = Record<string, Record<string, Record<string, string>>>;
export type BodyView = {
  outline: string;
  figure: string[];
  zones: { id: string; paths: string[] }[];
};
export type BodyMap = {
  genders: Record<
    Gender,
    {
      viewBox: Record<"front" | "back", string>;
      views: Record<"front" | "back", BodyView>;
    }
  >;
};
export type Filters = {
  query: string;
  bodyPart: string;
  muscle: string;
  equipment: string;
};
export type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;
