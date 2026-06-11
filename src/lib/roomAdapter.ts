import type { RoomAdapter, GameRoom, RoomPlayer, RoomSubscriptionCallback } from '@/types/room';
import type { GameState, Player } from '@/types/game';
import { createGameState, applyRoll, advanceTurn } from './gameEngine';
import { createBoardFromSquares } from './boardAdapter';
import squaresData from '@/data/squares.json';

/**
 * Generate a short room code (6 characters)
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique room ID
 */
function generateRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Local room adapter using localStorage and BroadcastChannel
 * for same-browser multi-tab testing
 */
export class LocalRoomAdapter implements RoomAdapter {
  private rooms: Map<string, GameRoom> = new Map();
  private subscriptions: Map<string, Set<RoomSubscriptionCallback>> = new Map();
  private broadcastChannel: BroadcastChannel;
  private storageKey = 'snaketoshi-rooms';

  constructor() {
    this.broadcastChannel = new BroadcastChannel('snaketoshi-room-sync');
    this.loadFromStorage();
    this.setupBroadcastListener();
    this.setupStorageListener();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const roomsData = JSON.parse(stored) as GameRoom[];
        roomsData.forEach(room => {
          this.rooms.set(room.id, room);
        });
      }
    } catch (error) {
      console.error('Failed to load rooms from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const roomsArray = Array.from(this.rooms.values());
      localStorage.setItem(this.storageKey, JSON.stringify(roomsArray));
    } catch (error) {
      console.error('Failed to save rooms to storage:', error);
    }
  }

  private setupBroadcastListener() {
    this.broadcastChannel.onmessage = (event) => {
      const { type, roomId, room } = event.data;
      
      if (type === 'room-update' && roomId && room) {
        this.rooms.set(roomId, room);
        this.notifySubscribers(roomId, room);
      }
    };
  }

  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        this.loadFromStorage();
      }
    });
  }

  private broadcastRoomUpdate(roomId: string, room: GameRoom) {
    this.broadcastChannel.postMessage({ type: 'room-update', roomId, room });
  }

  private notifySubscribers(roomId: string, room: GameRoom) {
    const callbacks = this.subscriptions.get(roomId);
    if (callbacks) {
      callbacks.forEach(callback => callback(room));
    }
  }

  private updateRoom(room: GameRoom) {
    this.rooms.set(room.id, room);
    this.saveToStorage();
    this.broadcastRoomUpdate(room.id, room);
    this.notifySubscribers(room.id, room);
  }

  async createRoom(
    boardId: string,
    hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>
  ): Promise<GameRoom> {
    const roomId = generateRoomId();
    const code = generateRoomCode();

    const player: RoomPlayer = {
      ...hostPlayer,
      isHost: true,
      isConnected: true,
      joinedAt: Date.now(),
    };

    const room: GameRoom = {
      id: roomId,
      code,
      boardId,
      hostId: player.id,
      status: 'lobby',
      players: [player],
      gameState: null,
      createdAt: Date.now(),
    };

    this.updateRoom(room);
    return room;
  }

  async joinRoom(
    roomId: string,
    player: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'>
  ): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'lobby') {
      throw new Error('Cannot join room - game already started');
    }

    // Check if player already in room
    const existingPlayer = room.players.find(p => p.id === player.id);
    if (existingPlayer) {
      // Reconnect
      existingPlayer.isConnected = true;
      this.updateRoom(room);
      return room;
    }

    if (room.players.length >= 6) {
      throw new Error('Room is full');
    }

    const newPlayer: RoomPlayer = {
      ...player,
      isHost: false,
      isConnected: true,
      joinedAt: Date.now(),
    };

    room.players.push(newPlayer);
    this.updateRoom(room);
    return room;
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    if (room.status === 'lobby') {
      // Remove from lobby
      room.players.splice(playerIndex, 1);
      
      // If host left and there are other players, assign new host
      if (playerId === room.hostId && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      
      // If no players left, delete room
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
        this.saveToStorage();
        return;
      }
    } else {
      // Mark as disconnected during active game
      room.players[playerIndex].isConnected = false;
    }

    this.updateRoom(room);
  }

  async startRoom(roomId: string): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'lobby') {
      throw new Error('Game already started');
    }

    if (room.players.length === 0) {
      throw new Error('No players in room');
    }

    // Convert RoomPlayers to game Players
    const gamePlayers: Player[] = room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      position: 0,
    }));

    // Create game state
    const gameState = createGameState(gamePlayers, {
      roomId: room.id,
      isMultiplayer: true,
    });

    room.gameState = gameState;
    room.status = 'active';
    room.startedAt = Date.now();

    this.updateRoom(room);
    return room;
  }

  async submitRoll(roomId: string, playerId: string, roll: number): Promise<GameRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'active') {
      throw new Error('Game not active');
    }

    if (!room.gameState) {
      throw new Error('Game state not initialized');
    }

    // Verify it's this player's turn
    const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    // Apply roll using game engine
    const board = createBoardFromSquares(squaresData as any);
    const result = applyRoll(room.gameState, board, roll);

    // Update game state
    room.gameState = result.updatedState;

    // Check for winner
    if (result.updatedState.winner) {
      room.status = 'complete';
      room.completedAt = Date.now();
    }

    this.updateRoom(room);
    return room;
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    return this.rooms.get(roomId) || null;
  }

  subscribeToRoom(roomId: string, callback: RoomSubscriptionCallback): () => void {
    if (!this.subscriptions.has(roomId)) {
      this.subscriptions.set(roomId, new Set());
    }
    
    this.subscriptions.get(roomId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(roomId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(roomId);
        }
      }
    };
  }

  cleanup(): void {
    this.subscriptions.clear();
    this.broadcastChannel.close();
  }
}

/**
 * Singleton instance
 */
let adapterInstance: RoomAdapter | null = null;

/**
 * Get the room adapter instance
 */
export function getRoomAdapter(): RoomAdapter {
  if (!adapterInstance) {
    adapterInstance = new LocalRoomAdapter();
  }
  return adapterInstance;
}
