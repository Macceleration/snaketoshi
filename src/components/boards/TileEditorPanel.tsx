import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Eye, Plus, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { SquareModal } from '@/components/game/SquareModal';
import { boardToGameBoard } from '@/lib/boards';
import { extractYouTubeId } from '@/lib/youtube';
import type { CustomBoard, CustomTile, CustomInterfaithReference, CustomMemeEncounter, BoardValidationError } from '@/types/board';
import type { Square } from '@/types/game';

interface TileEditorPanelProps {
  tile: CustomTile;
  board: CustomBoard;
  onChange: (updated: CustomTile) => void;
  validationErrors: BoardValidationError[];
}

export function TileEditorPanel({ tile, board, onChange, validationErrors }: TileEditorPanelProps) {
  const [showPreview, setShowPreview] = useState(false);

  const update = (partial: Partial<CustomTile>) => onChange({ ...tile, ...partial });

  const errors = validationErrors.filter(e => !e.message.startsWith('warning:'));
  const warnings = validationErrors.filter(e => e.message.startsWith('warning:'));

  const videoId = tile.videoUrl ? extractYouTubeId(tile.videoUrl) : null;

  // Build a legacy Square for preview reuse
  const previewSquare: Square = {
    number: tile.number,
    title: tile.title,
    sanskrit: tile.sanskrit,
    meaning: tile.meaning,
    reflection: tile.reflection,
    video: tile.videoUrl,
    snake: tile.snakeTo,
    ladder: tile.ladderTo,
    tags: tile.tags,
    marketCycleLabel: tile.marketCycleLabel ?? undefined,
    interfaithReferences: tile.interfaithReferences.map(r => ({
      tradition: r.tradition,
      reference: r.reference,
      quote: r.quote,
      commentary: r.commentary,
    })),
    memeEncounters: tile.memeEncounters.map(m => ({
      caption: m.caption,
      prompt: m.prompt,
      imageUrl: m.imageUrl,
    })),
  };

  return (
    <div className="space-y-4">
      {/* Validation alerts */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {e.message}
            </p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 space-y-1">
          {warnings.map((e, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {e.message.replace('warning: ', '')}
            </p>
          ))}
        </div>
      )}

      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-orange-600 dark:text-orange-400 text-xl font-bold">{tile.number}</span>
              <span>{tile.title || 'Untitled Tile'}</span>
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="gap-1 text-xs"
            >
              <Eye className="w-3 h-3" /> Preview
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Core fields */}
          <Section title="Identity">
            <FieldRow label="Title *">
              <Input value={tile.title} onChange={e => update({ title: e.target.value })} placeholder="Square name" />
            </FieldRow>
            <FieldRow label="Sanskrit / Alternate name">
              <Input value={tile.sanskrit} onChange={e => update({ sanskrit: e.target.value })} placeholder="Jñāna, Moksha…" />
            </FieldRow>
            <FieldRow label="Market Cycle Label">
              <Input value={tile.marketCycleLabel ?? ''} onChange={e => update({ marketCycleLabel: e.target.value || null })} placeholder="Bubble Peak, Capitulation…" />
            </FieldRow>
            <FieldRow label="Tags (comma-separated)">
              <Input
                value={tile.tags.join(', ')}
                onChange={e => update({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                placeholder="wisdom, fire, transformation"
              />
            </FieldRow>
          </Section>

          <Separator />

          {/* Meaning & reflection */}
          <Section title="Content">
            <FieldRow label="Meaning">
              <Textarea value={tile.meaning} onChange={e => update({ meaning: e.target.value })} rows={3} placeholder="What does this square mean?" />
            </FieldRow>
            <FieldRow label="Reflection prompt">
              <Textarea value={tile.reflection} onChange={e => update({ reflection: e.target.value })} rows={2} placeholder="What am I being asked to notice?" />
            </FieldRow>
          </Section>

          <Separator />

          {/* Snake & Ladder */}
          <Section title="Transitions">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400">
                  <ArrowDown className="w-3 h-3" /> Snake destination
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={board.totalSquares}
                  value={tile.snakeTo ?? ''}
                  onChange={e => update({ snakeTo: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 3"
                />
                <p className="text-xs text-gray-400">Leave empty for no snake</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowUp className="w-3 h-3" /> Ladder destination
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={board.totalSquares}
                  value={tile.ladderTo ?? ''}
                  onChange={e => update({ ladderTo: e.target.value ? Number(e.target.value) : null })}
                  placeholder="e.g. 29"
                />
                <p className="text-xs text-gray-400">Leave empty for no ladder</p>
              </div>
            </div>
          </Section>

          <Separator />

          {/* Video */}
          <Section title="Video">
            <FieldRow label="YouTube URL">
              <Input
                value={tile.videoUrl ?? ''}
                onChange={e => update({ videoUrl: e.target.value || null })}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </FieldRow>
            {tile.videoUrl && !videoId && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Not a recognised YouTube URL
              </p>
            )}
            {videoId && (
              <p className="text-xs text-green-600">✓ YouTube ID: {videoId}</p>
            )}
          </Section>

          <Separator />

          {/* Interfaith References */}
          <Section
            title="Interfaith Echoes"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => update({
                  interfaithReferences: [
                    ...tile.interfaithReferences,
                    { tradition: '', reference: '', quote: '', commentary: '' },
                  ],
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            }
          >
            {tile.interfaithReferences.length === 0 && (
              <p className="text-xs text-gray-400 italic">None yet. Add a cross-tradition echo.</p>
            )}
            {tile.interfaithReferences.map((ref, i) => (
              <InterfaithEditor
                key={i}
                ref_={ref}
                onChange={updated => {
                  const arr = [...tile.interfaithReferences];
                  arr[i] = updated;
                  update({ interfaithReferences: arr });
                }}
                onRemove={() => {
                  const arr = tile.interfaithReferences.filter((_, j) => j !== i);
                  update({ interfaithReferences: arr });
                }}
              />
            ))}
          </Section>

          <Separator />

          {/* Meme Encounters */}
          <Section
            title="Meme Encounters"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => update({
                  memeEncounters: [
                    ...tile.memeEncounters,
                    { caption: '', prompt: '' },
                  ],
                })}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            }
          >
            {tile.memeEncounters.length === 0 && (
              <p className="text-xs text-gray-400 italic">None yet. Add a meme encounter 🐸</p>
            )}
            {tile.memeEncounters.map((meme, i) => (
              <MemeEncounterEditor
                key={i}
                meme={meme}
                onChange={updated => {
                  const arr = [...tile.memeEncounters];
                  arr[i] = updated;
                  update({ memeEncounters: arr });
                }}
                onRemove={() => {
                  const arr = tile.memeEncounters.filter((_, j) => j !== i);
                  update({ memeEncounters: arr });
                }}
              />
            ))}
          </Section>
        </CardContent>
      </Card>

      {/* Preview modal */}
      {showPreview && (
        <SquareModal
          square={previewSquare}
          isOpen={true}
          showVideo={false}
          onShowVideo={() => {}}
          onSkipVideo={() => {}}
          onClose={() => setShowPreview(false)}
          board={boardToGameBoard(board)}
        />
      )}
    </div>
  );
}

// ── Sub-editors ───────────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-gray-600 dark:text-gray-400">{label}</Label>
      {children}
    </div>
  );
}

function InterfaithEditor({ ref_, onChange, onRemove }: {
  ref_: CustomInterfaithReference;
  onChange: (r: CustomInterfaithReference) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 border rounded-lg space-y-2 bg-blue-50/50 dark:bg-blue-950/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Reference</span>
        <Button size="sm" variant="ghost" onClick={onRemove} className="h-5 w-5 p-0 text-gray-400 hover:text-red-500">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input className="h-7 text-xs" placeholder="Tradition" value={ref_.tradition} onChange={e => onChange({ ...ref_, tradition: e.target.value })} />
        <Input className="h-7 text-xs" placeholder="Reference (e.g. Gita 2.47)" value={ref_.reference} onChange={e => onChange({ ...ref_, reference: e.target.value })} />
      </div>
      <Textarea className="text-xs" rows={2} placeholder="Quote" value={ref_.quote} onChange={e => onChange({ ...ref_, quote: e.target.value })} />
      <Textarea className="text-xs" rows={2} placeholder="Commentary" value={ref_.commentary} onChange={e => onChange({ ...ref_, commentary: e.target.value })} />
    </div>
  );
}

function MemeEncounterEditor({ meme, onChange, onRemove }: {
  meme: CustomMemeEncounter;
  onChange: (m: CustomMemeEncounter) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 border rounded-lg space-y-2 bg-green-50/50 dark:bg-green-950/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-green-700 dark:text-green-400">🐸 Meme</span>
        <Button size="sm" variant="ghost" onClick={onRemove} className="h-5 w-5 p-0 text-gray-400 hover:text-red-500">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <Input className="h-7 text-xs" placeholder="Caption" value={meme.caption} onChange={e => onChange({ ...meme, caption: e.target.value })} />
      <Textarea className="text-xs" rows={2} placeholder="Prompt / description" value={meme.prompt} onChange={e => onChange({ ...meme, prompt: e.target.value })} />
    </div>
  );
}
