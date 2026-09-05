# src/domain/

> L2 | Parent: [README.md](../README.md)

- `types.ts`: Shared exercise, anatomy, locale, filter, and Base types.
- `schema.ts`: The six-column contract and strict local-calendar helpers.
- `catalog.ts`: Pure exercise search, filters, pagination, and grouping.
- `muscle-stats.ts`: Completed-only set aggregation and heat intensity.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
