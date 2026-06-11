import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Users, Play } from 'lucide-react';

const Index = () => {
  useSeoMeta({
    title: 'Snaketoshi Squares - Moksha Patam',
    description: 'A spiritual journey through 72 squares of wisdom. Play the ancient game of snakes and ladders with Bitcoin and Nostr culture.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
            Snaketoshi Squares
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            Moksha Patam • Leela • The Game of Self-Knowledge
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            An ancient game of consciousness disguised as snakes and ladders. 
            72 squares. Infinite wisdom. Each roll reveals a teaching.
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Link to="/play?mode=single">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-400 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900 dark:to-rose-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-2xl">Solo Journey</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Walk the path alone. Each square is a mirror for self-reflection and inner exploration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600" size="lg">
                  Begin Solo Game
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/play?mode=multiplayer">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-400 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Shared Quest</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Play with friends. Share the wisdom. Create a room and journey together.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" size="lg">
                  Create Multiplayer Room
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* About the Game */}
        <Card className="max-w-4xl mx-auto border-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Dices className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-2xl">About the Game</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Moksha Patam</strong> (also known as Leela or Snakes and Ladders) is an ancient Indian board game 
              that maps the journey of consciousness through 72 stages of awareness.
            </p>
            <p>
              Each square represents a state of being—from anger and illusion to wisdom and liberation. 
              <strong> Snakes</strong> represent falls into unconsciousness. <strong>Ladders</strong> represent leaps of grace.
            </p>
            <p>
              This digital version honors the tradition while weaving in Bitcoin, Nostr, and sovereignty culture. 
              Roll the dice. Land on a square. Reflect on the teaching. Let the game play you.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t">
              Vibed with <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">Shakespeare</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
