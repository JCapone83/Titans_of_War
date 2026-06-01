# Titans of War

Titans of War is a historical educational strategy game about Civil War command decisions, logistics, morale, cabinet pressure, and alternate-history campaign outcomes.

The game is local-first. It runs in scripted deterministic mode without any AI service, and it can optionally use a local Ollama model as a decision/generation layer when one is available.

## Basic Facts

- Genre: historical educational strategy game
- Focus: command tradeoffs, campaign pressure, and alternate-history branching
- Era: American Civil War campaign scenarios
- Runtime: browser app built with React and Vite
- AI requirement: none; local Ollama support is optional
- Release channel: GitHub-first open source project
- Code license: MIT
- Media license: separate per asset; see `NOTICE` and the media manifests

## Features

- Authored campaign scenarios with deterministic fallback play
- Seeded simulation runs for reproducible outcomes
- Strategic Stability Index scoring at campaign end
- Cabinet, morale, munitions, treasury, and military-pressure mechanics
- Campaign auto-save plus JSON import/export
- Markdown chronicle export
- Headless benchmark CLI for strategy-policy comparisons
- Optional local Ollama model discovery and turn generation

## Requirements

- Node.js 20+
- npm 10+
- Optional: Ollama on `http://localhost:11434`

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

Run checks:

```bash
npm test
npm run validate-assets
npm run build
```

Run a deterministic benchmark:

```bash
npm run benchmark -- --policies balanced,hotspur,fox,wolf --seeds 1861,1862,1863
```

Benchmark installed local Ollama chat models:

```bash
npm run benchmark -- --models installed --seeds 1861,1862
```

## Local AI

Titans of War does not need a model to run. If Ollama is installed, the in-app local AI portal can discover installed chat models and use one for scenario generation or decision selection. If Ollama is unavailable, the game reports that clearly and continues with scripted campaign logic.

## Media Policy

The source code is MIT licensed. Historical images, audio recordings, and other media keep their own rights status.

Verified public-domain or permissively licensed assets are documented in:

- `src/game/mediaCatalog.js`
- `src/game/audioCatalog.js`
- `src/game/historicalAssetManifest.js`
- `docs/media-sourcing.md`
- `docs/historical_assets_curation.md`
- `NOTICE`

Assets marked `needs-review` or `recording-needed` are not public release assets. They are placeholders or sourcing targets until provenance is resolved.

## Project Structure

```text
src/
  App.jsx                     Main gameplay UI
  components/                 Tactical map and scenario theater UI
  engine/                     Optional local model and audio managers
  game/                       Scenario data, simulation engine, storage, catalogs
scripts/
  benchmark-engine.mjs        Headless benchmark runner
  smoke-test.mjs              Dependency-free smoke checks
  validate-content.mjs        Scenario/catalog validation
  validate-assets.mjs         Media manifest validation
docs/
  historical_assets_curation.md
  media-sourcing.md
```

## Contributing

Good first contribution areas:

- New historically grounded scenarios
- More tests for engine math and state transitions
- Save/load UX improvements
- Campaign-end summary improvements
- Accessibility and performance work
- Verified public-domain or permissively licensed media sourcing

Before opening a change:

```bash
npm test
npm run validate-assets
npm run build
```

## License

Code is released under the MIT License. See `LICENSE`.

Media assets are not automatically covered by MIT. See `NOTICE`.
