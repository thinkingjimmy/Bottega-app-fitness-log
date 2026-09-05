# src/hooks/

> L2 | Parent: [README.md](../README.md)

- `use-fitness-base.ts`: Consistent host snapshots with last-good display state and write eligibility.
- `use-plan.ts`: Controlled plan drafts and stable submission lifecycle.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
