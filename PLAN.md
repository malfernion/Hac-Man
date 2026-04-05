# Hac-Man: Comprehensive Development Plan

## Status
- [ ] Phase 0: Foundation (TypeScript, tile grid, movement rewrite, hooks, touch, game loop extraction, Playwright)
- [ ] Phase 1: Ghost infrastructure (state, rendering, house)
- [ ] Phase 2: Ghost AI (targeting, mode machine, movement)
- [ ] Phase 3: Ghost–player interaction (eating, death, game over)
- [ ] Phase 4: Level progression (params, transitions, multi-level)
- [ ] Phase 5: Polish (audio, score popups, fruit, high score)

---

## Architecture Decisions

### Tech Stack
- **TypeScript** throughout (already in devDeps)
- **React functional components + hooks** (migrated from classes)
- **Redux** with ghosts slice added
- **Canvas** two-layer rendering (keep)
- **Pointer Events API only** for input (drop all touch events)
- **Playwright** for E2E browser testing

### Wall Sticking Root Cause & Fix
The original AABB wall collision used `snapStopCoordToRail` which could round a stop position to the wrong rail coordinate, placing the character inside a wall. The tile grid approach eliminates this entirely: when blocked, the character stops at the exact tile center (`col * 28 + 14`), which is always an integer and always valid.

### Touch Controls Root Cause & Fix
Mixed `onPointerDown/Up` + `onTouchStart/End` handlers caused double-firing and missing `onTouchCancel` left stale swipe state. Fix: delete all touch event handlers, use only Pointer Events API, add `touch-action: none` CSS.

---

## Testing Strategy

### Layer 1: Unit tests (Jest) — pure functions
- All ghost targeting functions (100+ cases)
- `chooseBestDirection` with various grids
- Tile↔pixel conversions
- BFS pathfinding
- Mode transition logic

### Layer 2: Simulation tests (Jest, no DOM)
Pure `tickGameState(state, deltaMs)` function enables headless game loop testing:
- Player never enters a WALL tile (regression for wall sticking)
- Ghost positions always valid over 10 simulated seconds
- Power mode expiry timing
- Ghost mode transitions at correct times

### Layer 3: E2E tests (Playwright)
Tests in `e2e/` directory against dev server:
- Game renders, keyboard starts game
- Player moves and collects coins
- Player cannot pass through walls
- Touch/swipe input works correctly
- Ghosts appear, turn blue on power pill
- Ghost eating gives score, life loss on normal ghost touch
- Game over screen appears after 3 deaths

---

## Phase 0: Foundation

### 0a — TypeScript migration
- Add `tsconfig.json`  
- Add `@types/react-dom`, `@types/react-redux` to package.json devDeps
- Rename source files `.tsx`/`.ts`

### 0b — Core types (`src/types.ts`)
All shared interfaces: `Direction`, `GhostId`, `GhostMode`, `Tile` enum, `Position`, `TileCoord`, `PlayerState`, `GhostState`, `GhostsSlice`, `LevelDefinition`, `ComputedLevel`, `LevelParams`, `GameInfoState`, `ScorePopup`, `RootState`

### 0c — Tile grid level format (`src/data/levels.ts`)
Keep wall-rectangle format for backward rendering compatibility. Add:
- `ghostHouseArea`: interior bounds (cols 11-17, rows 12-15)
- `ghostDoorTiles`: [{col:13,row:11},{col:14,row:11},{col:15,row:11}]
- `tunnelRow`: 14
- `ghostStarts`: Blinky(14,10), Pinky(14,13), Inky(12,13), Clyde(16,13)
- `playerStart`: {col:14, row:22}
Level reducer computes `Tile[][]` grid from this at load time.

### 0d — Tile helpers (`src/helpers/tileHelpers.ts`) — test first
Pure functions, 100% covered:
- `pixelToTile`, `tileToPixel`
- `stepTile`, `reverseDirection`, `wrapTile`
- `getTileAt`, `isWalkable`
- `euclideanDistance`, `manhattanDistance`
- `computeGrid` (walls→Tile[][])
- `bfsPath` (BFS for eaten ghost return)

### 0e — Movement rewrite (`src/helpers/movementHelpers.ts`) — test first
Replace AABB wall-rectangle collision with tile-grid O(1) lookup.
**Wall-sticking fix**: when blocked, stop at tile CENTER (always integer coords: col*28+14).
- `moveCharacter(pos, direction, speed, deltaMs, grid, isGhost)`
- `canChangeDirection(pos, nextDir, grid, isGhost)`
- Regression test suite: every wall-approach scenario asserts player never inside WALL tile

### 0f — Component migration
Convert class components to functional hooks:
- `App.tsx`, `GameBoard.tsx`, `GameBackground.tsx`, `GameAudio.tsx`, `GameInfo.tsx`, `TextLayer.tsx`

### 0g — Touch controls rewrite (`src/hooks/useInput.ts`)
Single unified Pointer Events hook:
- Tracks one active pointer via `setPointerCapture`
- Swipe threshold: 40px (up from 24)
- Direction buttons: `onPointerDown` only
- No touch event handlers anywhere
- CSS: `touch-action: none` on game container

### 0h — Extract game loop (`src/gameLoop.ts`)
Pure `tickGameState(state: RootState, deltaMs: number): Partial<RootState>` function.
Enables simulation tests without DOM.

### 0i — Playwright setup
- Install `@playwright/test`
- `playwright.config.ts` with `webServer` pointing at dev server
- Baseline E2E suite: smoke tests establishing regression baseline

---

## Phase 1: Ghost Infrastructure

### 1a — Ghost Redux slice (`src/reducers/ghostsReducer.ts`)
4 ghost objects + global mode timer + eat combo counter.

### 1b — Ghost rendering (procedural, no new assets)
- Normal: rounded rect body + directional eyes
- Frightened: blue body, white "teeth" squiggles
- Frightened flashing: alternates at 4Hz in last 2s of power mode
- Eaten: eyes only
Added to `GameBoard.tsx` foreground canvas.

### 1c — Ghost house + release logic
- GHOST_HOUSE tiles: cols 11-17, rows 12-15
- GHOST_DOOR tiles: cols 13-15, row 11
- `home` mode: bounce vertically in house
- `leaving` mode: move to door tile, then join game
- Dot counter per ghost; force-release timer (4s without dot eaten)

---

## Phase 2: Ghost AI

### 2a — Ghost helper functions (`src/helpers/ghostHelpers.ts`) — test first
All targeting pure functions:

**Blinky** (red): target = player's current tile  
**Pinky** (pink): target = 4 tiles ahead (UP: 4 up + 4 left, classic overflow)  
**Inky** (cyan): target = 2×(2-ahead-of-player − blinky_pos) vector  
**Clyde** (orange): >8 tiles away → blinky target; ≤8 tiles → home corner  

**`chooseBestDirection`**: enumerate valid dirs (not reverse, not wall, not unauthorized ghost house entry), pick closest to target by Euclidean distance, tiebreak UP>LEFT>DOWN>RIGHT

### 2b — Global mode state machine
Level 1: Scatter 7s→Chase 20s→Scatter 7s→Chase 20s→Scatter 5s→Chase 20s→Scatter 5s→Chase∞  
On phase change: all non-frightened ghosts reverse direction.

### 2c — Ghost movement in game loop
Each frame per ghost:
1. Move toward next tile center by speed×deltaMs
2. At tile center: recalculate target, call `chooseBestDirection`, set direction
3. Frightened: random valid direction at each tile center
4. Eaten: follow BFS path back to ghost house

### 2d — Speed table
Ghost speeds by level and mode (fraction of base 7.5 tiles/sec):
- Normal: 75% L1 → 95% L5+
- Frightened: 50% all levels
- Eaten/Eyes: 150% all levels  
- In tunnel: 40% all levels

---

## Phase 3: Ghost–Player Interaction

### 3a — Collision detection
Per-frame AABB check, 12px radius. Ghost `scatter/chase` = player dies. Ghost `frightened` = ghost eaten. Ghost `eaten` = no collision.

### 3b — Ghost eating
Score: 200→400→800→1600 (consecutive in one power mode). Brief 200ms freeze. Score popup at ghost position. Ghost→`eaten` mode, eyes navigate home via BFS.

### 3c — Player death sequence
All ghosts freeze. Death animation 1.5s. Lives decrement. If lives>0: reset positions. If lives===0: game over state.

### 3d — Game over screen (`src/components/GameOver.tsx`)
Overlay with score, high score, restart button. Playwright test verifies appearance.

---

## Phase 4: Level Progression

### 4a — Level params (`src/data/levelParams.ts`)
Per-level lookup: player speed, ghost speed, frightened duration, scatter durations, Elroy thresholds, bonus fruit.

### 4b — Level transition
Flash animation → pause → `levelIndex++` → reset grid/coins/player/ghosts → apply new params → show stage name.

### 4c — Multiple levels
3+ level definitions (same maze, increasing difficulty). Level 1 params intentionally forgiving.

---

## Phase 5: Polish

- Score popups (floating text on ghost eat)
- Bonus fruit (after 70 and 170 dots)
- Siren pitch variation (3 thresholds by dot count)
- Frightened audio track (loop during power mode)
- Ghost eaten sound
- Extra life at 10,000 points
- High score via localStorage
- Cruise Elroy (Blinky speed boost at 20/10 dots remaining)

---

## File Map

| File | Status |
|------|--------|
| `src/types.ts` | New |
| `src/gameLoop.ts` | New |
| `src/gameLoop.test.ts` | New |
| `src/data/levels.ts` | Rewrite |
| `src/data/levelParams.ts` | New |
| `src/store.ts` | Port to TS |
| `src/reducers/ghostsReducer.ts` | New |
| `src/reducers/gameInfoReducer.ts` | Extend |
| `src/reducers/levelReducer.ts` | Extend |
| `src/reducers/playerReducer.ts` | Port to TS |
| `src/reducers/rootReducer.ts` | Extend |
| `src/actions/ghostActions.ts` | New |
| `src/helpers/tileHelpers.ts` | New |
| `src/helpers/ghostHelpers.ts` | New |
| `src/helpers/movementHelpers.ts` | Rewrite |
| `src/helpers/collisionHelpers.ts` | Port + extend |
| `src/helpers/animationHelpers.ts` | Port to TS |
| `src/hooks/useInput.ts` | New |
| `src/hooks/useGameLoop.ts` | New |
| `src/App.tsx` | Rewrite (hooks) |
| `src/components/GameBoard.tsx` | Extend (ghosts) |
| `src/components/GameBackground.tsx` | Port |
| `src/components/GameAudio.tsx` | Extend |
| `src/components/GameInfo.tsx` | Port |
| `src/components/GameOver.tsx` | New |
| `src/components/TextLayer.tsx` | Port |
| `playwright.config.ts` | New |
| `e2e/gameplay.spec.ts` | New |
| `e2e/touch.spec.ts` | New |
| `e2e/ghosts.spec.ts` | New |
