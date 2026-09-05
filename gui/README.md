# gui/

> L2 | Parent: [README.md](../README.md)

- `src/`: React and TypeScript source, Tailwind styles, feature components, domain modules, and hooks.
- `components.json`: Requested host shadcn groups (`forms` and `overlays`).
- `component-origins.json`: Signed source provenance for the installed component snapshots.
- `.bottega/origin-blobs/`: Immutable upstream component bytes used by provenance checks.
- `data/`: Frozen exercise and anatomy JSON, translations, licenses, and provenance.
- `media/`: The original 72 exercise GIFs, imported statically by `src/lib/media.ts`.

```text
gui/
├── src/ → components/ → hooks/ → domain/ + plan/
│        └── lib/ → data/ + media/
├── components.json + component-origins.json
├── .bottega/origin-blobs/
├── data/
└── media/
```

The `bottega-react-v1` host mounts the default export from `src/main.tsx`. Executable imports stay inside `src/`; frozen JSON and media are bundled from `data/` and `media/`. README files are documentation, never executable inputs. The host SDK owns Base transport, complete cursor traversal, consistent snapshot retries, and cancellation. The App owns domain calculations and frozen plan submission identities.

The training-manual typography, OKLCH palette, anatomy layers, and responsive breakpoints remain in `src/styles.css`. Five locales project all UI labels. Only the 17 semantic muscle zones accept heat and keyboard focus. Every animation and its original attribution share one figure. Completed rows alone contribute to statistics; planned rows use the unchanged six-column Base schema.

Plan state controls editor locking, buttons, feedback, and closing. Pending session records contain frozen row IDs and values, never tokens. Reconciliation refreshes the entire Base before offering a retry; an instance change, partial match, or changed row locks the attempt for review.

Validation lives in the development repository: `pnpm --filter @ai-chat/desktop test:first-party:fitness-gui`. Architecture changes update this map and the affected source contracts together.

[PROTOCOL]: Update this header when the file changes, then check README.md
