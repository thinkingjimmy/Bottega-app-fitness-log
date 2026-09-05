# src/lib/

> L2 | Parent: [README.md](../README.md)

- `i18n.ts`: Five-language UI dictionaries and locale negotiation.
- `locale.ts`: React locale projection for labels, terms, names, and instructions.
- `resources.ts`: Typed static imports of the frozen JSON datasets.
- `media.ts`: Generated static GIF imports keyed by canonical exercise ID.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
