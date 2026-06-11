import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Users, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getRoomAdapter } from '@/lib/roomAdapterFactory';
import { isNostrMultiplayer } from '@/config/multiplayer';

const PLAYER_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

export function CreateRoom() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, metadata } = useCurrentUser();

  const [playerName, setPlayerName] = useState('');
  const [useNostrProfile, setUseNostrProfile] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const nostrMode = isNostrMultiplayer();

  useSeoMeta({
    title: 'Create Room - Snaketoshi Squares',
    description: 'Create a multiplayer room and invite friends to play',
  });

  const displayName = useNostrProfile && metadata
    ? (metadata.display_name || metadata.name || 'Anon')
    : playerName;

  const handleCreate = async () => {
    const name = displayName.trim();
    if (!name) {
      toast({ title: 'Name required', description: 'Please enter your name or use your Nostr profile', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const playerId = `player-${Date.now()}`;
      const adapter = getRoomAdapter();
      const room = await adapter.createRoom('default', {
        id: playerId,
        name,
        color: PLAYER_COLORS[0],
        nostrPubkey: useNostrProfile ? user?.pubkey : undefined,
      });

      // Store host player id for this room
      localStorage.setItem(`room-${room.id}-player-id`, playerId);

      toast({ title: 'Room created!', description: `Room code: ${room.code}` });
      navigate(`/room/${room.id}`);
    } catch (error) {
      toast({ title: 'Failed to create room', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsCreating(false);
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
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-3xl">Create Room</CardTitle>
              </div>
              <CardDescription className="text-base">
                Start a multiplayer game and invite friends to join
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Mode badge */}
              {nostrMode ? (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    🌐 Cross-device multiplayer enabled
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Friends can join from any device using the room code or link.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-300 dark:border-amber-700">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    ⚠️ Local alpha mode
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Rooms only work across tabs in this browser. Set{' '}
                    <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">VITE_MULTIPLAYER_MODE=nostr</code>{' '}
                    for cross-device play.
                  </p>
                </div>
              )}

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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={isCreating || !displayName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                You'll receive a 6-character code to share with friends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CreateRoom;
