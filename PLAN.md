# Hac-Man Feature Review & Forward-Looking Completion Plan

## Scope
This document reviews the current codebase and proposes a phased, test-driven plan to complete the game feature set, with forward-looking support for power pills and ghosts (rendering, AI, and turn-taking). It covers controls, rendering, data, animations, win/score logic, and performance considerations.

---

## Current Feature Review

### Core Gameplay Loop
- The main loop runs via `requestAnimationFrame` and advances player movement, checks collisions with walls and coins, and triggers level completion when coins are exhausted.
- Game start is triggered by the first directional input, with an intro audio sequence before the game actually runs.

### Controls
- Keyboard input supports arrow keys and WASD; `R` resets game/player/level state.
- Direction queuing is supported (next direction is buffered until it can be changed without collision).

### Rendering
- Two-canvas approach:
  - Background canvas renders the maze walls and supports flashing animation on level completion.
  - Foreground canvas renders player sprite and coin dots each frame.
- This separation is efficient and appropriate for a tile-based arcade game.

### Data & Level Modeling
- Levels are defined as a single level in `data/levels.js` with wall rectangles and coin coordinates.
- Level data is scaled to board pixel units on initialization in the reducer.

### Animations
- Player uses a sprite sheet with directional frames and cycles on movement.
- Wall flashing is handled via timed color swaps on level completion.

### Win/Score Logic
- Score increments by 10 per coin.
- Level completion is triggered when the last coin is collected.
- Lives/kill count are tracked in state but not yet used by gameplay.

### Missing / Incomplete Features
- Ghosts are not implemented (data has `ghosts: []`, but no rendering or AI).
- Power pills (energizers) do not exist.
- No explicit game-over or life-loss flow besides a `showGameOver` flag and `lives` counter.
- No level progression beyond level 1.

### Performance Notes
- Canvas redraws happen every frame for the foreground (player+coins) and only when needed for the background. This is good.
- There is no entity batching or dirty-rect optimization; likely not needed until more entities are introduced.

---

## Forward-Looking Completion Plan (TDD-Oriented)

### Phase 0 — Test Harness & Baselines (TDD Foundation)
**Goal:** Establish reliable unit tests for core logic to support feature expansion.

**Work items**
- Add Jest tests for helper functions:
  - `collisionHelpers`: wall collision and coin collision.
  - `movementHelpers`: next position calculation, bounds wrapping, direction change logic.
- Add reducer tests for `playerReducer`, `gameInfoReducer`, and `levelReducer`:
  - movement, direction buffering, reset paths
  - score updates, intro state transitions
  - coin collection and level reset

**Tests (TDD-first)**
- `hasWallCollision` returns true/false for known wall/position cases.
- `findCollidingCoin` returns correct coin or undefined.
- `checkAndTransformIntoBounds` wraps on all sides.
- Reducer state transitions (action -> expected state).

---

### Phase 1 — Entity Modeling & Rendering Layer Extensions
**Goal:** Establish formal entity types (player, ghosts, power pills) with rendering and shared logic.

**Work items**
- Introduce a generic entity model (position, size, direction, speed, sprite frames).
- Add a `PowerPill` type to level data alongside `coins`.
- Add ghost entities to level data (initial positions and behaviors).
- Extend `GameBoard` rendering to draw:
  - Ghost sprites
  - Power pills (larger pellets)
  - Optional debug visuals for bounding boxes (toggle-able)

**Tests (TDD-first)**
- Entity factory/unit tests for initialization.
- Rendering tests (snapshot-like) can be minimal or stubbed due to canvas limitations (e.g., test the render loop calls drawing functions with correct values).

---

### Phase 2 — Power Pill Mechanics & Player State
**Goal:** Implement energizer logic (power pill consumption and scared state).

**Work items**
- Add power pill collision detection.
- Add player state: `poweredUp` with a timer duration.
- Update audio/sfx (optional) for power mode.
- Modify scoring logic to allow ghost kill multipliers while powered.

**Tests (TDD-first)**
- Power pill consumption removes it from level data.
- Power pill sets `poweredUp` state for N seconds.
- Scoring during powered state follows expected multiplier sequence.

---

### Phase 3 — Ghost AI & Turn-Taking Logic
**Goal:** Implement ghost movement, turn-taking, and behavioral states.

**Work items**
- Define ghost states: `chase`, `scatter`, `frightened`, `eaten`.
- Implement turn-taking and intersection decision logic:
  - Identify intersections based on wall layout.
  - Choose valid direction based on AI state.
- Implement collision logic between player and ghosts:
  - Normal: player loses life / game over.
  - Powered: ghost becomes `eaten` and returns to home.
- Add per-ghost behavior configuration (e.g., classic Pac-Man targeting).

**Tests (TDD-first)**
- Ghost movement respects walls and bounds.
- Ghost state transitions follow timers and conditions.
- Player/ghost collision yields correct state changes.
- Ghost returns home when eaten.

---

### Phase 4 — Level Progression, Game Flow, and UI
**Goal:** Complete game loop with multi-level support and polish.

**Work items**
- Add multiple levels in data and progression rules.
- Improve game flow transitions:
  - Stage intro screen timing
  - Level complete animation
  - Game over screen
- Add UI indicators for power mode and ghost states.

**Tests (TDD-first)**
- Level progression increments correctly and resets per-level state.
- Game over triggers when lives reach zero.
- Stage transitions set proper UI flags.

---

### Phase 5 — Performance and Visual Quality Enhancements
**Goal:** Optimize rendering and improve visuals while preserving correctness.

**Work items**
- Implement dirty-rect optimization for coin rendering (optional).
- Smooth animation timing for ghost/player (consistent frame rate).
- Improve sprite art and add animation frames for ghosts and power pills.

**Tests (TDD-first)**
- Performance measurement harness (lightweight): run N frames and ensure no frame-time regressions beyond threshold.
- Visual regression: optional image snapshots if canvas testing infra is added later.

---

## Additional Notes / Risks
- Canvas rendering remains appropriate, but ghost count or effects might eventually push toward a sprite renderer or WebGL; plan keeps data/logic separate to ease migration.
- TDD for canvas drawing should focus on logic and calls rather than pixel-perfect assertions, unless a screenshot-based test setup is introduced later.

---

## Definition of Done (Feature Completion)
- Player, coins, power pills, and ghosts are all implemented and interact correctly.
- Game flow includes intro, play, power mode, frightened ghosts, level completion, and game over.
- Unit tests cover core movement, collision, state transitions, and scoring.
- Level progression and UI states are complete.

