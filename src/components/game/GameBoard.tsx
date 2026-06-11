import { Card } from '@/components/ui/card';
import type { Square, Player } from '@/types/game';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { layoutBoard } from '@/lib/boardLayout';
import { squareToTile, tileToSquare } from '@/lib/boardAdapter';

interface GameBoardProps {
  squares: Square[];
  players: Player[];
  currentPlayerId?: string;
}

export function GameBoard({ squares, players, currentPlayerId }: GameBoardProps) {
  // Convert squares to tiles and layout the board
  const tiles = squares.map(squareToTile);
  const rows = layoutBoard(tiles);
  
  // Convert back to squares for rendering (backward compatibility)
  const rowsAsSquares = rows.map(row => row.map(tileToSquare));

  const getPlayersOnSquare = (squareNumber: number) => {
    return players.filter(p => p.position === squareNumber);
  };

  const getSquareGradient = (square: Square) => {
    if (square.number === 72) {
      return 'bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-400 dark:from-yellow-600 dark:via-amber-600 dark:to-orange-700';
    }
    if (square.snake !== null) {
      return 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900 dark:to-rose-900';
    }
    if (square.ladder !== null) {
      return 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-900';
    }
    if (square.number % 9 === 0) {
      return 'bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-950';
    }
    return 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-950';
  };

  return (
    <div className="w-full">
      <Card className="p-2 md:p-4 bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-gray-800 dark:via-orange-900 dark:to-gray-800 border-4 border-amber-300 dark:border-amber-700 shadow-2xl">
        <div className="space-y-1 md:space-y-2">
          {rowsAsSquares.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 md:gap-2">
              {row.map((square) => {
                const squarePlayers = getPlayersOnSquare(square.number);
                const hasSnake = square.snake !== null;
                const hasLadder = square.ladder !== null;
                
                return (
                  <div
                    key={square.number}
                    className={`
                      relative flex-1 aspect-square rounded-md md:rounded-lg
                      ${getSquareGradient(square)}
                      border-2 border-amber-300 dark:border-amber-700
                      transition-all duration-300
                      ${squarePlayers.some(p => p.id === currentPlayerId) ? 'ring-4 ring-orange-500 ring-offset-2' : ''}
                    `}
                  >
                    {/* Square Number */}
                    <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1">
                      <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">
                        {square.number}
                      </span>
                    </div>

                    {/* Snake/Ladder Indicator */}
                    {(hasSnake || hasLadder) && (
                      <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1">
                        {hasSnake && (
                          <ArrowDown className="w-3 h-3 md:w-4 md:h-4 text-red-600 dark:text-red-400" />
                        )}
                        {hasLadder && (
                          <ArrowUp className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    )}

                    {/* Sanskrit Name (hidden on small screens) */}
                    <div className="absolute inset-0 hidden sm:flex items-center justify-center p-1">
                      <span className="text-[8px] md:text-xs text-center text-gray-600 dark:text-gray-400 font-medium leading-tight">
                        {square.sanskrit}
                      </span>
                    </div>

                    {/* Player Tokens */}
                    {squarePlayers.length > 0 && (
                      <div className="absolute bottom-0.5 left-0.5 right-0.5 md:bottom-1 md:left-1 md:right-1 flex gap-0.5 flex-wrap justify-center">
                        {squarePlayers.map((player) => (
                          <div
                            key={player.id}
                            className="w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white shadow-lg"
                            style={{ backgroundColor: player.color }}
                            title={player.name}
                          />
                        ))}
                      </div>
                    )}

                    {/* Liberation Square Special Styling */}
                    {square.number === 72 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl md:text-3xl">✨</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <ArrowDown className="w-4 h-4 text-red-600" />
          <span>Snake (descend)</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUp className="w-4 h-4 text-green-600" />
          <span>Ladder (ascend)</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✨</span>
          <span>Moksha (liberation)</span>
        </div>
      </div>
    </div>
  );
}
