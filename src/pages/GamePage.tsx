import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { GameBoard } from '@/components/game/GameBoard';
import { DiceRoller } from '@/components/game/DiceRoller';
import { GameLog as GameLogComponent } from '@/components/game/GameLog';
import { SquareModal } from '@/components/game/SquareModal';
import { PlayerSetup } from '@/components/game/PlayerSetup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import type { Player, GameLog, Square } from '@/types/game';
import squaresData from '@/data/squares.json';

const PLAYER_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'single';
  const roomId = searchParams.get('room');

  useSeoMeta({
    title: `Snaketoshi Squares - ${mode === 'single' ? 'Solo' : 'Multiplayer'} Game`,
    description: 'Play Moksha Patam - the ancient game of consciousness',
  });

  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameLog, setGameLog] = useState<GameLog[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const squares = squaresData as Square[];
  const currentPlayer = players[currentPlayerIndex];

  const handleStartGame = (playerNames: string[]) => {
    const newPlayers: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      position: 0,
    }));
    setPlayers(newPlayers);
    setGameStarted(true);
  };

  const handleRoll = (roll: number) => {
    if (!currentPlayer || isRolling) return;
    
    setIsRolling(true);
    
    const fromSquare = currentPlayer.position;
    let toSquare = Math.min(fromSquare + roll, 72);
    
    // Update player position
    const updatedPlayers = players.map(p =>
      p.id === currentPlayer.id ? { ...p, position: toSquare } : p
    );
    setPlayers(updatedPlayers);

    // Check for snake or ladder
    const landedSquare = squares.find(s => s.number === toSquare);
    let finalSquare = toSquare;
    let hasSnake = false;
    let hasLadder = false;

    if (landedSquare) {
      if (landedSquare.snake !== null) {
        finalSquare = landedSquare.snake;
        hasSnake = true;
      } else if (landedSquare.ladder !== null) {
        finalSquare = landedSquare.ladder;
        hasLadder = true;
      }

      // Apply snake or ladder after a delay
      if (hasSnake || hasLadder) {
        setTimeout(() => {
          const updatedPlayersWithMove = updatedPlayers.map(p =>
            p.id === currentPlayer.id ? { ...p, position: finalSquare } : p
          );
          setPlayers(updatedPlayersWithMove);
        }, 1500);
      }

      // Show square modal
      setSelectedSquare(landedSquare);
      setShowVideo(false);
    }

    // Add to log
    const logEntry: GameLog = {
      id: `log-${Date.now()}`,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      roll,
      fromSquare,
      toSquare,
      finalSquare: (hasSnake || hasLadder) ? finalSquare : undefined,
      hasSnake,
      hasLadder,
      timestamp: Date.now(),
    };
    setGameLog([logEntry, ...gameLog]);

    setIsRolling(false);
  };

  const handleCloseModal = () => {
    setSelectedSquare(null);
    setShowVideo(false);
    
    // Check for winner
    if (currentPlayer.position >= 72) {
      // Winner!
      setTimeout(() => {
        alert(`🎉 ${currentPlayer.name} has achieved Moksha! Liberation is yours.`);
      }, 500);
      return;
    }

    // Next player's turn
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 p-4">
        <div className="container mx-auto py-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <PlayerSetup
            mode={mode}
            roomId={roomId}
            onStart={handleStartGame}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Leave this game? Progress will be lost.')) {
                navigate('/');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Game
          </Button>
          
          {mode === 'multiplayer' && roomId && (
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-mono">{roomId}</span>
              </div>
            </Card>
          )}
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Left Column: Board */}
          <div className="space-y-4">
            <GameBoard
              squares={squares}
              players={players}
              currentPlayerId={currentPlayer?.id}
            />
          </div>

          {/* Right Column: Controls & Log */}
          <div className="space-y-4">
            <DiceRoller
              currentPlayer={currentPlayer}
              onRoll={handleRoll}
              disabled={isRolling || selectedSquare !== null}
            />
            
            <GameLogComponent
              log={gameLog}
              players={players}
            />
          </div>
        </div>
      </div>

      {/* Square Modal */}
      {selectedSquare && (
        <SquareModal
          square={selectedSquare}
          isOpen={true}
          showVideo={showVideo}
          onShowVideo={() => setShowVideo(true)}
          onSkipVideo={() => setShowVideo(false)}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default GamePage;
