# 🏋️ Fitness Log

Fitness Log separates planned work from completed training. Use the App's chat to record rows; open the read-only “应用” surface to search a 72-exercise offline catalog and inspect a front/back muscle heatmap. “数据” remains the source of truth.

## Data contract

Every new row uses `date`, `exercise`, `exercise_id`, `status`, `sets`, and `weight`. `status` is `planned`, `completed`, or `unknown`; progress charts and the heatmap count only completed rows with a known catalog id. `sample-*` rows are always excluded from real statistics.

Existing instances are upgraded by the generic `migrations/base.json` contract: missing v2 columns are appended, legacy rows receive `status=unknown`, and `exercise_id` is filled only for an exact unique catalog name or alias. Existing values are never overwritten; a conflicting column type stops with export/recovery guidance before any write.

The heatmap scores sets, not weight: target zone ×1.0, muscle group ×0.65, and each secondary zone ×0.35. Duplicate zones within one exercise take the highest weight. Display intensity is `1 - exp(-score / 12)`. This is a visualization scale, not training or medical advice. Excluded rows remain visible as diagnostics.

## Offline exercise data

The catalog is generated from [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset) at commit `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`. Metadata and instructions are distributed under its MIT license, included in `gui/data/exercises-dataset.LICENSE.txt`.

No upstream images, GIFs, or other Gym visual media are included. The body map is original project SVG. The GUI makes no runtime network requests and reads Base only through the token-bound, read-only `/_api/base` gateway.

## Use it

1. Open Use chat and describe a plan or an explicitly completed workout.
2. Confirming a plan as completed patches that row instead of inserting a duplicate.
3. Open “应用” for the catalog and heatmap; use “数据” to inspect or correct rows.
4. Unknown actions keep an empty `exercise_id`; the Agent must never guess.

## Requirements

None. The App uses AI Chat's built-in Base tools and read-only GUI gateway.

## Package map

- `app.json`: Base App manifest.
- `data/base.json`: v2 six-column seed and completed-only progress views.
- `migrations/base.json`: generic, idempotent live Base upgrade descriptor.
- `gui/`: fixed offline GUI Surface entry, scripts, original SVG, and pinned catalog data.
- `.agents/skills/workout-entry/SKILL.md`: planned/completed recording protocol.

## License

App code and original SVG: MIT. Upstream dataset attribution and media exception are preserved in the bundled license.
