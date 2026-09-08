# src/

> L2 | Parent: [README.md](../README.md)

- `main.tsx`: The default React component composes the heatmap, catalog, and dialogs.
- `styles.css`: Tailwind entry and the responsive training-manual visual system.
- `components/`: Declarative feature views and provenance-tracked host components.
- `domain/`: Pure catalog, calendar, schema, and completed-workout calculations.
- `hooks/`: Base snapshot and training-plan orchestration.
- `lib/`: Frozen resources, bundled media URLs, and locale projection.
- `plan/`: Typed plan validation, frozen identities, and submission recovery.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when making changes, then check README.md.
