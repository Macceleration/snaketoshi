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
import { LoginArea } from '@/components/auth/LoginArea';
import type { Player, GameState, Square } from '@/types/game';
import squaresData from '@/data/squares.json';
import { 
  createGameState, 
  applyRoll, 
  advanceTurn, 
  applyTransition,
  getCurrentPlayer 
} from '@/lib/gameEngine';
import { createBoardFromSquares, getBoardSquares } from '@/lib/boardAdapter';

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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  // Track last roll and transition for broadcasting
  const [lastRoll, setLastRoll] = useState<number | undefined>();
  const [lastTransition, setLastTransition] = useState<{ type: 'snake' | 'ladder'; from: number; to: number } | undefined>();

  // Convert legacy squares data to board
  const squares = squaresData as Square[];
  const board = createBoardFromSquares(squares);
  
  const currentPlayer = gameState ? getCurrentPlayer(gameState) : undefined;

  const handleStartGame = (playerNames: string[]) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      position: 0,
    }));
    
    const newGameState = createGameState(players, {
      roomId: roomId || undefined,
      isMultiplayer: mode === 'multiplayer',
    });
    
    setGameState(newGameState);
    setGameStarted(true);
  };

  const handleRoll = (roll: number) => {
    if (!gameState || !currentPlayer || isRolling) return;
    
    setIsRolling(true);
    
    try {
      // Apply the roll using game engine
      const result = applyRoll(gameState, board, roll);
      
      // Update game state
      setGameState(result.updatedState);
      
      // Store roll and transition for broadcasting
      setLastRoll(roll);
      setLastTransition(result.transition);
      
      // Find the square for the modal
      const landedSquare = squares.find(s => s.number === result.event.toSquare);
      if (landedSquare) {
        setSelectedSquare(landedSquare);
        setShowVideo(false);
      }
      
      // Apply snake/ladder transition after delay if needed
      if (result.transition) {
        setTimeout(() => {
          setGameState(prevState => {
            if (!prevState) return prevState;
            return applyTransition(prevState, currentPlayer.id, result.transition!.to);
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error applying roll:', error);
    }
    
    setIsRolling(false);
  };

  const handleCloseModal = () => {
    setSelectedSquare(null);
    setShowVideo(false);
    
    if (!gameState || !currentPlayer) return;
    
    // Check for winner
    if (gameState.winner) {
      setTimeout(() => {
        alert(`🎉 ${currentPlayer.name} has achieved Moksha! Liberation is yours.`);
      }, 500);
      return;
    }

    // Advance to next player's turn
    setGameState(advanceTurn(gameState));
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

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
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
          
          <div className="flex items-center gap-4">
            {mode === 'multiplayer' && roomId && (
              <Card className="px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span className="font-mono">{roomId}</span>
                </div>
              </Card>
            )}
            <LoginArea className="max-w-60" />
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-6">
          {/* Left Column: Board */}
          <div className="space-y-4">
            <GameBoard
              squares={squares}
              players={gameState.players}
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
              log={gameState.events}
              players={gameState.players}
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
          currentPlayer={currentPlayer}
          roll={lastRoll}
          transition={lastTransition}
          board={board}
          roomId={gameState?.roomId}
        />
      )}
    </div>
  );
}

export default GamePage;
