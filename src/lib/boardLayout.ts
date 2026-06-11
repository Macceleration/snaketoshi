import type { Tile } from '@/types/game';

/**
 * Board layout configuration
 */
export const BOARD_CONFIG = {
  rows: 8,
  cols: 9,
  totalSquares: 72,
} as const;

/**
 * Convert board tiles into a 2D grid for rendering
 * Bottom row (row 0) goes left to right (squares 1-9)
 * Next row (row 1) goes right to left (squares 10-18)
 * Alternating serpentine pattern
 */
export function layoutBoard(tiles: Tile[]): Tile[][] {
  const { rows, cols } = BOARD_CONFIG;
  const grid: Tile[][] = [];
  
  for (let row = 0; row < rows; row++) {
    const rowTiles: Tile[] = [];
    const start = row * cols;
    
    for (let col = 0; col < cols; col++) {
      // Serpentine path: even rows go left-to-right, odd rows go right-to-left
      const index = row % 2 === 0 ? start + col : start + (cols - 1 - col);
      const tile = tiles[index];
      
      if (tile) {
        rowTiles.push(tile);
      }
    }
    
    // Reverse order so bottom row is rendered first (visually at bottom)
    grid.unshift(rowTiles);
  }
  
  return grid;
}

/**
 * Get the visual row and column for a given square number
 * Returns {row: 0-7, col: 0-8} where row 0 is the bottom
 */
export function getSquarePosition(squareNumber: number): { row: number; col: number } {
  const { cols } = BOARD_CONFIG;
  
  if (squareNumber < 1 || squareNumber > BOARD_CONFIG.totalSquares) {
    throw new Error(`Square number must be between 1 and ${BOARD_CONFIG.totalSquares}`);
  }
  
  // Convert to 0-based index
  const index = squareNumber - 1;
  const row = Math.floor(index / cols);
  
  // Calculate column based on serpentine pattern
  const col = row % 2 === 0 
    ? index % cols 
    : (cols - 1) - (index % cols);
  
  return { row, col };
}

/**
 * Check if a square is on a row boundary (multiple of 9)
 * Useful for applying special styling
 */
export function isRowBoundary(squareNumber: number): boolean {
  return squareNumber % BOARD_CONFIG.cols === 0;
}

/**
 * Check if a square is the final square (Moksha)
 */
export function isFinalSquare(squareNumber: number): boolean {
  return squareNumber === BOARD_CONFIG.totalSquares;
}
