import type { Square, Tile, Board } from '@/types/game';

/**
 * Convert legacy Square format to normalized Tile format
 */
export function squareToTile(square: Square): Tile {
  return {
    number: square.number,
    title: square.title,
    sanskrit: square.sanskrit,
    meaning: square.meaning,
    reflection: square.reflection,
    videoUrl: square.video,
    snakeTo: square.snake,
    ladderTo: square.ladder,
  };
}

/**
 * Convert Tile back to legacy Square format (for backward compatibility)
 */
export function tileToSquare(tile: Tile): Square {
  return {
    number: tile.number,
    title: tile.title,
    sanskrit: tile.sanskrit,
    meaning: tile.meaning,
    reflection: tile.reflection,
    video: tile.videoUrl,
    snake: tile.snakeTo,
    ladder: tile.ladderTo,
  };
}

/**
 * Create a Board from legacy Square array
 */
export function createBoardFromSquares(squares: Square[]): Board {
  return {
    tiles: squares.map(squareToTile),
    totalSquares: 72,
  };
}

/**
 * Get legacy Square array from Board (for components that still need it)
 */
export function getBoardSquares(board: Board): Square[] {
  return board.tiles.map(tileToSquare);
}
