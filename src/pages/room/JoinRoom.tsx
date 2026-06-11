import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, LogIn, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getRoomAdapter } from '@/lib/roomAdapterFactory';
import type { GameRoom } from '@/types/room';

const PLAYER_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

export function JoinRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, metadata } = useCurrentUser();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [useNostrProfile, setUseNostrProfile] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useSeoMeta({
    title: 'Join Room - Snaketoshi Squares',
    description: 'Join a multiplayer game',
  });

  useEffect(() => {
    if (!roomId) return;
    const adapter = getRoomAdapter();
    adapter.getRoom(roomId).then(r => {
      setRoom(r);
      setLoadingRoom(false);
      if (!r) {
        toast({ title: 'Room not found', description: 'This room may have expired or the code is invalid', variant: 'destructive' });
      }
    });
  }, [roomId, toast]);

  const displayName = useNostrProfile && metadata
    ? (metadata.display_name || metadata.name || 'Anon')
    : playerName;

  const handleJoin = async () => {
    if (!roomId || !room) return;

    const name = displayName.trim();
    if (!name) {
      toast({ title: 'Name required', description: 'Please enter your name or use your Nostr profile', variant: 'destructive' });
      return;
    }

    setIsJoining(true);
    try {
      const colorIndex = room.players.length % PLAYER_COLORS.length;
      const playerId = `player-${Date.now()}`;

      const adapter = getRoomAdapter();
      await adapter.joinRoom(roomId, {
        id: playerId,
        name,
        color: PLAYER_COLORS[colorIndex],
        nostrPubkey: useNostrProfile ? user?.pubkey : undefined,
      });

      localStorage.setItem(`room-${roomId}-player-id`, playerId);

      toast({ title: 'Joined!', description: `Welcome, ${name}` });
      // If game already started, go directly to the game — not the lobby
      if (room.status === 'active') {
        navigate(`/room/${roomId}/play`);
      } else {
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      toast({ title: 'Failed to join room', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-lg">
                  <LogIn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-3xl">Join Room</CardTitle>
              </div>
              <CardDescription className="text-base">
                Enter your name to join the game
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {loadingRoom ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : room === null ? (
                <div className="p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 text-center font-medium">
                    Room not found or has expired
                  </p>
                </div>
              ) : room.status === 'complete' ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-700 dark:text-amber-400 text-center font-medium">
                    This game has already finished
                  </p>
                </div>
              ) : (
                <>
                  {/* Room info banner */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Joining room <span className="font-mono font-bold">{room.code}</span>
                      {' '} · {room.players.length} player{room.players.length !== 1 ? 's' : ''} waiting
                    </p>
                  </div>

                  {/* Nostr Profile Option */}
                  {user && (
                    <div className="p-4 bg-violet-50 dark:bg-violet-950 rounded-lg border-2 border-violet-200 dark:border-violet-800">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="use-nostr"
                          checked={useNostrProfile}
                          onCheckedChange={(checked) => setUseNostrProfile(checked as boolean)}
                        />
                        <div className="flex-1">
                          <Label htmlFor="use-nostr" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Use my Nostr profile
                          </Label>
                          {metadata && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Playing as: {metadata.display_name || metadata.name || 'Anon'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Player Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold">Your Name</Label>
                    <Input
                      id="name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={useNostrProfile}
                      className="text-lg"
                      autoFocus={!useNostrProfile}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                    />
                  </div>

                  <Button
                    onClick={handleJoin}
                    disabled={isJoining || !displayName.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    size="lg"
                  >
                    {isJoining ? 'Joining...' : 'Join Room'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom;
