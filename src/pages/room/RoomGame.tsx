import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { GameBoard } from '@/components/game/GameBoard';
import { DiceRoller } from '@/components/game/DiceRoller';
import { GameLog as GameLogComponent } from '@/components/game/GameLog';
import { SquareModal } from '@/components/game/SquareModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Eye } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useToast } from '@/hooks/useToast';
import type { Square } from '@/types/game';
import type { GameRoom } from '@/types/room';
import squaresData from '@/data/squares.json';
import { getRoomAdapter } from '@/lib/roomAdapterFactory';
import { createBoardFromSquares } from '@/lib/boardAdapter';
import { getCurrentPlayer } from '@/lib/gameEngine';

const squares = squaresData as Square[];
const board = createBoardFromSquares(squares);

export function RoomGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | undefined>();
  const [lastTransition, setLastTransition] = useState<
    { type: 'snake' | 'ladder'; from: number; to: number } | undefined
  >();

  // My identity in this room
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  // Track which pendingEventId we've already shown the modal for
  const shownEventIdRef = useRef<string>('');

  useSeoMeta({
    title: 'Multiplayer Game - Snaketoshi Squares',
    description: 'Play Moksha Patam with friends',
  });

  useEffect(() => {
    if (!roomId) return;

    const storedId = localStorage.getItem(`room-${roomId}-player-id`);
    if (!storedId) {
      navigate(`/room/${roomId}/join`);
      return;
    }
    setCurrentPlayerId(storedId);

    const adapter = getRoomAdapter();

    // Initial load
    adapter.getRoom(roomId).then(r => {
      if (!r) {
        toast({ title: 'Room not found', variant: 'destructive' });
        navigate('/');
        return;
      }
      setRoom(r);
      setLoading(false);
      maybeOpenModal(r, storedId);
    });

    // Realtime subscription
    const unsub = adapter.subscribeToRoom(roomId, (updated) => {
      setRoom(updated);
      maybeOpenModal(updated, storedId);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /**
   * Open the encounter modal if we just entered encounter phase and
   * haven't shown this event's modal yet.
   */
  function maybeOpenModal(r: GameRoom, myId: string) {
    const gs = r.gameState;
    if (!gs || gs.phase !== 'encounter' || !gs.pendingEventId) return;
    if (shownEventIdRef.current === gs.pendingEventId) return;

    // Only the ACTIVE player opens the interactive modal.
    // All others see the passive view (rendered inline, not here).
    const current = gs.players[gs.currentPlayerIndex];
    if (current.id !== myId) return;

    const ev = gs.events[0];
    if (!ev || ev.id !== gs.pendingEventId) return;

    const sq = squares.find(s => s.number === ev.toSquare);
    if (!sq) return;

    shownEventIdRef.current = gs.pendingEventId;
    setSelectedSquare(sq);
    setShowVideo(false);
    setLastRoll(ev.roll);
    setLastTransition(
      ev.hasSnake || ev.hasLadder
        ? { type: ev.hasSnake ? 'snake' : 'ladder', from: ev.toSquare, to: ev.finalSquare! }
        : undefined,
    );
  }

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleRoll = async (roll: number) => {
    if (!roomId) return;
    try {
      await getRoomAdapter().submitRoll(roomId, currentPlayerId, roll);
    } catch (error) {
      toast({
        title: 'Roll failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  /** Called by SquareModal's Continue / Skip buttons */
  const handleContinueTurn = async () => {
    setSelectedSquare(null);
    setShowVideo(false);

    if (!roomId || !room?.gameState) return;

    try {
      await getRoomAdapter().continueTurn(roomId, currentPlayerId);
    } catch (error) {
      toast({
        title: 'Continue failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleLeave = () => {
    if (confirm('Leave this game? You can rejoin with the same link.')) navigate('/');
  };

  // ── render ────────────────────────────────────────────────────────────────

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
  const currentTurnPlayer = getCurrentPlayer(gameState);
  const isMyTurn = currentTurnPlayer?.id === currentPlayerId;
  const isEncounter = gameState.phase === 'encounter';
  const isComplete = gameState.phase === 'complete' || room.status === 'complete';

  // Passive encounter card — shown to non-active players during encounter phase
  const passiveEncounterSquare = isEncounter && !isMyTurn
    ? squares.find(s => s.number === gameState.events[0]?.toSquare)
    : null;

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

        {/* Game complete banner */}
        {isComplete && gameState.winner && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900">
              <CardContent className="py-6 text-center">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                  {gameState.players.find(p => p.id === gameState.winner)?.name ?? 'Someone'} achieved Moksha!
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">Liberation is theirs.</p>
                <Button onClick={() => navigate('/')} className="mt-4" variant="outline">
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr,300px] gap-6 max-w-7xl mx-auto">
          {/* Board */}
          <div>
            <GameBoard
              squares={squares}
              players={gameState.players}
              currentPlayerId={currentTurnPlayer?.id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Dice roller or turn status */}
            {!isComplete && (
              <>
                {isMyTurn && !isEncounter && (
                  <DiceRoller
                    currentPlayer={currentTurnPlayer!}
                    onRoll={handleRoll}
                    disabled={false}
                  />
                )}

                {!isMyTurn && !isEncounter && (
                  <Card className="border-2">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Waiting for</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {currentTurnPlayer?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">to roll</p>
                    </CardContent>
                  </Card>
                )}

                {/* Passive encounter card — shown to spectators */}
                {isEncounter && passiveEncounterSquare && (
                  <Card className="border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                        <Eye className="w-4 h-4" />
                        Watching {currentTurnPlayer?.name}
                      </div>
                      <div>
                        <p className="font-bold text-lg">
                          <span className="text-orange-600 dark:text-orange-400 mr-2">
                            {passiveEncounterSquare.number}
                          </span>
                          {passiveEncounterSquare.title}
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-serif">
                          {passiveEncounterSquare.sanskrit}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{passiveEncounterSquare.reflection}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Active player in encounter — remind them to continue */}
                {isEncounter && isMyTurn && !selectedSquare && (
                  <Card className="border-2 border-orange-300 dark:border-orange-700">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your encounter modal closed. Tap below to continue.
                      </p>
                      <Button
                        onClick={handleContinueTurn}
                        className="mt-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                      >
                        Continue Turn
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <GameLogComponent log={gameState.events} players={gameState.players} />
          </div>
        </div>
      </div>

      {/* Active player encounter modal */}
      {selectedSquare && currentTurnPlayer && (
        <SquareModal
          square={selectedSquare}
          isOpen={true}
          showVideo={showVideo}
          onShowVideo={() => setShowVideo(true)}
          onSkipVideo={() => {}}
          onClose={handleContinueTurn}
          onContinueTurn={handleContinueTurn}
          currentPlayer={currentTurnPlayer}
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
