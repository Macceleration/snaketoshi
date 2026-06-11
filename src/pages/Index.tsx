import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Users, Play, Map } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { JoinRoomDialog } from '@/components/room/JoinRoomDialog';
import { isNostrMultiplayer } from '@/config/multiplayer';

const Index = () => {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const nostrMode = isNostrMultiplayer();
  useSeoMeta({
    title: 'Snaketoshi Squares - The Meming of Life',
    description: 'Life has ups and downs, like the Bitcoin market: bubbles, busts, snakes, ladders, lessons, and awakenings. Maybe the chaos has a board.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      {/* Header with Login */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
          <LoginArea className="max-w-60" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="https://blossom.dreamith.to/86c73646c245e98f0f56ef377e35ed811b460add8569595c6631351073cedb66.png"
            alt="Snaketoshi Squares — The meming of life"
            className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Title visually hidden — shown in the logo image above */}
          <h1 className="sr-only">Snaketoshi Squares — The meming of life</h1>
          <div className="space-y-4 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            <p>
              Life has ups and downs, like the Bitcoin market: <strong className="text-orange-600 dark:text-orange-400">bubbles</strong>, <strong className="text-red-600 dark:text-red-400">busts</strong>, snakes, ladders, lessons, and awakenings.
            </p>
            <p>
              Maybe the chaos has a board.
            </p>
            <p className="text-sm">
              72 squares. Ancient wisdom meets meme culture. Interfaith echoes. Market cycles. The sacred and the absurd, playing dice together.
            </p>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-12">
          <Link to="/play/local?mode=single" className="block">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-400 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900 dark:to-rose-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-lg">Play Local</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Solo or pass-and-play with friends on one device
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/room/create" className="block">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-400 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">Create Room</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start a game and share the link
                </p>
                {nostrMode ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    🌐 No Nostr account required
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Same-browser only (local mode)
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          <Card 
            className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400 cursor-pointer h-full"
            onClick={() => setJoinDialogOpen(true)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Join Room</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a room code to join friends
              </p>
              {nostrMode ? (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  🌐 Join from any device, no account needed
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  Same-browser only (local mode)
                </p>
              )}
            </CardContent>
          </Card>

          <Link to="/board" className="block">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-400 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900 dark:to-green-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">Explore Board</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Browse all 72 squares and their teachings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* About Section */}
        <Card className="max-w-4xl mx-auto border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Dices className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-2xl">What is this?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Moksha Patam</strong> (Leela, Snakes and Ladders) is an ancient Indian board game that maps the journey of consciousness through 72 stages. Each square is a mirror: anger, greed, wisdom, liberation.
            </p>
            <p>
              <strong className="text-orange-600 dark:text-orange-400">Snakes</strong> pull you down. <strong className="text-green-600 dark:text-green-400">Ladders</strong> lift you up. Sound familiar? It's also how markets work. How life works. How you work.
            </p>
            <p>
              This version mixes ancient wisdom with <strong>Bitcoin cycles</strong>, <strong>interfaith references</strong>, and <strong>meme culture</strong>. Pepe meets the Bhagavad Gita. Hot dog koans. Market euphoria as spiritual bypassing. Sacred silliness.
            </p>
            <p>
              Roll the dice. Land on a square. Get a teaching, a meme, maybe a YouTube rabbit hole. Let the game play you.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
              Vibed with <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">Shakespeare</a>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Join Room Dialog */}
      <JoinRoomDialog 
        isOpen={joinDialogOpen} 
        onClose={() => setJoinDialogOpen(false)} 
      />
    </div>
  );
};

export default Index;
