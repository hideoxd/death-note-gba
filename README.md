# Death Note: Kira Protocol

A retro GBA-style web game built with SvelteKit.

This project blends visual-novel branching dialogue with time and resource management. You play as Kira, balancing alibi, intel gathering, and high-risk judgments while avoiding L's investigation.

## Features

- Retro handheld presentation (240x160 base screen, pixel-art style scaling, CRT overlay)
- Two playable modes:
  - `anime-canon`: strict timeline puzzle with milestone deadlines
  - `divergent`: sandbox branching narrative based on your profile and choices
- Time system with day/block progression (`morning`, `afternoon`, `night`)
- Action economy (2 actions per block)
- Risk model with live suspicion meter and trend tracking
- Data-driven narrative and activities via JSON
- Browser autosave + continue support on title screen
- In-game "How to Play" modal with rules and tips

## Tech Stack

- Svelte 5
- SvelteKit 2
- TypeScript
- Vite 8

## Getting Started

### Prerequisites

- A recent Node.js LTS version (Node 20+ recommended)
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open the local URL shown by Vite (typically `http://localhost:5173`).

### Type and Svelte checks

```bash
npm run check
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## How to Play

### Core loop

1. Start a run from the title screen (`Anime Canon` or `Divergent Story`).
2. Read scene dialogue and pick available choices.
3. Use activity cards to adjust stats and influence risk.
4. Spend your 2 actions for the current block.
5. When actions hit 0, time advances to the next block automatically.

### Important rules

- If suspicion reaches `100%`, you lose immediately.
- Notebook eliminations now require both `true name` and `face` intel per target.
- You can choose a notebook death cause (`heart attack`, `accident`, `poisoning`, `suicide`) to influence risk.
- Notebook writing now consumes `Willpower` and pages; recovery activities refill willpower.
- Safe activities (study/social cover) help stabilize suspicion.
- In `anime-canon`, missing a canon milestone window fractures timeline integrity and causes a canon-failure game over.

### UI quick guide

- Top bar: mode, current day/block, and suspicion level
- Top bar battery icon: current `Willpower`
- Left column: scene, dialogue, and narrative choices
- Right column: time controls, stats, suspicion meter, investigation/write desk, canon tracker, activity log
- World ticker: live timeline feed updates as days pass and targets are eliminated
- Pause button: opens in-game pause menu

### Keyboard shortcuts

- `Enter`: START button emulation (title start/continue, in-game pause toggle)
- `Shift`: SELECT button emulation (title help toggle, in-game log toggle)

## Save Data

- The game autosaves in browser `localStorage` under key `death-note-gba-save-v1`.
- Use `Continue` on title if a snapshot exists.
- Use `Clear Save` on title to remove the snapshot.

## Project Structure

```text
src/
  routes/
    +page.svelte               # Title screen and mode selection
    game/+page.svelte          # Main gameplay screen
    game-over/+page.svelte     # Game-over route
  lib/
    components/                # UI pieces (HUD, shell, narrative, system)
    stores/                    # Svelte stores and derived selectors
    engine/                    # Core game logic (reducer, time, suspicion, canon, effects)
    data/                      # JSON content (activities, milestones, dialogue trees)
    types/                     # TypeScript domain types
    schemas/                   # JSON schemas for game data
```

## Data-Driven Content

Gameplay and narrative are primarily configured through JSON files, including:

- `src/lib/data/activities.json`
- `src/lib/data/canon-milestones.json`
- `src/lib/data/narrative/**`

Schemas are available under `src/lib/schemas/` to keep content consistent.

## Notes

- This is a fan project inspired by Death Note.
- Not affiliated with or endorsed by the original IP owners.
