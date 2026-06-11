import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, GitFork, Layers } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  createBlankBoard,
  cloneBoard,
  saveBoardLocal,
  loadBoardById,
  getTemplateBoards,
} from '@/lib/boards';
import type { CustomBoard } from '@/types/board';

type Mode = 'choose' | 'blank' | 'template';

export function NewBoard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // If ?from=<boardId> we pre-fill the clone flow
  const fromId = searchParams.get('from');

  const [mode, setMode] = useState<Mode>(fromId ? 'template' : 'choose');
  const [templates, setTemplates] = useState<CustomBoard[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomBoard | null>(null);
  const [loading, setLoading] = useState(!!fromId);
  const [saving, setSaving] = useState(false);

  // Blank board fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');

  useSeoMeta({
    title: 'New Board — Snaketoshi Squares',
    description: 'Create a custom Moksha Patam board from scratch or from a template.',
  });

  useEffect(() => {
    getTemplateBoards().then(boards => {
      setTemplates(boards);
      if (fromId) {
        loadBoardById(fromId).then(board => {
          if (board) {
            setSelectedTemplate(board);
            setTitle(`${board.title} (my fork)`);
            setSubtitle(board.subtitle);
            setDescription(board.description);
          }
          setLoading(false);
        });
      }
    });
  }, [fromId]);

  const handleCreateBlank = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const board = createBlankBoard({ title: title.trim(), subtitle, description });
      saveBoardLocal(board);
      toast({ title: 'Board created!', description: `"${board.title}" — 72 blank tiles ready to edit.` });
      navigate(`/boards/${board.id}/edit`);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleForkTemplate = async () => {
    if (!selectedTemplate) return;
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const board = cloneBoard(selectedTemplate, {
        title: title.trim(),
        subtitle,
        description,
      });
      saveBoardLocal(board);
      toast({ title: 'Board forked!', description: `"${board.title}" ready to edit.` });
      navigate(`/boards/${board.id}/edit`);
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900 p-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-orange-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/boards')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Create a Board</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build your own symbolic map of consciousness, markets, or anything else.
            </p>
          </div>

          {/* ── Mode chooser ── */}
          {mode === 'choose' && (
            <div className="grid sm:grid-cols-3 gap-4">
              <ModeCard
                icon={<Plus className="w-8 h-8 text-purple-500" />}
                title="Start Blank"
                description="72 numbered tiles with no content. Totally yours to define."
                onClick={() => setMode('blank')}
              />
              <ModeCard
                icon={<GitFork className="w-8 h-8 text-orange-500" />}
                title="Fork Base Board"
                description="Start from the Snaketoshi Moksha Patam board and make it your own."
                onClick={() => {
                  const base = templates.find(t => t.id === 'snaketoshi-base');
                  if (base) {
                    setSelectedTemplate(base);
                    setTitle(`${base.title} (my fork)`);
                    setSubtitle(base.subtitle);
                    setDescription(base.description);
                  }
                  setMode('template');
                }}
              />
              <ModeCard
                icon={<Layers className="w-8 h-8 text-green-500" />}
                title="Use a Template"
                description="Choose from available template boards to remix."
                onClick={() => setMode('template')}
              />
            </div>
          )}

          {/* ── Blank form ── */}
          {mode === 'blank' && (
            <Card className="border-2 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-500" />
                  New Blank Board
                </CardTitle>
                <CardDescription>
                  Creates 72 empty tiles numbered 1–72. Edit them however you like.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BoardMetaFields
                  title={title}
                  subtitle={subtitle}
                  description={description}
                  onTitle={setTitle}
                  onSubtitle={setSubtitle}
                  onDescription={setDescription}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setMode('choose')}>Back</Button>
                  <Button
                    onClick={handleCreateBlank}
                    disabled={saving || !title.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {saving ? 'Creating…' : 'Create Blank Board'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Template chooser + fork form ── */}
          {mode === 'template' && (
            <Card className="border-2 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-orange-500" />
                  Fork a Template
                </CardTitle>
                <CardDescription>
                  A full copy of the template will be created. The original stays read-only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template picker */}
                <div className="space-y-2">
                  <Label>Choose template</Label>
                  <div className="space-y-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t);
                          if (!title || title.includes('fork')) {
                            setTitle(`${t.title} (my fork)`);
                            setSubtitle(t.subtitle);
                            setDescription(t.description);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedTemplate?.id === t.id
                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-950'
                            : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                        }`}
                      >
                        <p className="font-semibold text-sm">{t.title}</p>
                        {t.subtitle && <p className="text-xs text-gray-500 italic">{t.subtitle}</p>}
                        <p className="text-xs text-gray-500 mt-1">{t.totalSquares} squares</p>
                      </button>
                    ))}
                  </div>
                </div>

                <BoardMetaFields
                  title={title}
                  subtitle={subtitle}
                  description={description}
                  onTitle={setTitle}
                  onSubtitle={setSubtitle}
                  onDescription={setDescription}
                />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setMode('choose'); setSelectedTemplate(null); }}>
                    Back
                  </Button>
                  <Button
                    onClick={handleForkTemplate}
                    disabled={saving || !title.trim() || !selectedTemplate}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                  >
                    {saving ? 'Forking…' : 'Fork & Edit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ModeCard({ icon, title, description, onClick }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-400 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6 text-center space-y-3">
        <div className="flex justify-center">{icon}</div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function BoardMetaFields({ title, subtitle, description, onTitle, onSubtitle, onDescription }: {
  title: string;
  subtitle: string;
  description: string;
  onTitle: (v: string) => void;
  onSubtitle: (v: string) => void;
  onDescription: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="board-title">Board Title *</Label>
        <Input
          id="board-title"
          value={title}
          onChange={e => onTitle(e.target.value)}
          placeholder="My Consciousness Map"
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="board-subtitle">Subtitle <span className="text-gray-400">(optional)</span></Label>
        <Input
          id="board-subtitle"
          value={subtitle}
          onChange={e => onSubtitle(e.target.value)}
          placeholder="A short tagline"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="board-desc">Description <span className="text-gray-400">(optional)</span></Label>
        <Textarea
          id="board-desc"
          value={description}
          onChange={e => onDescription(e.target.value)}
          placeholder="What is this board about?"
          rows={3}
        />
      </div>
    </div>
  );
}

export default NewBoard;
