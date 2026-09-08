/**
 * [INPUT]: React SDK snapshots and Fitness schema validation
 * [OUTPUT]: Live Base state with stale-data preservation, explicit retry, and visible plan availability
 * [POS]: hooks layer of the Fitness GUI
 * [PROTOCOL]: Update this header when making changes, then check README.md.
 */

import { useState } from "react";
import { useBaseSnapshot } from "@bottega/app-react";
import type { BaseSnapshot, Translator } from "../domain/types";
import { validateColumns } from "../domain/schema";
import { validatePlanSchema } from "../plan/builder";
export function useFitnessBase(t: Translator) {
  const resource = useBaseSnapshot();
  const [lastGood, setLastGood] = useState<BaseSnapshot | null>(null);
  const snapshot = resource.status === "success" ? resource.data : lastGood;
  // Retain the last complete snapshot without an extra post-paint render.
  if (resource.status === "success" && resource.data !== lastGood)
    setLastGood(resource.data);
  const issues = snapshot ? validateColumns(snapshot.meta.columns) : [];
  const disabledReason = !snapshot?.meta.capabilities?.rowInsert
    ? t("plan.disabled.readonly")
    : validatePlanSchema(snapshot.meta).length
      ? t("plan.disabled.schema")
      : "";
  const error = resource.status === "error" ? resource.error : null;
  const statusKey =
    error?.status && [401, 404, 410].includes(error.status)
      ? `error.${error.status}`
      : error?.status && error.status >= 500
        ? "error.5xx"
        : "error.generic";
  const status = error
    ? t(statusKey) + (snapshot ? t("error.stale") : "")
    : issues.length
      ? t("status.schema", {
          issues: issues
            .map((issue) => `${issue.id}(${issue.reason})`)
            .join(", "),
        })
      : snapshot
        ? t("status.ok", { n: snapshot.rows.length })
        : t("status.loading");
  return {
    snapshot,
    refresh: resource.refresh,
    retry: resource.retry,
    status,
    error: Boolean(error || issues.length),
    disabledReason,
  };
}
