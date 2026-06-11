import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Users, Play, LogIn, Map } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { JoinRoomDialog } from '@/components/room/JoinRoomDialog';

const Index = () => {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
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
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 dark:from-green-600 dark:via-emerald-700 dark:to-green-800 border-4 border-orange-300 dark:border-orange-700 shadow-2xl flex items-center justify-center">
            <div className="text-center text-xs md:text-sm font-mono text-white px-2">
              <div className="mb-1">🐸∞🐍</div>
              <div className="text-[10px] opacity-80">ouroboros</div>
            </div>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
            Snaketoshi Squares
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-8 font-medium italic">
            The meming of life
          </p>
          
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
