// Legacy Square type (from squares.json)
export interface Square {
  number: number;
  title: string;
  sanskrit: string;
  meaning: string;
  reflection: string;
  video: string | null;
  snake: number | null;
  ladder: number | null;
}

// Future-ready Tile type (normalized naming)
export interface Tile {
  number: number;
  title: string;
  sanskrit: string;
  meaning: string;
  reflection: string;
  videoUrl: string | null;
  snakeTo: number | null;
  ladderTo: number | null;
}

// Board represents the complete game board
export interface Board {
  tiles: Tile[];
  totalSquares: number;
}

// Player identity (immutable player info)
export interface PlayerIdentity {
  id: string;
  name: string;
  color: string;
}

// Player state (identity + position)
export interface Player extends PlayerIdentity {
  position: number;
}

// Game event (immutable log entry)
export interface GameEvent {
  id: string;
  playerId: string;
  playerName: string;
  roll: number;
  fromSquare: number;
  toSquare: number;
  finalSquare?: number;
  hasSnake?: boolean;
  hasLadder?: boolean;
  timestamp: number;
}

// Legacy GameLog type (alias for backward compatibility)
export type GameLog = GameEvent;

// Complete game state
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  events: GameEvent[];
  roomId?: string;
  isMultiplayer: boolean;
  winner?: string; // player id of winner
}

// Room info for multiplayer
export interface GameRoom {
  id: string;
  players: PlayerIdentity[];
  createdAt: number;
}

// Result of applying a roll
export interface RollResult {
  updatedState: GameState;
  event: GameEvent;
  transition?: {
    type: 'snake' | 'ladder';
    from: number;
    to: number;
  };
}
