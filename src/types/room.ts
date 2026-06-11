import type { GameState, Player, GameEvent } from './game';

/**
 * Room player - includes connection status
 */
export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  nostrPubkey?: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number;
}

/**
 * Room status
 */
export type RoomStatus = 'lobby' | 'active' | 'complete';

/**
 * Game room
 */
export interface GameRoom {
  id: string;
  code: string; // Short join code (e.g. "ABC123")
  boardId: string; // "default" for now
  hostId: string;
  status: RoomStatus;
  players: RoomPlayer[];
  gameState: GameState | null;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Room event types
 */
export type RoomEventType =
  | 'room_created'
  | 'player_joined'
  | 'player_left'
  | 'game_started'
  | 'roll_submitted'
  | 'game_completed';

/**
 * Room event
 */
export interface RoomEvent {
  id: string;
  roomId: string;
  type: RoomEventType;
  playerId?: string;
  playerName?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Room subscription callback
 */
export type RoomSubscriptionCallback = (room: GameRoom) => void;

/**
 * Room adapter interface
 * Abstracts the storage/sync mechanism (local, WebSocket, Nostr, etc.)
 */
export interface RoomAdapter {
  /**
   * Create a new room
   */
  createRoom(boardId: string, hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>): Promise<GameRoom>;

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, player: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>): Promise<GameRoom>;

  /**
   * Leave a room
   */
  leaveRoom(roomId: string, playerId: string): Promise<void>;

  /**
   * Start the game (host only)
   */
  startRoom(roomId: string): Promise<GameRoom>;

  /**
   * Submit a dice roll (current player only)
   */
  submitRoll(roomId: string, playerId: string, roll: number): Promise<GameRoom>;

  /**
   * Get current room state
   */
  getRoom(roomId: string): Promise<GameRoom | null>;

  /**
   * Subscribe to room updates
   */
  subscribeToRoom(roomId: string, callback: RoomSubscriptionCallback): () => void;

  /**
   * Unsubscribe from all room updates
   */
  cleanup(): void;
}
