# Snaketoshi Squares - Architecture

## Overview

This document describes the refactored architecture of Snaketoshi Squares, a spiritual board game inspired by Moksha Patam (Leela/Snakes and Ladders).

## Architecture Goals

1. **Pure game logic** - Game rules isolated in testable functions
2. **Backward compatibility** - Preserve existing squares.json format
3. **Future-ready types** - Normalized naming for future features
4. **Separation of concerns** - UI, game logic, and data are decoupled
5. **Testability** - Core game engine is fully unit tested

## Directory Structure

```
src/
├── lib/
│   ├── gameEngine.ts       # Pure game logic functions
│   ├── gameEngine.test.ts  # Game engine unit tests
│   ├── boardLayout.ts      # Board layout utilities
│   ├── boardAdapter.ts     # Square ↔ Tile conversion
│   ├── youtube.ts          # YouTube URL parsing
│   └── youtube.test.ts     # YouTube utility tests
├── types/
│   └── game.ts             # All game-related types
├── components/game/
│   ├── GameBoard.tsx       # Board rendering (uses boardLayout)
│   ├── SquareModal.tsx     # Square details (uses youtube utils)
│   ├── DiceRoller.tsx      # Dice interface
│   ├── GameLog.tsx         # Event log display
│   └── PlayerSetup.tsx     # Player configuration
├── pages/
│   └── GamePage.tsx        # Game orchestration (uses gameEngine)
└── data/
    └── squares.json        # Board data (72 squares)
```

## Core Concepts

### Game Engine (`src/lib/gameEngine.ts`)

Pure functions that implement all game rules:

- `createGameState()` - Initialize game with players
- `applyRoll()` - Apply a dice roll (main game logic)
- `advanceTurn()` - Move to next player
- `checkWinCondition()` - Detect if player reached square 72
- `checkTransition()` - Detect snake/ladder at a square
- `movePlayer()` - Update player position
- `applyTransition()` - Apply snake/ladder movement

**Key characteristics:**
- All functions are pure (no side effects)
- State is immutable (returns new state)
- Fully unit tested
- No UI dependencies

### Type System

#### Legacy Types (backward compatible)
- `Square` - Original format from squares.json (uses `video`, `snake`, `ladder`)

#### Future-Ready Types
- `Tile` - Normalized format (uses `videoUrl`, `snakeTo`, `ladderTo`)
- `Board` - Collection of tiles + metadata
- `GameState` - Complete game state (players, turn, events, winner)
- `GameEvent` - Immutable log entry
- `Player` - Player identity + position
- `RollResult` - Result of applying a dice roll

### Data Adapters (`src/lib/boardAdapter.ts`)

Convert between legacy and future formats:

- `squareToTile()` - Square → Tile
- `tileToSquare()` - Tile → Square
- `createBoardFromSquares()` - Load board from squares.json
- `getBoardSquares()` - Get legacy format for UI components

This allows gradual migration without breaking existing code.

### Board Layout (`src/lib/boardLayout.ts`)

Serpentine board layout logic:

- 72 squares, 8 rows × 9 columns
- Bottom row (1-9) goes left to right
- Next row (10-18) goes right to left
- Alternating pattern continues

Functions:
- `layoutBoard()` - Convert flat array to 2D grid for rendering
- `getSquarePosition()` - Get row/col for a square number
- `isRowBoundary()` - Check if square is on row boundary
- `isFinalSquare()` - Check if square is 72 (Moksha)

### YouTube Utilities (`src/lib/youtube.ts`)

Parse YouTube URLs:

- `extractYouTubeId()` - Extract video ID from various URL formats
  - youtube.com/watch?v=VIDEO_ID
  - youtu.be/VIDEO_ID
  - youtube.com/embed/VIDEO_ID
  - Handles query parameters
- `createEmbedUrl()` - Create embed URL with optional autoplay
- `isYouTubeUrl()` - Validate YouTube URL

## Game Flow

### 1. Game Setup
```
PlayerSetup → handleStartGame() → createGameState()
```

### 2. Player Turn
```
DiceRoller → handleRoll() → applyRoll() → updates GameState
                                         ↓
                              Shows SquareModal
                                         ↓
                              Modal Close → advanceTurn()
```

### 3. Snake/Ladder Transition
```
applyRoll() detects transition → returns RollResult with transition
                                         ↓
              setTimeout 1.5s → applyTransition() → moves player
```

### 4. Win Condition
```
applyRoll() → checkWinCondition() → sets GameState.winner
                                         ↓
            handleCloseModal() → shows alert
```

## Component Responsibilities

### GamePage (Orchestration)
- Manages game state
- Handles player input (dice rolls)
- Shows/hides modal
- Applies transitions with delays
- Detects winners

### GameBoard (Pure Rendering)
- Receives squares + players
- Uses `layoutBoard()` for serpentine layout
- Displays player tokens
- Highlights current player

### SquareModal (Pure UI)
- Displays square details
- Uses `extractYouTubeId()` for video embed
- Play/Skip video controls
- Snake/ladder alerts

### DiceRoller (Input)
- Auto-roll with animation
- Manual entry (1-6)
- Disabled during roll or modal

### GameLog (Display)
- Shows event history
- Color-coded by player
- Snake/ladder indicators

## Testing

### Game Engine Tests (`gameEngine.test.ts`)

Covers all critical game logic:
- ✅ Normal roll
- ✅ Roll capped at 72
- ✅ Snake transition detection
- ✅ Ladder transition detection
- ✅ Turn advancement
- ✅ Winner detection
- ✅ State immutability
- ✅ Edge cases (no players, invalid rolls)

### YouTube Tests (`youtube.test.ts`)

Covers URL parsing:
- ✅ All URL formats
- ✅ Query parameters
- ✅ Invalid URLs
- ✅ Embed URL creation

Run tests:
```bash
npm test
```

## Future Enhancements

### Ready for Backend
The architecture is prepared for:
- **Real-time multiplayer** - GameState can be synced via WebSocket/Nostr
- **Game persistence** - GameState serializes to JSON
- **Replay system** - GameEvent log enables replay
- **Undo/Redo** - Immutable state enables time travel

### Migration Path
To migrate fully to new types:
1. Update squares.json to use `videoUrl`, `snakeTo`, `ladderTo`
2. Remove adapter layer
3. Update components to use Tile directly

## Design Decisions

### Why Pure Functions?
- Easy to test
- Easy to reason about
- No hidden state
- Composable
- Deterministic

### Why Immutable State?
- Time travel debugging
- Easy undo/redo
- Predictable updates
- Safe concurrent updates
- React-friendly

### Why Backward Compatibility?
- Don't break existing squares.json
- Gradual migration
- Zero-downtime refactor
- Easy rollback

### Why Type Adapters?
- Bridge old and new
- Enable incremental migration
- Isolate breaking changes
- Test new types before full migration

## Performance Considerations

- Game engine functions are O(n) or better
- Board layout is computed once, cached in UI
- State updates are shallow copies (fast)
- No unnecessary re-renders (React.memo where needed)

## Conclusion

This refactor achieves:
- ✅ Scalable architecture
- ✅ 100% backward compatible
- ✅ Fully tested game logic
- ✅ Separation of concerns
- ✅ Future-ready for backend
- ✅ No behavior changes

The game plays identically to before, but is now ready to scale.
