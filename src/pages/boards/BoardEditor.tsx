import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  Play,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  loadBoardById,
  saveBoardLocal,
  saveDraft,
  deleteDraft,
  validateBoard,
  downloadBoardJson,
} from '@/lib/boards';
import type { CustomBoard, CustomTile } from '@/types/board';
import { TileEditorPanel } from '@/components/boards/TileEditorPanel';

export function BoardEditor() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [board, setBoard] = useState<CustomBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedTileNumber, setSelectedTileNumber] = useState<number>(1);
  const [showMetaEditor, setShowMetaEditor] = useState(false);

  useSeoMeta({
    title: board ? `Edit: ${board.title} — Snaketoshi Boards` : 'Board Editor — Snaketoshi Squares',
  });

  useEffect(() => {
    if (!boardId) return;
    loadBoardById(boardId).then(b => {
      if (!b) {
        toast({ title: 'Board not found', variant: 'destructive' });
        navigate('/boards');
        return;
      }
      if (b.isReadOnly) {
        toast({ title: 'Read-only board', description: 'Fork it first to edit.', variant: 'destructive' });
        navigate(`/boards/${boardId}`);
        return;
      }
      setBoard(b);
      setLoading(false);
    });
  }, [boardId, navigate, toast]);

  // Autosave draft on change (debounced via useEffect cleanup)
  useEffect(() => {
    if (!board || !isDirty) return;
    const timer = setTimeout(() => {
      saveDraft(board);
    }, 1500);
    return () => clearTimeout(timer);
  }, [board, isDirty]);

  const updateBoard = useCallback((updates: Partial<CustomBoard>) => {
    setBoard(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  }, []);

  const updateTile = useCallback((updated: CustomTile) => {
    setBoard(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tiles: prev.tiles.map(t => t.number === updated.number ? updated : t),
      };
    });
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!board) return;
    setSaving(true);
    try {
      const validation = validateBoard(board);
      const realErrors = validation.errors.filter(e => !e.message.startsWith('warning:'));
      if (realErrors.length > 0) {
        toast({
          title: `${realErrors.length} validation error${realErrors.length > 1 ? 's' : ''}`,
          description: realErrors[0].message,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }
      saveBoardLocal({ ...board, version: board.version + 1 });
      deleteDraft(board.id);
      setBoard(b => b ? { ...b, version: b.version + 1 } : null);
      setIsDirty(false);
      toast({ title: 'Board saved ✓' });
    } catch (e) {
      toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedTile = board?.tiles.find(t => t.number === selectedTileNumber) ?? board?.tiles[0] ?? null;

  const validation = board ? validateBoard(board) : null;
  const errorCount = validation?.errors.filter(e => !e.message.startsWith('warning:')).length ?? 0;
  const warningCount = validation?.errors.filter(e => e.message.startsWith('warning:')).length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 p-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-[280px,1fr] gap-6 max-w-7xl mx-auto">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/boards/${board.id}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold truncate max-w-xs">{board.title}</h1>
                {isDirty && <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">Unsaved</Badge>}
              </div>
              <p className="text-xs text-gray-500">v{board.version} · {board.totalSquares} tiles</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Validation status */}
            {errorCount > 0 ? (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </span>
            ) : warningCount > 0 ? (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                {warningCount} warning{warningCount > 1 ? 's' : ''}
              </span>
            ) : board && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" /> Valid
              </span>
            )}

            <Button size="sm" variant="outline" onClick={() => navigate(`/boards/${board.id}/play`)}>
              <Play className="w-3 h-3 mr-1" /> Preview
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadBoardJson(board)}>
              <Download className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Save className="w-3 h-3 mr-1" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
          {/* ── Left: tile list ── */}
          <aside className="space-y-4">
            {/* Board meta editor toggle */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Board Settings</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMetaEditor(m => !m)}
                    className="h-7 px-2"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              {showMetaEditor && (
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={board.title}
                      onChange={e => updateBoard({ title: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={board.subtitle}
                      onChange={e => updateBoard({ subtitle: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={board.description}
                      onChange={e => updateBoard({ description: e.target.value })}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tags (comma-separated)</Label>
                    <Input
                      value={board.tags.join(', ')}
                      onChange={e => updateBoard({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className="h-8 text-sm"
                      placeholder="wisdom, bitcoin, …"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Separator />

            {/* Tile list */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tiles ({board.tiles.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[55vh] overflow-y-auto">
                  {board.tiles.map(tile => {
                    const hasErrors = validation?.errors.some(
                      e => e.field.startsWith(`tiles[${tile.number - 1}]`) && !e.message.startsWith('warning:')
                    );
                    const hasWarnings = !hasErrors && validation?.errors.some(
                      e => e.field.startsWith(`tiles[${tile.number - 1}]`)
                    );
                    const isSelected = tile.number === selectedTileNumber;

                    return (
                      <button
                        key={tile.number}
                        type="button"
                        onClick={() => setSelectedTileNumber(tile.number)}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors flex items-center gap-2 ${
                          isSelected
                            ? 'bg-orange-100 dark:bg-orange-900/50 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <span className={`w-6 text-xs font-mono shrink-0 ${
                          isSelected ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          {tile.number}
                        </span>
                        <span className="flex-1 truncate">{tile.title || <em className="text-gray-400">Untitled</em>}</span>
                        <span className="flex gap-0.5 shrink-0">
                          {tile.snakeTo !== null && <span className="text-red-500 text-xs">🐍</span>}
                          {tile.ladderTo !== null && <span className="text-green-500 text-xs">🪜</span>}
                          {hasErrors && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {hasWarnings && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* ── Right: tile editor ── */}
          <main>
            {selectedTile ? (
              <TileEditorPanel
                tile={selectedTile}
                board={board}
                onChange={updateTile}
                validationErrors={(validation?.errors ?? []).filter(
                  e => e.field.startsWith(`tiles[${selectedTile.number - 1}]`)
                )}
              />
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-20 text-center text-gray-500">
                  Select a tile from the list to edit it.
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Nostr publish teaser */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Card className="border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30">
          <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">🌐 Publish to Nostr</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Share your board on Nostr relays so anyone can play it. <em>Coming soon.</em></p>
            </div>
            <Button size="sm" variant="outline" disabled className="border-purple-300 text-purple-500">
              Publish (coming soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BoardEditor;
