import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Pencil, GitFork, Search, Lock } from 'lucide-react';
import { loadBoardById } from '@/lib/boards';
import type { CustomBoard, CustomTile } from '@/types/board';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [board, setBoard] = useState<CustomBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useSeoMeta({
    title: board ? `${board.title} — Snaketoshi Boards` : 'Board — Snaketoshi Squares',
    description: board?.description ?? 'Browse board tiles.',
  });

  useEffect(() => {
    if (!boardId) return;
    loadBoardById(boardId).then(b => {
      setBoard(b);
      setLoading(false);
    });
  }, [boardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 p-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-32 w-full max-w-4xl mx-auto mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 p-8">
        <Button variant="ghost" onClick={() => navigate('/boards')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gallery
        </Button>
        <div className="text-center py-20 text-gray-500">Board not found.</div>
      </div>
    );
  }

  const filtered = board.tiles.filter(t => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.sanskrit.toLowerCase().includes(term) ||
      t.meaning.toLowerCase().includes(term) ||
      t.reflection.toLowerCase().includes(term) ||
      t.tags.some(tag => tag.toLowerCase().includes(term)) ||
      (t.marketCycleLabel ?? '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/boards')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gallery
        </Button>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Board header */}
          <Card className="border-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-3xl font-bold">{board.title}</h1>
                    {board.isReadOnly && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="w-3 h-3" /> Read-only
                      </Badge>
                    )}
                  </div>
                  {board.subtitle && (
                    <p className="text-lg italic text-gray-600 dark:text-gray-400 mb-2">{board.subtitle}</p>
                  )}
                  {board.description && (
                    <p className="text-gray-600 dark:text-gray-400">{board.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>{board.totalSquares} squares</span>
                    <span>{board.rows}×{board.columns} grid</span>
                    <span>{board.tiles.filter(t => t.snakeTo !== null).length} 🐍</span>
                    <span>{board.tiles.filter(t => t.ladderTo !== null).length} 🪜</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => navigate(`/boards/${board.id}/play`)}
                    className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                  >
                    <Play className="w-4 h-4 mr-2" /> Play
                  </Button>
                  {!board.isReadOnly && (
                    <Button variant="outline" onClick={() => navigate(`/boards/${board.id}/edit`)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate(`/boards/new?from=${board.id}`)}>
                    <GitFork className="w-4 h-4 mr-2" /> Fork
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tiles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tiles grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tile => <TileCard key={tile.number} tile={tile} />)}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No tiles match "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TileCard({ tile }: { tile: CustomTile }) {
  return (
    <Card className="hover:shadow-lg transition-all border-2 hover:border-orange-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <span className="text-orange-600 dark:text-orange-400 font-bold">{tile.number}</span>
          <span className="flex-1">{tile.title}</span>
          {tile.snakeTo !== null && (
            <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">↓{tile.snakeTo}</span>
          )}
          {tile.ladderTo !== null && (
            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">↑{tile.ladderTo}</span>
          )}
        </CardTitle>
        {tile.sanskrit && (
          <p className="text-sm text-purple-700 dark:text-purple-400 font-serif">{tile.sanskrit}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {tile.meaning && <p className="text-sm text-gray-700 dark:text-gray-300">{tile.meaning}</p>}
        {tile.marketCycleLabel && (
          <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">{tile.marketCycleLabel}</Badge>
        )}
        {tile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tile.tags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex gap-1 text-xs text-gray-500">
          {tile.videoUrl && <span>📹</span>}
          {tile.interfaithReferences.length > 0 && <span>🕊️ {tile.interfaithReferences.length}</span>}
          {tile.memeEncounters.length > 0 && <span>🐸 {tile.memeEncounters.length}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default BoardView;
