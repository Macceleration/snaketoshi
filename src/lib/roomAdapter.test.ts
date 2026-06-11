import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRoomAdapter } from './roomAdapter';
import type { RoomPlayer } from '@/types/room';

describe('LocalRoomAdapter', () => {
  let adapter: LocalRoomAdapter;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    adapter = new LocalRoomAdapter();
  });

  describe('getRoomByCode', () => {
    it('should find room by code', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      const foundRoom = await adapter.getRoomByCode(room.code);

      expect(foundRoom).not.toBeNull();
      expect(foundRoom?.id).toBe(room.id);
      expect(foundRoom?.code).toBe(room.code);
    });

    it('should return null for non-existent code', async () => {
      const room = await adapter.getRoomByCode('NOTEXIST');
      expect(room).toBeNull();
    });
  });

  describe('submitRoll - encounter phase', () => {
    it('should enter encounter phase after roll', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      const rolledRoom = await adapter.submitRoll(room.id, 'player1', 3);

      expect(rolledRoom.gameState?.phase).toBe('encounter');
      expect(rolledRoom.gameState?.pendingEventId).toBeDefined();
    });

    it('should store pending transition for snake', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      // Roll to land on square 8 which has a snake to 3
      const rolledRoom = await adapter.submitRoll(room.id, 'player1', 8);

      expect(rolledRoom.gameState?.pendingTransition).toBeDefined();
      expect(rolledRoom.gameState?.pendingTransition?.type).toBe('snake');
      expect(rolledRoom.gameState?.pendingTransition?.to).toBe(3);
    });

    it('should store pending transition for ladder', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      // Roll to land on square 10 which has a ladder to 23
      const rolledRoom = await adapter.submitRoll(room.id, 'player1', 10);

      expect(rolledRoom.gameState?.pendingTransition).toBeDefined();
      expect(rolledRoom.gameState?.pendingTransition?.type).toBe('ladder');
      expect(rolledRoom.gameState?.pendingTransition?.to).toBe(23);
    });

    it('should not allow roll when not awaiting_roll', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);
      await adapter.submitRoll(room.id, 'player1', 3);

      // Try to roll again while in encounter phase
      await expect(
        adapter.submitRoll(room.id, 'player1', 4)
      ).rejects.toThrow('Not in roll phase');
    });
  });

  describe('continueTurn', () => {
    it('should advance turn after encounter', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const player2: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player2',
        name: 'Bob',
        color: '#00ff00',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.joinRoom(room.id, player2);
      await adapter.startRoom(room.id);

      await adapter.submitRoll(room.id, 'player1', 3);
      const continuedRoom = await adapter.continueTurn(room.id, 'player1');

      expect(continuedRoom.gameState?.phase).toBe('awaiting_roll');
      expect(continuedRoom.gameState?.currentPlayerIndex).toBe(1);
      expect(continuedRoom.gameState?.pendingEventId).toBeUndefined();
    });

    it('should apply snake transition before advancing turn', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      // Roll to square 8 (snake to 3)
      await adapter.submitRoll(room.id, 'player1', 8);
      const continuedRoom = await adapter.continueTurn(room.id, 'player1');

      // Player should be at square 3, not 8
      expect(continuedRoom.gameState?.players[0].position).toBe(3);
      expect(continuedRoom.gameState?.pendingTransition).toBeUndefined();
    });

    it('should apply ladder transition before advancing turn', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      // Roll to square 10 (ladder to 23)
      await adapter.submitRoll(room.id, 'player1', 10);
      const continuedRoom = await adapter.continueTurn(room.id, 'player1');

      // Player should be at square 23, not 10
      expect(continuedRoom.gameState?.players[0].position).toBe(23);
      expect(continuedRoom.gameState?.pendingTransition).toBeUndefined();
    });

    it('should not allow continue when not in encounter phase', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.startRoom(room.id);

      await expect(
        adapter.continueTurn(room.id, 'player1')
      ).rejects.toThrow('Not in encounter phase');
    });

    it('should not allow wrong player to continue turn', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const player2: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player2',
        name: 'Bob',
        color: '#00ff00',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.joinRoom(room.id, player2);
      await adapter.startRoom(room.id);

      await adapter.submitRoll(room.id, 'player1', 3);

      await expect(
        adapter.continueTurn(room.id, 'player2')
      ).rejects.toThrow('Not your turn');
    });

    it('should mark game complete when reaching square 72', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      const startedRoom = await adapter.startRoom(room.id);

      // Manually set player to square 69
      if (startedRoom.gameState) {
        startedRoom.gameState.players[0].position = 69;
      }

      // Roll to reach 72
      await adapter.submitRoll(room.id, 'player1', 3);
      const continuedRoom = await adapter.continueTurn(room.id, 'player1');

      expect(continuedRoom.gameState?.winner).toBe('player1');
      expect(continuedRoom.gameState?.phase).toBe('complete');
      expect(continuedRoom.status).toBe('complete');
    });
  });

  describe('wrong player cannot roll or continue', () => {
    it('should not allow wrong player to roll', async () => {
      const hostPlayer: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player1',
        name: 'Alice',
        color: '#ff0000',
      };

      const player2: Omit<RoomPlayer, 'isHost' | 'isConnected' | 'joinedAt'> = {
        id: 'player2',
        name: 'Bob',
        color: '#00ff00',
      };

      const room = await adapter.createRoom('default', hostPlayer);
      await adapter.joinRoom(room.id, player2);
      await adapter.startRoom(room.id);

      // Player 2 tries to roll on Player 1's turn
      await expect(
        adapter.submitRoll(room.id, 'player2', 3)
      ).rejects.toThrow('Not your turn');
    });
  });
});
