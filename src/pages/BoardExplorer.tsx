import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';
import type { Square } from '@/types/game';
import squaresData from '@/data/squares.json';

export function BoardExplorer() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  useSeoMeta({
    title: 'Explore the Board - Snaketoshi Squares',
    description: 'Browse all 72 squares of wisdom, memes, and market cycles.',
  });

  const squares = squaresData as Square[];
  
  const filteredSquares = squares.filter(square => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      square.title.toLowerCase().includes(term) ||
      square.sanskrit.toLowerCase().includes(term) ||
      square.meaning.toLowerCase().includes(term) ||
      square.reflection.toLowerCase().includes(term) ||
      square.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      square.marketCycleLabel?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
              The 72 Squares
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
              Browse the full board of teachings, market cycles, interfaith wisdom, and meme encounters.
            </p>
            
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search squares..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSquares.map((square) => (
              <Card 
                key={square.number}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-400"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                    <span className="text-orange-600 dark:text-orange-400">
                      {square.number}
                    </span>
                    <span className="flex-1">{square.title}</span>
                    {square.snake !== null && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                        ↓{square.snake}
                      </span>
                    )}
                    {square.ladder !== null && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                        ↑{square.ladder}
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-purple-700 dark:text-purple-400 font-serif">
                    {square.sanskrit}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {square.meaning}
                  </p>
                  
                  {square.marketCycleLabel && (
                    <div className="pt-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                        {square.marketCycleLabel}
                      </span>
                    </div>
                  )}
                  
                  {square.tags && square.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {square.tags.map((tag, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {(square.video || square.interfaithReferences?.length || square.memeEncounters?.length) && (
                    <div className="flex gap-1 pt-2 text-xs text-gray-500">
                      {square.video && <span>📹</span>}
                      {square.interfaithReferences?.length && <span>🕊️</span>}
                      {square.memeEncounters?.length && <span>🐸</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSquares.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No squares found matching "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoardExplorer;
