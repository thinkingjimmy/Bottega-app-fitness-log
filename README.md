# 🏋️ Fitness Log

Tell the App what you trained. It writes the sets down, then shows you which muscles you have actually been hitting — and which ones you have been quietly skipping.

*[中文版](README.zh-CN.md)*

## What you get

**A muscle heatmap that answers one question: what am I neglecting?**
Front and back, male or female body, over the last 7 / 30 / 90 days or all time. The more completed sets a region has absorbed, the deeper it burns. Click any muscle to see exactly which exercises got it there.

**A 72-exercise catalog that works offline.**
Search by name, alias, muscle, or equipment; filter by body part. Every exercise opens with a 180×180 animated demo, the muscles it targets, and step-by-step instructions.

**Plans and completed workouts stay separate.**
Say "tomorrow I'll squat 5×5" and it is logged as a plan. Say "did it" and that same row is marked complete — no duplicate. Only completed sets ever reach the heatmap, so the picture never flatters you.

**It speaks your language.**
The interface follows the app's language — English, 简体中文, 日本語, Français, Español, and it never mixes two languages in one screen: equipment, muscles, and body parts are all translated, and exercise instructions are shown as numbered steps in your language (Chinese where available, English otherwise). The only untranslated text is the three credit lines in the footer — those are licence requirements.

**Nothing leaves your machine.**
The catalog, body map, and animations are all bundled. The GUI uses only the host-provided local Base SDK; catalog and media need no external network requests.

## How to use it

1. Use **Create training plan** in the App GUI for append-only planned rows, or open **Use chat** for completed workouts and corrections.
2. Confirm a plan as done and the App patches that row instead of inserting a new one.
3. Open **应用** for the catalog and heatmap; open **数据** to check or correct any row.
4. If the App cannot match what you said to a catalog exercise, it leaves the id blank rather than guessing.

## How the heatmap counts

It counts **sets, not weight**, and only from workouts marked complete. An exercise's main target region gets full credit, the synergist group a bit less, and each secondary region less again; a region never gets counted twice for one exercise. The displayed intensity is a visualization scale, not a training prescription — this App tracks coverage, it does not coach.

## Credits

Exercise data, instructions, and translations come from [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset) (MIT). The anatomical body map comes from [`HichamELBSI/react-native-body-highlighter`](https://github.com/HichamELBSI/react-native-body-highlighter) (MIT).

The exercise animations are **© Gym visual — https://gymvisual.com/**, redistributed at 180×180 under a separate licence and shown with that attribution wherever they appear. They are not covered by the MIT licences above; see `gui/data/gym-visual.NOTICE.md`. If you want to reuse them, get your own licence from Gym visual.

App code is MIT. Every upstream licence text, pinned commit, and content hash ships in `gui/data/`.

## Implementation

React + TypeScript + Tailwind CSS + host shadcn components, compiled with `bottega-react-v1`. The host mounts the default component; consistent Base snapshots and mutation transport stay inside `@bottega/app-react`. Pure domain modules keep the six-column schema and completed-only statistics stable. Failed data reads expose a localized shadcn retry button while retaining the last complete snapshot.

## Requirements

The GUI requests append-only Base row insertion. It can add planned rows only; it cannot edit or delete existing rows, import data, or upload attachments.

---

*Architecture notes live next to the code: [`gui/README.md`](gui/README.md) for the surface, [`gui/src/README.md`](gui/src/README.md) for the modules, [`gui/data/README.md`](gui/data/README.md) for the generated data and its provenance.*

## Minimum Bottega version

This release requires Bottega **0.1.3** or later, declared in `app.compat.json`.
Keep this minimum for styling, copy, and business changes that use existing host capabilities. Raise it only when a new host API, package format, or build capability is required, and test against that minimum. Publish the compatible Bottega release before publishing an App that requires it. Editing, rebuilding, and sharing preserve this declaration.
