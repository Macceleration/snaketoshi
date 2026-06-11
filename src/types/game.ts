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
  tags?: string[];
  interfaithReferences?: InterfaithReference[];
  memeEncounters?: MemeEncounter[];
  marketCycleLabel?: string;
}

// Interfaith reference
export interface InterfaithReference {
  tradition: string;
  reference: string;
  quote: string;
  commentary: string;
}

// Meme encounter
export interface MemeEncounter {
  caption: string;
  prompt: string;
  imageUrl?: string; // Optional: for when actual meme is generated
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
  tags?: string[]; // e.g. ["wisdom", "transformation", "shadow work"]
  interfaithReferences?: InterfaithReference[];
  memeEncounters?: MemeEncounter[];
  marketCycleLabel?: string; // e.g. "Bubble Peak", "Capitulation", "Accumulation"
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

// Game phase for turn management
export type GamePhase = 'awaiting_roll' | 'encounter' | 'complete';

// Complete game state
export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  events: GameEvent[];
  roomId?: string;
  isMultiplayer: boolean;
  winner?: string; // player id of winner
  phase?: GamePhase; // Current phase of the turn
  pendingTransition?: {
    type: 'snake' | 'ladder';
    from: number;
    to: number;
  };
  pendingEventId?: string; // ID of the event awaiting acknowledgment
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
