import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, SkipForward, ArrowDown, ArrowUp } from 'lucide-react';
import type { Square } from '@/types/game';

interface SquareModalProps {
  square: Square;
  isOpen: boolean;
  showVideo: boolean;
  onShowVideo: () => void;
  onSkipVideo: () => void;
  onClose: () => void;
}

export function SquareModal({
  square,
  isOpen,
  showVideo,
  onShowVideo,
  onSkipVideo,
  onClose,
}: SquareModalProps) {
  const hasVideo = square.video !== null;
  const hasSnake = square.snake !== null;
  const hasLadder = square.ladder !== null;

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = hasVideo && square.video ? getYouTubeId(square.video) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl flex items-center gap-3">
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              {square.number}
            </span>
            <span>{square.title}</span>
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
                  {videoId && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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
