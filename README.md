# Vice Got a Price! — The Leonida Platinum Companion

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sugarrush1932/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sugarrush1932/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI,
entered in the [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) bounty on make.fun.

## What it is

- **The full official list.** All 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze,
  28 hidden — with the official name, description and grade shown exactly as PlayStation
  publishes them, plus each trophy's launch earn rate from Exophase.
- **A cited guide to every trophy.** What to do, where and when, written for this
  companion in our own words, with the sources named beside each guide. Steps are only
  stated where a source supports them; where a method is still unconfirmed at launch,
  the guide says so.
- **A seven-stage platinum roadmap**, built from the official descriptions: story first
  (with the chapter-save discipline this no-replay game demands), then partners and
  strangers, the robbery circuit, activities and feats, the collectible and money
  sweeps, and the 100% push.
- **Missables, flagged honestly.** One launch-confirmed missable — the Chapter 1 balcony
  meditation inside Positive Mental Attitude — plus three cautions, each with its source.
- **A real tracker.** Tick trophies off; progress is saved in the browser
  (localStorage) and can be exported to a file and imported back. Filters by kind
  (story, missable, collectibles, activities and more), grade and search; a spoiler
  shield hides hidden trophies until you earn them.

## Layout

- `app/` — the static guide (no build step, no network): `index.html`, `style.css`,
  `app.js`, `render.js`, and `data/trophies.json` with the trophies, roadmap and sources.
- `screenshots/` — the maker's own renders of the app; `shots.json` names the scenes.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output and
  writes `dossier.json` with the vendored library in `vendor/` (the kit's own copy).
- `serve.ts` — serve the guide locally at http://localhost:8080.
- `take-screenshots.mjs` — re-render the screenshots from `shots.json`.

## Run it

```
node serve.ts            # then open http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in output
```

An unofficial fan companion. Not affiliated with Rockstar Games or PlayStation.
