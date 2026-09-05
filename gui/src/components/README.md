# src/components/

> L2 | Parent: [README.md](../README.md)

- `heatmap.tsx`: Accessible anatomy SVG and completed-set statistics.
- `catalog.tsx`: Local exercise filters, grouped results, and pagination.
- `exercise-dialog.tsx`: Focus-managed exercise details with adjacent media attribution.
- `plan-dialog.tsx`: State-driven plan dialog, editor locking, and feedback.
- `plan-row.tsx`: A controlled exercise, set-count, and weight editor.
- `styles/`: Focused training-manual visual rules and responsive theme overrides.
- `ui/`: App-owned host shadcn component snapshots with recorded origins.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
