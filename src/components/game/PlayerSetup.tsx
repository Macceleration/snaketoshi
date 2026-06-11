import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Play, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface PlayerSetupProps {
  mode: string;
  roomId: string | null;
  onStart: (playerNames: string[]) => void;
}

export function PlayerSetup({ mode, roomId, onStart }: PlayerSetupProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1']);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleAddPlayer = () => {
    if (playerNames.length < 6) {
      setPlayerNames([...playerNames, `Player ${playerNames.length + 1}`]);
    }
  };

  const handleRemovePlayer = () => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.slice(0, -1));
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one player name',
        variant: 'destructive',
      });
      return;
    }
    onStart(validNames);
  };

  const handleCopyRoomLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/play?mode=multiplayer&room=${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this link with your friends',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-3xl">
            {mode === 'single' ? 'Solo Journey Setup' : 'Multiplayer Room'}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === 'single'
              ? 'Enter your name to begin your journey through 72 squares of wisdom'
              : 'Add players and share the room link to play together'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Link (multiplayer only) */}
          {mode === 'multiplayer' && roomId && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <Label className="text-sm font-semibold mb-2 block">Room Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/play?mode=multiplayer&room=${roomId}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyRoomLink}
                  variant="outline"
                  size="icon"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Share this link with friends to join your game
              </p>
            </div>
          )}

          {/* Player Names */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Players ({playerNames.length}/6)
            </Label>
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index],
                  }}
                />
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1} name`}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          {/* Add/Remove Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddPlayer}
              disabled={playerNames.length >= 6}
              variant="outline"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
            <Button
              onClick={handleRemovePlayer}
              disabled={playerNames.length <= 1}
              variant="outline"
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Remove Player
            </Button>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
