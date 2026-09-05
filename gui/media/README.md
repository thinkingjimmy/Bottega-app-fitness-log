# media/

> L2 | Parent: [README.md](../README.md)

- `<exercise_id>.gif`: 72 original 180×180 exercise animations, copied by the development catalog generator from the pinned upstream videos allowlist.

These bytes are licensed separately from the upstream MIT code. See `../data/gym-visual.NOTICE.md` for the full terms. Every use includes the original attribution:

> © Gym visual — https://gymvisual.com/

The generator checks GIF dimensions and provenance. `../src/lib/media.ts` statically imports the entire catalog so the host compiler can hash and bundle every animation. Each detail view renders its image and attribution in one figure. No thumbnails or upstream screenshots are included.

[PROTOCOL]: Update this header when the file changes, then check README.md
