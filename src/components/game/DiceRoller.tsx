import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dices } from 'lucide-react';
import type { Player } from '@/types/game';

interface DiceRollerProps {
  currentPlayer: Player;
  onRoll: (roll: number) => void;
  disabled: boolean;
}

export function DiceRoller({ currentPlayer, onRoll, disabled }: DiceRollerProps) {
  const [manualRoll, setManualRoll] = useState('');
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAutoRoll = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    
    // Animate the dice roll
    let count = 0;
    const interval = setInterval(() => {
      setLastRoll(Math.floor(Math.random() * 6) + 1);
      count++;
      
      if (count >= 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setLastRoll(finalRoll);
        setIsAnimating(false);
        onRoll(finalRoll);
      }
    }, 100);
  };

  const handleManualRoll = () => {
    const roll = parseInt(manualRoll);
    if (roll >= 1 && roll <= 6) {
      setLastRoll(roll);
      onRoll(roll);
      setManualRoll('');
    }
  };

  if (!currentPlayer) return null;

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: currentPlayer.color }}
          />
          <span>{currentPlayer.name}'s Turn</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Position */}
        <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Square</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {currentPlayer.position}
          </div>
        </div>

        {/* Dice Display */}
        {lastRoll !== null && (
          <div className="text-center">
            <div
              className={`
                inline-flex items-center justify-center w-20 h-20 text-4xl font-bold
                bg-white dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600
                rounded-xl shadow-lg
                ${isAnimating ? 'animate-bounce' : ''}
              `}
            >
              {lastRoll}
            </div>
          </div>
        )}

        {/* Roll Button */}
        <Button
          onClick={handleAutoRoll}
          disabled={disabled || isAnimating}
          className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
          size="lg"
        >
          <Dices className="w-5 h-5 mr-2" />
          Roll Dice
        </Button>

        {/* Manual Roll Entry */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Or enter roll manually (1-6):
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="6"
              value={manualRoll}
              onChange={(e) => setManualRoll(e.target.value)}
              placeholder="1-6"
              className="flex-1"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualRoll();
                }
              }}
            />
            <Button
              onClick={handleManualRoll}
              disabled={disabled || !manualRoll || parseInt(manualRoll) < 1 || parseInt(manualRoll) > 6}
              variant="outline"
            >
              Enter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
