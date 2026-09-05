# src/plan/

> L2 | Parent: [README.md](../README.md)

- `builder.ts`: Schema validation, duplicate detection, and immutable plan rows.
- `submission.ts`: Single-flight submission, one rate-limit retry, reconciliation, and session recovery.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
