import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Upload,
  Play,
  Eye,
  GitFork,
  Pencil,
  Trash2,
  Lock,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  getTemplateBoards,
  loadLocalBoards,
  deleteLocalBoard,
  downloadBoardJson,
  importBoardJson,
  saveBoardLocal,
} from '@/lib/boards';
import type { CustomBoard } from '@/types/board';

export function BoardGallery() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<CustomBoard[]>([]);
  const [myBoards, setMyBoards] = useState<CustomBoard[]>([]);

  useSeoMeta({
    title: 'Board Gallery — Snaketoshi Squares',
    description: 'Browse, create, and play custom Moksha Patam boards.',
  });

  useEffect(() => {
    getTemplateBoards().then(setTemplates);
    setMyBoards(loadLocalBoards());
  }, []);

  const handleDelete = (board: CustomBoard) => {
    if (!confirm(`Delete "${board.title}"? This cannot be undone.`)) return;
    try {
      deleteLocalBoard(board.id);
      setMyBoards(loadLocalBoards());
      toast({ title: 'Board deleted' });
    } catch (e) {
      toast({ title: 'Cannot delete', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importBoardJson(ev.target?.result as string);
      if (!result.success || !result.board) {
        toast({
          title: 'Import failed',
          description: result.errors.join('; '),
          variant: 'destructive',
        });
        return;
      }
      saveBoardLocal(result.board);
      setMyBoards(loadLocalBoards());
      toast({ title: 'Board imported!', description: result.board.title });
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => importRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => navigate('/boards/new')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Board
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-orange-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
              Board Gallery
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Play the classic board, fork it to make it your own, or build something completely new.
            </p>
          </div>

          {/* ── Templates ── */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Base Templates
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onPlay={() => navigate(`/boards/${board.id}/play`)}
                  onView={() => navigate(`/boards/${board.id}`)}
                  onFork={() => navigate(`/boards/new?from=${board.id}`)}
                  onEdit={undefined}
                  onDelete={undefined}
                  onExport={() => downloadBoardJson(board)}
                />
              ))}
            </div>
          </section>

          {/* ── My Boards ── */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-purple-500" />
              My Boards
              {myBoards.length > 0 && (
                <span className="text-base font-normal text-gray-500">({myBoards.length})</span>
              )}
            </h2>
            {myBoards.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center space-y-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    No custom boards yet. Start blank, fork the base board, or import a JSON file.
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <Button variant="outline" onClick={() => navigate('/boards/new')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Blank
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/boards/new?from=snaketoshi-base`)}
                    >
                      <GitFork className="w-4 h-4 mr-2" />
                      Fork Base Board
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBoards.map(board => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onPlay={() => navigate(`/boards/${board.id}/play`)}
                    onView={() => navigate(`/boards/${board.id}`)}
                    onFork={() => navigate(`/boards/new?from=${board.id}`)}
                    onEdit={() => navigate(`/boards/${board.id}/edit`)}
                    onDelete={() => handleDelete(board)}
                    onExport={() => downloadBoardJson(board)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Board Card ────────────────────────────────────────────────────────────────

interface BoardCardProps {
  board: CustomBoard;
  onPlay: () => void;
  onView: () => void;
  onFork: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport: () => void;
}

function BoardCard({ board, onPlay, onView, onFork, onEdit, onDelete, onExport }: BoardCardProps) {
  const snakeCount = board.tiles.filter(t => t.snakeTo !== null).length;
  const ladderCount = board.tiles.filter(t => t.ladderTo !== null).length;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-2 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{board.title}</CardTitle>
            {board.subtitle && (
              <CardDescription className="italic">{board.subtitle}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {board.isReadOnly && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Lock className="w-3 h-3" /> Read-only
              </Badge>
            )}
            {board.isTemplate && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                Template
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {board.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{board.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{board.totalSquares} squares</span>
          {snakeCount > 0 && <span className="text-red-600">🐍 {snakeCount}</span>}
          {ladderCount > 0 && <span className="text-green-600">🪜 {ladderCount}</span>}
        </div>

        {/* Tags */}
        {board.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {board.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap mt-auto pt-2">
          <Button size="sm" onClick={onPlay} className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white">
            <Play className="w-3 h-3 mr-1" /> Play
          </Button>
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="w-3 h-3 mr-1" /> View
          </Button>
          <Button size="sm" variant="outline" onClick={onFork}>
            <GitFork className="w-3 h-3 mr-1" /> Fork
          </Button>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onExport} title="Export JSON">
            <Download className="w-3 h-3" />
          </Button>
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600 hover:text-red-700" title="Delete">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BoardGallery;
