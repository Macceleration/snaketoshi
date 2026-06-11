import type { GameState, Player, GameEvent, RollResult, Tile, Board } from '@/types/game';

/**
 * Create initial game state
 */
export function createGameState(
  players: Player[],
  options?: {
    roomId?: string;
    isMultiplayer?: boolean;
  }
): GameState {
  return {
    players,
    currentPlayerIndex: 0,
    events: [],
    roomId: options?.roomId,
    isMultiplayer: options?.isMultiplayer ?? false,
    winner: undefined,
  };
}

/**
 * Get the current player
 */
export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex];
}

/**
 * Find a tile by square number
 */
export function findTile(board: Board, squareNumber: number): Tile | undefined {
  return board.tiles.find(t => t.number === squareNumber);
}

/**
 * Calculate the destination after applying a dice roll
 * Caps at the maximum square (72)
 */
export function calculateDestination(
  currentPosition: number,
  roll: number,
  maxSquare: number = 72
): number {
  return Math.min(currentPosition + roll, maxSquare);
}

/**
 * Check for snake or ladder transition at a square
 */
export function checkTransition(
  tile: Tile | undefined
): { type: 'snake' | 'ladder'; to: number } | null {
  if (!tile) return null;
  
  if (tile.snakeTo !== null) {
    return { type: 'snake', to: tile.snakeTo };
  }
  
  if (tile.ladderTo !== null) {
    return { type: 'ladder', to: tile.ladderTo };
  }
  
  return null;
}

/**
 * Check if a player has won (reached or exceeded square 72)
 */
export function checkWinCondition(position: number, maxSquare: number = 72): boolean {
  return position >= maxSquare;
}

/**
 * Create a game event (log entry)
 */
export function createGameEvent(
  player: Player,
  roll: number,
  fromSquare: number,
  toSquare: number,
  transition?: { type: 'snake' | 'ladder'; to: number }
): GameEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    playerId: player.id,
    playerName: player.name,
    roll,
    fromSquare,
    toSquare,
    finalSquare: transition ? transition.to : undefined,
    hasSnake: transition?.type === 'snake',
    hasLadder: transition?.type === 'ladder',
    timestamp: Date.now(),
  };
}

/**
 * Move a player to a new position
 */
export function movePlayer(
  state: GameState,
  playerId: string,
  newPosition: number
): GameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, position: newPosition } : p
    ),
  };
}

/**
 * Apply a dice roll to the game state
 * This is the main game logic function
 */
export function applyRoll(
  state: GameState,
  board: Board,
  roll: number
): RollResult {
  const currentPlayer = getCurrentPlayer(state);
  
  if (!currentPlayer) {
    throw new Error('No current player');
  }
  
  if (roll < 1 || roll > 6) {
    throw new Error('Roll must be between 1 and 6');
  }
  
  const fromSquare = currentPlayer.position;
  const toSquare = calculateDestination(fromSquare, roll, board.totalSquares);
  
  // Check for snake or ladder
  const landedTile = findTile(board, toSquare);
  const transition = checkTransition(landedTile);
  const finalSquare = transition ? transition.to : toSquare;
  
  // Update player position
  let updatedState = movePlayer(state, currentPlayer.id, toSquare);
  
  // Create event
  const event = createGameEvent(currentPlayer, roll, fromSquare, toSquare, transition);
  
  // Add event to state
  updatedState = {
    ...updatedState,
    events: [event, ...updatedState.events],
  };
  
  // Check for winner
  if (checkWinCondition(finalSquare, board.totalSquares)) {
    updatedState = {
      ...updatedState,
      winner: currentPlayer.id,
    };
  }
  
  return {
    updatedState,
    event,
    transition: transition ? { ...transition, from: toSquare } : undefined,
  };
}

/**
 * Advance to the next player's turn
 */
export function advanceTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
  };
}

/**
 * Apply snake/ladder transition to player position
 * (For delayed visual transitions)
 */
export function applyTransition(
  state: GameState,
  playerId: string,
  toSquare: number
): GameState {
  return movePlayer(state, playerId, toSquare);
}
