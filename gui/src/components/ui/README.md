# src/components/ui/

> L2 | Parent: [README.md](../README.md)

- `forms.tsx`: Host form primitives, including Button and Input.
- `overlays.tsx`: Host Base UI overlays, including focus-managed Dialog.

Dependencies flow from the React entry through feature components and hooks into pure domain modules. Host access stays in hooks through `@bottega/app-react`; data and media are frozen static imports.

[PROTOCOL]: Update this header when the file changes, then check README.md
