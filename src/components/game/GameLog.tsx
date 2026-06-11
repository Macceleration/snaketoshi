import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, ArrowUp, Dices } from 'lucide-react';
import type { GameLog as GameLogType, Player } from '@/types/game';

interface GameLogProps {
  log: GameLogType[];
  players: Player[];
}

export function GameLog({ log, players }: GameLogProps) {
  const getPlayerColor = (playerId: string) => {
    return players.find(p => p.id === playerId)?.color || '#gray';
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Game Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {log.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Dices className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Roll the dice to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPlayerColor(entry.playerId) }}
                    />
                    <span className="font-semibold text-sm">
                      {entry.playerName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      rolled {entry.roll}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <span>Square {entry.fromSquare}</span>
                    <span className="mx-1">→</span>
                    <span className="font-bold">{entry.toSquare}</span>
                    
                    {entry.finalSquare !== undefined && entry.finalSquare !== entry.toSquare && (
                      <>
                        <span className="mx-1">
                          {entry.hasSnake && (
                            <ArrowDown className="inline w-3 h-3 text-red-600" />
                          )}
                          {entry.hasLadder && (
                            <ArrowUp className="inline w-3 h-3 text-green-600" />
                          )}
                        </span>
                        <span className="font-bold text-purple-700 dark:text-purple-400">
                          {entry.finalSquare}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
