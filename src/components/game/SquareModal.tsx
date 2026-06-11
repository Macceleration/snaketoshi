import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, SkipForward, ArrowDown, ArrowUp, Radio } from 'lucide-react';
import type { Square, Player, Board } from '@/types/game';
import { extractYouTubeId, createEmbedUrl } from '@/lib/youtube';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { createPlayBroadcastEvent } from '@/lib/nostrEvents';
import { squareToTile } from '@/lib/boardAdapter';

interface SquareModalProps {
  square: Square;
  isOpen: boolean;
  showVideo: boolean;
  onShowVideo: () => void;
  onSkipVideo: () => void;
  onClose: () => void;
  // Optional props for broadcasting
  currentPlayer?: Player;
  roll?: number;
  transition?: {
    type: 'snake' | 'ladder';
    from: number;
    to: number;
  };
  board?: Board;
  roomId?: string;
}

export function SquareModal({
  square,
  isOpen,
  showVideo,
  onShowVideo,
  onSkipVideo,
  onClose,
  currentPlayer,
  roll,
  transition,
  board,
  roomId,
}: SquareModalProps) {
  const hasVideo = square.video !== null;
  const hasSnake = square.snake !== null;
  const hasLadder = square.ladder !== null;
  const hasInterfaithReferences = square.interfaithReferences && square.interfaithReferences.length > 0;
  const hasMemeEncounters = square.memeEncounters && square.memeEncounters.length > 0;

  const videoId = hasVideo && square.video ? extractYouTubeId(square.video) : null;
  const embedUrl = videoId ? createEmbedUrl(videoId, true) : null;

  const { user } = useCurrentUser();
  const { mutate: publish, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login with Nostr to broadcast your plays',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPlayer || !roll || !board) {
      toast({
        title: 'Cannot broadcast',
        description: 'Missing game state information',
        variant: 'destructive',
      });
      return;
    }

    setIsBroadcasting(true);

    const tile = squareToTile(square);
    const eventTemplate = createPlayBroadcastEvent({
      player: currentPlayer,
      tile,
      roll,
      transition,
      board,
      roomId,
    });

    publish(eventTemplate, {
      onSuccess: () => {
        toast({
          title: 'Broadcasted! 🐸',
          description: 'Your play has been shared to Nostr',
        });
        setIsBroadcasting(false);
      },
      onError: (error) => {
        toast({
          title: 'Broadcast failed',
          description: error.message || 'Could not publish to Nostr',
          variant: 'destructive',
        });
        setIsBroadcasting(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl flex items-center gap-3 flex-wrap">
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              {square.number}
            </span>
            <span>{square.title}</span>
            {square.marketCycleLabel && (
              <span className="text-sm font-normal px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                {square.marketCycleLabel}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sanskrit Name */}
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sanskrit
            </div>
            <div className="text-2xl font-serif text-purple-700 dark:text-purple-400">
              {square.sanskrit}
            </div>
          </div>

          {/* Snake/Ladder Alert */}
          {(hasSnake || hasLadder) && (
            <Card className={`border-2 ${hasSnake ? 'border-red-400 bg-red-50 dark:bg-red-950' : 'border-green-400 bg-green-50 dark:bg-green-950'}`}>
              <CardContent className="py-3 flex items-center justify-center gap-2">
                {hasSnake && (
                  <>
                    <ArrowDown className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-700 dark:text-red-400">
                      Snake! Descending to square {square.snake}
                    </span>
                  </>
                )}
                {hasLadder && (
                  <>
                    <ArrowUp className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700 dark:text-green-400">
                      Ladder! Ascending to square {square.ladder}
                    </span>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Meaning */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Meaning
            </h3>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {square.meaning}
            </p>
          </div>

          {/* Reflection Prompt */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                Reflection
              </h3>
              <p className="text-amber-950 dark:text-amber-100 leading-relaxed italic">
                "{square.reflection}"
              </p>
            </CardContent>
          </Card>

          {/* Interfaith Echoes */}
          {hasInterfaithReferences && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 uppercase tracking-wide">
                  Interfaith Echoes
                </h3>
                <div className="space-y-3">
                  {square.interfaithReferences!.map((ref, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                        <span>{ref.tradition}</span>
                        <span className="text-blue-400 dark:text-blue-600">•</span>
                        <span className="font-mono text-xs">{ref.reference}</span>
                      </div>
                      <p className="text-sm text-blue-900 dark:text-blue-200 italic">
                        "{ref.quote}"
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {ref.commentary}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meme Encounters */}
          {hasMemeEncounters && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800">
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 uppercase tracking-wide">
                  Meme Encounter{square.memeEncounters!.length > 1 ? 's' : ''}
                </h3>
                <div className="space-y-4">
                  {square.memeEncounters!.map((meme, index) => (
                    <div key={index} className="space-y-2">
                      {/* Meme placeholder visual */}
                      <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-900 border-2 border-green-300 dark:border-green-700 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">🐸</div>
                        <p className="text-xs text-green-700 dark:text-green-400 italic">
                          {meme.prompt}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-900 dark:text-green-200 text-center">
                        "{meme.caption}"
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Section */}
          {hasVideo && (
            <div className="space-y-3">
              {!showVideo ? (
                <div className="flex gap-2">
                  <Button
                    onClick={onShowVideo}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Play Video
                  </Button>
                  <Button
                    onClick={onSkipVideo}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {embedUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title={square.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <Button
                    onClick={onClose}
                    className="w-full"
                    size="lg"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Broadcast Button */}
          <Button
            onClick={handleBroadcast}
            disabled={!user || isBroadcasting || isPending}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Radio className="w-5 h-5 mr-2" />
            {!user 
              ? 'Login with Nostr to broadcast' 
              : isBroadcasting || isPending
              ? 'Broadcasting...'
              : 'Broadcast this play'}
          </Button>

          {/* Continue Button (if no video) */}
          {!hasVideo && (
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
              size="lg"
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
