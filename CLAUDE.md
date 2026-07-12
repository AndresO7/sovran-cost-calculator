# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run all tests (vitest)
```

Run a single test file:
```bash
npx vitest run app/calculator/__tests__/pricing.test.ts
```

## Architecture

This is a **3D cost calculator** for luxury home extensions (Sovran Group, London). Users configure an extension in 3D and get a live price estimate.

### Core Flow

```
StartScreen → BEGIN action → Calculator (TopBar + Scene + ConfigPanel) → QuoteModal
```

### Key Directories

- `app/calculator/` — Main calculator feature
  - `config.ts` — **Single source of truth** for the host house (`HOUSE`), options, dimensions, and all pricing (GBP)
  - `state.ts` — `CalculatorState` type + `reducer` for all state transitions
  - `pricing.ts` — `calculatePrice(state)` derives total from state; pure function
  - `Scene.tsx` — Three.js canvas (client-only via `dynamic` import with `ssr: false`)
  - `Calculator.tsx` — Main orchestrator with GSAP entrance animations
  - `models/` — Procedural 3D models (House, Extension, Loft, Garden)
  - `models/materials.ts` — Procedural canvas textures with metric tiling (`metricMaterial()`)
  - `ui/` — UI components (TopBar, ConfigPanel, QuoteModal, StartScreen, controls)

### State Management

Uses React's `useReducer` with a discriminated union action type. All state flows through `app/calculator/state.ts`. No external state library.

### 3D Rendering

- **React Three Fiber** (`@react-three/fiber`) + **Drei** (`@react-three/drei`)
- All textures are **procedurally generated** on canvas — no external image assets
- `metricMaterial(id, width, height)` creates materials that tile at real-world scale
- `TILE_METRES = 1.6` defines the physical size of one texture repeat
- Model components receive state props and render geometry with `<mesh>` elements

### Fonts

Three font families loaded via `next/font/google` in `app/layout.tsx`:
- **Outfit** (primary sans) — body text, UI
- **Bodoni Moda** (serif) — headings, wordmark, prices
- **Inter Tight** (bold sans) — start screen headings

### Styling

- Tailwind CSS 4 for utility classes
- CSS custom properties in `globals.css` for brand colors (`--background`, `--foreground`, `--accent`, `--muted`)
- Calculator layout uses custom CSS classes (`.calc-root`, `.calc-body`, `.calc-viewport`, `.calc-panel`)

## Patterns

- **Pricing changes**: Update `config.ts` only — `calculatePrice()` derives from it
- **New option type**: Add type to `config.ts`, add to `CalculatorState` in `state.ts`, add reducer case, wire up UI
- **New 3D model variant**: Create component in `models/`, use `metricMaterial()` for surfaces
- **Extension placement**: the extension always spans the full width of the house — sizes (S/M/L) only vary the depth into the garden
