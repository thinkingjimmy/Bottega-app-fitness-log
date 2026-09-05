/**
 * [INPUT]: Immutable local JSON resources
 * [OUTPUT]: Typed catalog, body geometry, terms, and id index
 * [POS]: Static data composition leaf
 * [PROTOCOL]: Update this header when the file changes, then check README.md
 */

import exerciseData from "../../data/exercises.json";
import regionData from "../../data/muscle-regions.json";
import mapData from "../../data/body-map.json";
import termData from "../../data/terms.json";
import type { BodyMap, Exercise, Region, Terms } from "../domain/types";
export const exercises: Exercise[] = exerciseData;
export const regions: Region[] = regionData;
export const bodyMap: BodyMap = mapData;
export const terms: Terms = termData;
export const byId = new Map(exercises.map((item) => [item.id, item]));
