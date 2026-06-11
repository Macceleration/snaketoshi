import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Copy, Check, Play, Users, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { getRoomAdapter } from '@/lib/roomAdapter';
import type { GameRoom, RoomPlayer } from '@/types/room';
import { LoginArea } from '@/components/auth/LoginArea';
import QRCode from 'qrcode';

export function RoomLobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  useSeoMeta({
    title: 'Room Lobby - Snaketoshi Squares',
    description: 'Waiting for players to join',
  });

  useEffect(() => {
    if (!roomId) return;

    const adapter = getRoomAdapter();
    
    // Load initial room state
    adapter.getRoom(roomId).then(r => {
      if (!r) {
        toast({
          title: 'Room not found',
          description: 'This room may have expired',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setRoom(r);
      setLoading(false);
      
      // Store current player ID from storage or first player
      const storedPlayerId = localStorage.getItem(`room-${roomId}-player-id`);
      if (storedPlayerId) {
        setCurrentPlayerId(storedPlayerId);
      }
    });

    // Subscribe to updates
    const unsubscribe = adapter.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom);
      
      // If game started, navigate to game page
      if (updatedRoom.status === 'active') {
        navigate(`/room/${roomId}/play`);
      }
    });

    return () => unsubscribe();
  }, [roomId, navigate, toast]);

  useEffect(() => {
    // Generate QR code for join URL
    if (roomId) {
      const joinUrl = `${window.location.origin}/room/${roomId}/join`;
      QRCode.toDataURL(joinUrl, { width: 256, margin: 2 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [roomId]);

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast({
        title: 'Code copied!',
        description: 'Share this code with friends',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/room/${roomId}/join`;
      navigator.clipboard.writeText(link);
      toast({
        title: 'Link copied!',
        description: 'Share this link with friends',
      });
    }
  };

  const handleStart = async () => {
    if (!roomId || !room) return;

    try {
      const adapter = getRoomAdapter();
      await adapter.startRoom(roomId);
      // Navigation will happen via subscription
    } catch (error) {
      toast({
        title: 'Failed to start game',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isHost = room && currentPlayerId === room.hostId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
        <div className="container mx-auto p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
          <LoginArea className="max-w-60" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Alpha Warning */}
          <Card className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
            <CardContent className="py-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                ⚠️ Same-Browser Multiplayer (Alpha)
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                To test multiplayer, open this join link in <strong>another tab</strong> on <strong>this same device/browser</strong>. 
                Cross-device multiplayer requires a backend server (coming soon).
              </p>
            </CardContent>
          </Card>

          {/* Room Info Card */}
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Game Lobby
                </CardTitle>
                {isHost && (
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
                    Host
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Room Code */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg border-2 border-purple-200 dark:border-purple-800 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold font-mono tracking-wider text-purple-700 dark:text-purple-400">
                    {room.code}
                  </span>
                  <Button
                    onClick={handleCopyCode}
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
              </div>

              {/* Share Options */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* QR Code */}
                {qrDataUrl && (
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border-2">
                    <p className="text-sm font-semibold mb-3">Scan to Join</p>
                    <img src={qrDataUrl} alt="Room QR Code" className="mx-auto w-48 h-48" />
                  </div>
                )}

                {/* Join Link */}
                <div className="flex flex-col justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border-2">
                  <p className="text-sm font-semibold mb-3">Or share link:</p>
                  <Button onClick={handleCopyLink} variant="outline" className="w-full">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Join Link
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all">
                    {window.location.origin}/room/{roomId}/join
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">
                Players ({room.players.length}/6)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {room.players.map((player: RoomPlayer) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="flex-1 font-semibold">
                      {player.name}
                      {player.isHost && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                          (Host)
                        </span>
                      )}
                    </span>
                    {player.isConnected ? (
                      <Wifi className="w-4 h-4 text-green-600" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>

              {room.players.length < 2 && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
                  Waiting for more players to join...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Start Button (Host Only) */}
          {isHost && (
            <Button
              onClick={handleStart}
              disabled={room.players.length < 1}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          )}

          {!isHost && (
            <Card className="border-2 border-dashed">
              <CardContent className="py-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Waiting for host to start the game...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomLobby;
