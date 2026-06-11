import { describe, it, expect } from 'vitest';
import {
  createGameState,
  getCurrentPlayer,
  calculateDestination,
  checkTransition,
  checkWinCondition,
  applyRoll,
  advanceTurn,
  createGameEvent,
  movePlayer,
  findTile,
  applyTransition,
} from './gameEngine';
import type { Player, Board, Tile } from '@/types/game';

// Helper: create test players
function createTestPlayers(): Player[] {
  return [
    { id: 'p1', name: 'Alice', color: '#ff0000', position: 0 },
    { id: 'p2', name: 'Bob', color: '#00ff00', position: 0 },
  ];
}

// Helper: create test board
function createTestBoard(): Board {
  const tiles: Tile[] = [];
  for (let i = 1; i <= 72; i++) {
    tiles.push({
      number: i,
      title: `Square ${i}`,
      sanskrit: `Sanskrit ${i}`,
      meaning: `Meaning ${i}`,
      reflection: `Reflection ${i}`,
      videoUrl: null,
      snakeTo: null,
      ladderTo: null,
    });
  }
  
  // Add some snakes and ladders
  tiles[7].snakeTo = 3; // Snake at square 8 goes to 3
  tiles[11].snakeTo = 4; // Snake at square 12 goes to 4
  tiles[9].ladderTo = 23; // Ladder at square 10 goes to 23
  tiles[27].ladderTo = 58; // Ladder at square 28 goes to 58
  
  return {
    tiles,
    totalSquares: 72,
  };
}

describe('gameEngine', () => {
  describe('createGameState', () => {
    it('should create initial game state with players', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      
      expect(state.players).toEqual(players);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.events).toEqual([]);
      expect(state.winner).toBeUndefined();
      expect(state.isMultiplayer).toBe(false);
    });
    
    it('should support multiplayer options', () => {
      const players = createTestPlayers();
      const state = createGameState(players, {
        roomId: 'room123',
        isMultiplayer: true,
      });
      
      expect(state.roomId).toBe('room123');
      expect(state.isMultiplayer).toBe(true);
    });
  });
  
  describe('getCurrentPlayer', () => {
    it('should return the current player', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      
      expect(getCurrentPlayer(state)).toEqual(players[0]);
    });
    
    it('should return undefined for empty player array', () => {
      const state = createGameState([]);
      expect(getCurrentPlayer(state)).toBeUndefined();
    });
  });
  
  describe('calculateDestination', () => {
    it('should add roll to current position', () => {
      expect(calculateDestination(5, 4)).toBe(9);
      expect(calculateDestination(0, 6)).toBe(6);
      expect(calculateDestination(50, 3)).toBe(53);
    });
    
    it('should cap at max square (72)', () => {
      expect(calculateDestination(70, 5)).toBe(72);
      expect(calculateDestination(72, 6)).toBe(72);
      expect(calculateDestination(68, 10)).toBe(72);
    });
    
    it('should support custom max square', () => {
      expect(calculateDestination(8, 4, 10)).toBe(10);
      expect(calculateDestination(5, 2, 6)).toBe(6);
    });
  });
  
  describe('checkTransition', () => {
    it('should detect snake transition', () => {
      const tile: Tile = {
        number: 8,
        title: 'Snake',
        sanskrit: '',
        meaning: '',
        reflection: '',
        videoUrl: null,
        snakeTo: 3,
        ladderTo: null,
      };
      
      const result = checkTransition(tile);
      expect(result).toEqual({ type: 'snake', to: 3 });
    });
    
    it('should detect ladder transition', () => {
      const tile: Tile = {
        number: 10,
        title: 'Ladder',
        sanskrit: '',
        meaning: '',
        reflection: '',
        videoUrl: null,
        snakeTo: null,
        ladderTo: 23,
      };
      
      const result = checkTransition(tile);
      expect(result).toEqual({ type: 'ladder', to: 23 });
    });
    
    it('should return null for no transition', () => {
      const tile: Tile = {
        number: 5,
        title: 'Normal',
        sanskrit: '',
        meaning: '',
        reflection: '',
        videoUrl: null,
        snakeTo: null,
        ladderTo: null,
      };
      
      expect(checkTransition(tile)).toBeNull();
    });
    
    it('should return null for undefined tile', () => {
      expect(checkTransition(undefined)).toBeNull();
    });
    
    it('should prioritize snake over ladder', () => {
      const tile: Tile = {
        number: 15,
        title: 'Both',
        sanskrit: '',
        meaning: '',
        reflection: '',
        videoUrl: null,
        snakeTo: 5,
        ladderTo: 25,
      };
      
      const result = checkTransition(tile);
      expect(result).toEqual({ type: 'snake', to: 5 });
    });
  });
  
  describe('checkWinCondition', () => {
    it('should return true when at square 72', () => {
      expect(checkWinCondition(72)).toBe(true);
    });
    
    it('should return true when exceeding square 72', () => {
      expect(checkWinCondition(75)).toBe(true);
    });
    
    it('should return false when below square 72', () => {
      expect(checkWinCondition(71)).toBe(false);
      expect(checkWinCondition(50)).toBe(false);
      expect(checkWinCondition(0)).toBe(false);
    });
    
    it('should support custom max square', () => {
      expect(checkWinCondition(10, 10)).toBe(true);
      expect(checkWinCondition(9, 10)).toBe(false);
    });
  });
  
  describe('findTile', () => {
    it('should find tile by number', () => {
      const board = createTestBoard();
      const tile = findTile(board, 42);
      
      expect(tile).toBeDefined();
      expect(tile?.number).toBe(42);
    });
    
    it('should return undefined for non-existent tile', () => {
      const board = createTestBoard();
      expect(findTile(board, 100)).toBeUndefined();
      expect(findTile(board, 0)).toBeUndefined();
    });
  });
  
  describe('createGameEvent', () => {
    it('should create event without transition', () => {
      const player: Player = { id: 'p1', name: 'Alice', color: '#ff0000', position: 5 };
      const event = createGameEvent(player, 4, 5, 9);
      
      expect(event.playerId).toBe('p1');
      expect(event.playerName).toBe('Alice');
      expect(event.roll).toBe(4);
      expect(event.fromSquare).toBe(5);
      expect(event.toSquare).toBe(9);
      expect(event.finalSquare).toBeUndefined();
      expect(event.hasSnake).toBe(false);
      expect(event.hasLadder).toBe(false);
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.id).toMatch(/^event-/);
    });
    
    it('should create event with snake transition', () => {
      const player: Player = { id: 'p1', name: 'Alice', color: '#ff0000', position: 5 };
      const event = createGameEvent(player, 3, 5, 8, { type: 'snake', to: 3 });
      
      expect(event.toSquare).toBe(8);
      expect(event.finalSquare).toBe(3);
      expect(event.hasSnake).toBe(true);
      expect(event.hasLadder).toBe(false);
    });
    
    it('should create event with ladder transition', () => {
      const player: Player = { id: 'p1', name: 'Alice', color: '#ff0000', position: 5 };
      const event = createGameEvent(player, 5, 5, 10, { type: 'ladder', to: 23 });
      
      expect(event.toSquare).toBe(10);
      expect(event.finalSquare).toBe(23);
      expect(event.hasSnake).toBe(false);
      expect(event.hasLadder).toBe(true);
    });
  });
  
  describe('movePlayer', () => {
    it('should update player position', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = movePlayer(state, 'p1', 15);
      
      expect(updated.players[0].position).toBe(15);
      expect(updated.players[1].position).toBe(0);
    });
    
    it('should not mutate original state', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = movePlayer(state, 'p1', 15);
      
      expect(state.players[0].position).toBe(0);
      expect(updated.players[0].position).toBe(15);
    });
    
    it('should only move specified player', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = movePlayer(state, 'p2', 20);
      
      expect(updated.players[0].position).toBe(0);
      expect(updated.players[1].position).toBe(20);
    });
  });
  
  describe('applyRoll', () => {
    it('should apply normal roll', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 4);
      
      expect(result.updatedState.players[0].position).toBe(4);
      expect(result.event.roll).toBe(4);
      expect(result.event.fromSquare).toBe(0);
      expect(result.event.toSquare).toBe(4);
      expect(result.transition).toBeUndefined();
      expect(result.updatedState.winner).toBeUndefined();
    });
    
    it('should cap roll at square 72', () => {
      const players = createTestPlayers();
      players[0].position = 70;
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 6);
      
      expect(result.updatedState.players[0].position).toBe(72);
      expect(result.event.toSquare).toBe(72);
    });
    
    it('should detect snake transition', () => {
      const players = createTestPlayers();
      players[0].position = 4;
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 4); // Lands on 8, snake to 3
      
      expect(result.updatedState.players[0].position).toBe(8);
      expect(result.transition).toEqual({ type: 'snake', from: 8, to: 3 });
      expect(result.event.hasSnake).toBe(true);
      expect(result.event.finalSquare).toBe(3);
    });
    
    it('should detect ladder transition', () => {
      const players = createTestPlayers();
      players[0].position = 5;
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 5); // Lands on 10, ladder to 23
      
      expect(result.updatedState.players[0].position).toBe(10);
      expect(result.transition).toEqual({ type: 'ladder', from: 10, to: 23 });
      expect(result.event.hasLadder).toBe(true);
      expect(result.event.finalSquare).toBe(23);
    });
    
    it('should add event to state', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 3);
      
      expect(result.updatedState.events).toHaveLength(1);
      expect(result.updatedState.events[0]).toEqual(result.event);
    });
    
    it('should detect winner at square 72', () => {
      const players = createTestPlayers();
      players[0].position = 69;
      const state = createGameState(players);
      const board = createTestBoard();
      
      const result = applyRoll(state, board, 3);
      
      expect(result.updatedState.players[0].position).toBe(72);
      expect(result.updatedState.winner).toBe('p1');
    });
    
    it('should throw error for invalid roll', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const board = createTestBoard();
      
      expect(() => applyRoll(state, board, 0)).toThrow('Roll must be between 1 and 6');
      expect(() => applyRoll(state, board, 7)).toThrow('Roll must be between 1 and 6');
    });
    
    it('should throw error when no current player', () => {
      const state = createGameState([]);
      const board = createTestBoard();
      
      expect(() => applyRoll(state, board, 3)).toThrow('No current player');
    });
  });
  
  describe('advanceTurn', () => {
    it('should advance to next player', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = advanceTurn(state);
      
      expect(updated.currentPlayerIndex).toBe(1);
    });
    
    it('should wrap around to first player', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      state.currentPlayerIndex = 1;
      const updated = advanceTurn(state);
      
      expect(updated.currentPlayerIndex).toBe(0);
    });
    
    it('should not mutate original state', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = advanceTurn(state);
      
      expect(state.currentPlayerIndex).toBe(0);
      expect(updated.currentPlayerIndex).toBe(1);
    });
  });
  
  describe('applyTransition', () => {
    it('should move player to transition destination', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = applyTransition(state, 'p1', 23);
      
      expect(updated.players[0].position).toBe(23);
    });
    
    it('should not mutate original state', () => {
      const players = createTestPlayers();
      const state = createGameState(players);
      const updated = applyTransition(state, 'p1', 23);
      
      expect(state.players[0].position).toBe(0);
      expect(updated.players[0].position).toBe(23);
    });
  });
});
