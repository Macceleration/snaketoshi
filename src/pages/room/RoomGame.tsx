import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { GameBoard } from '@/components/game/GameBoard';
import { DiceRoller } from '@/components/game/DiceRoller';
import { GameLog as GameLogComponent } from '@/components/game/GameLog';
import { SquareModal } from '@/components/game/SquareModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useToast } from '@/hooks/useToast';
import type { Square } from '@/types/game';
import type { GameRoom } from '@/types/room';
import squaresData from '@/data/squares.json';
import { getRoomAdapter } from '@/lib/roomAdapter';
import { createBoardFromSquares } from '@/lib/boardAdapter';
import { getCurrentPlayer } from '@/lib/gameEngine';

export function RoomGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [lastRoll, setLastRoll] = useState<number | undefined>();
  const [lastTransition, setLastTransition] = useState<{ type: 'snake' | 'ladder'; from: number; to: number } | undefined>();
  const [lastSeenEventId, setLastSeenEventId] = useState<string>('');

  const squares = squaresData as Square[];
  const board = createBoardFromSquares(squares);

  useSeoMeta({
    title: 'Multiplayer Game - Snaketoshi Squares',
    description: 'Play Moksha Patam with friends',
  });

  useEffect(() => {
    if (!roomId) return;

    // Get current player ID
    const storedPlayerId = localStorage.getItem(`room-${roomId}-player-id`);
    if (!storedPlayerId) {
      navigate(`/room/${roomId}/join`);
      return;
    }
    setCurrentPlayerId(storedPlayerId);

    const adapter = getRoomAdapter();

    // Load initial room
    adapter.getRoom(roomId).then(r => {
      if (!r) {
        toast({
          title: 'Room not found',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setRoom(r);
      setLoading(false);
    });

    // Subscribe to updates
    const unsubscribe = adapter.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);

      // Show modal when entering encounter phase with new event
      if (updatedRoom.gameState && updatedRoom.gameState.phase === 'encounter') {
        const pendingEventId = updatedRoom.gameState.pendingEventId;
        
        if (pendingEventId && pendingEventId !== lastSeenEventId) {
          const latestEvent = updatedRoom.gameState.events[0];
          if (latestEvent && latestEvent.id === pendingEventId) {
            const square = squares.find(s => s.number === latestEvent.toSquare);
            if (square) {
              setSelectedSquare(square);
              setShowVideo(false);
              setLastRoll(latestEvent.roll);
              setLastTransition(
                latestEvent.hasSnake || latestEvent.hasLadder
                  ? {
                      type: latestEvent.hasSnake ? 'snake' : 'ladder',
                      from: latestEvent.toSquare,
                      to: latestEvent.finalSquare!,
                    }
                  : undefined
              );
              setLastSeenEventId(pendingEventId);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, navigate, toast]);

  const handleRoll = async (roll: number) => {
    if (!roomId || !room) return;

    try {
      await getRoomAdapter().submitRoll(roomId, currentPlayerId, roll);
      // Room will update via subscription
    } catch (error) {
      toast({
        title: 'Roll failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCloseModal = async () => {
    setSelectedSquare(null);
    setShowVideo(false);

    if (!roomId || !room || !room.gameState) return;

    // If in encounter phase, continue the turn
    if (room.gameState.phase === 'encounter') {
      try {
        await getRoomAdapter().continueTurn(roomId, currentPlayerId);
        // Room will update via subscription
      } catch (error) {
        toast({
          title: 'Continue failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    }

    // Show winner message if game completed
    if (room.gameState.winner) {
      const winner = room.players.find(p => p.id === room.gameState?.winner);
      setTimeout(() => {
        toast({
          title: `🎉 ${winner?.name || 'Someone'} achieved Moksha!`,
          description: 'Liberation is theirs.',
        });
      }, 500);
    }
  };

  const handleLeave = () => {
    if (confirm('Leave this game? You can rejoin with the same link.')) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
        <div className="container mx-auto p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!room || !room.gameState) return null;

  const gameState = room.gameState;
  const currentPlayer = getCurrentPlayer(gameState);
  const isMyTurn = currentPlayer?.id === currentPlayerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button variant="ghost" onClick={handleLeave}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Game
          </Button>

          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span className="font-mono">{room.code}</span>
              </div>
            </Card>
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
            {isMyTurn ? (
              <DiceRoller
                currentPlayer={currentPlayer}
                onRoll={handleRoll}
                disabled={selectedSquare !== null}
              />
            ) : (
              <Card className="border-2">
                <div className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Waiting for
                  </p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {currentPlayer?.name}
                  </p>
                </div>
              </Card>
            )}

            <GameLogComponent log={gameState.events} players={gameState.players} />
          </div>
        </div>
      </div>

      {/* Square Modal */}
      {selectedSquare && currentPlayer && (
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
          roomId={room.id}
        />
      )}
    </div>
  );
}

export default RoomGame;
