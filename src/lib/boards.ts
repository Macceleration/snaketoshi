/**
 * Board management library
 *
 * Handles: templates, blank board creation, cloning, validation,
 * localStorage persistence, JSON import/export, and game-engine conversion.
 */

import type { CustomBoard, CustomTile, BoardValidationResult, BoardValidationError } from '@/types/board';
import type { Board, Tile } from '@/types/game';
import { isYouTubeUrl } from './youtube';

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEY_CUSTOM_BOARDS = 'snaketoshi-custom-boards';
export const STORAGE_KEY_DRAFTS = 'snaketoshi-board-drafts';

// ─── Built-in template ────────────────────────────────────────────────────────

// Lazy-load to avoid circular dependency at module init
let _baseBoardCache: CustomBoard | null = null;

/** Return the built-in Snaketoshi base board as a read-only template. */
export async function getBaseBoardTemplate(): Promise<CustomBoard> {
  if (_baseBoardCache) return _baseBoardCache;
  const data = await import('@/data/boards/snaketoshi-base-board.json');
  _baseBoardCache = data.default as CustomBoard;
  return _baseBoardCache;
}

/** Return all available template boards (currently just the base board). */
export async function getTemplateBoards(): Promise<CustomBoard[]> {
  const base = await getBaseBoardTemplate();
  return [base];
}

// ─── Board creation ───────────────────────────────────────────────────────────

interface CreateBlankBoardOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  rows?: number;
  columns?: number;
  authorName?: string | null;
  authorPubkey?: string | null;
}

/** Create a new blank board with numbered-but-empty tiles. */
export function createBlankBoard(options: CreateBlankBoardOptions = {}): CustomBoard {
  const rows = options.rows ?? 8;
  const columns = options.columns ?? 9;
  const totalSquares = rows * columns;
  const now = Date.now();
  const id = `board-${now}-${Math.random().toString(36).slice(2, 9)}`;

  const tiles: CustomTile[] = Array.from({ length: totalSquares }, (_, i) => ({
    number: i + 1,
    title: `Square ${i + 1}`,
    sanskrit: '',
    meaning: '',
    reflection: '',
    videoUrl: null,
    snakeTo: null,
    ladderTo: null,
    tags: [],
    marketCycleLabel: null,
    interfaithReferences: [],
    memeEncounters: [],
  }));

  return {
    id,
    slug: slugify(options.title ?? 'untitled-board'),
    title: options.title ?? 'Untitled Board',
    subtitle: options.subtitle ?? '',
    description: options.description ?? '',
    authorName: options.authorName ?? null,
    authorPubkey: options.authorPubkey ?? null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceTemplateId: null,
    isTemplate: false,
    isReadOnly: false,
    rows,
    columns,
    totalSquares,
    path: 'serpentine',
    tags: [],
    tiles,
  };
}

/** Deep-clone a template board into a new editable custom board. */
export function cloneBoard(
  template: CustomBoard,
  overrides: Partial<Pick<CustomBoard, 'title' | 'subtitle' | 'description' | 'authorName' | 'authorPubkey'>> = {},
): CustomBoard {
  const now = Date.now();
  const id = `board-${now}-${Math.random().toString(36).slice(2, 9)}`;
  const title = overrides.title ?? `${template.title} (copy)`;

  return {
    ...structuredClone(template),
    id,
    slug: slugify(title),
    title,
    subtitle: overrides.subtitle ?? template.subtitle,
    description: overrides.description ?? template.description,
    authorName: overrides.authorName ?? null,
    authorPubkey: overrides.authorPubkey ?? null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceTemplateId: template.id,
    isTemplate: false,
    isReadOnly: false,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validate a board and return structured errors. */
export function validateBoard(board: CustomBoard): BoardValidationResult {
  const errors: BoardValidationError[] = [];

  if (!board.title.trim()) {
    errors.push({ field: 'title', message: 'Board title is required' });
  }

  if (board.tiles.length !== board.totalSquares) {
    errors.push({
      field: 'tiles',
      message: `Board has ${board.tiles.length} tiles but totalSquares is ${board.totalSquares}`,
    });
  }

  const numbers = new Set<number>();
  board.tiles.forEach((tile, idx) => {
    const prefix = `tiles[${idx}]`;

    // Duplicate number check
    if (numbers.has(tile.number)) {
      errors.push({ field: `${prefix}.number`, message: `Duplicate tile number ${tile.number}` });
    }
    numbers.add(tile.number);

    if (!tile.title.trim()) {
      errors.push({ field: `${prefix}.title`, message: `Tile ${tile.number} title is required` });
    }

    // Snake destination validation
    if (tile.snakeTo !== null) {
      if (tile.snakeTo < 1 || tile.snakeTo > board.totalSquares) {
        errors.push({
          field: `${prefix}.snakeTo`,
          message: `Tile ${tile.number}: snake destination ${tile.snakeTo} is out of range (1–${board.totalSquares})`,
        });
      } else if (tile.snakeTo === tile.number) {
        errors.push({
          field: `${prefix}.snakeTo`,
          message: `Tile ${tile.number}: snake destination cannot be the tile itself`,
        });
      }
      // Warn (non-blocking) if snake goes upward — stored as error with "warning:" prefix
      // so UI can distinguish. Keeping in errors array for simplicity.
      if (tile.snakeTo !== null && tile.snakeTo > tile.number) {
        errors.push({
          field: `${prefix}.snakeTo`,
          message: `warning: Tile ${tile.number}: snake destination ${tile.snakeTo} is higher than the tile (snakes usually descend)`,
        });
      }
    }

    // Ladder destination validation
    if (tile.ladderTo !== null) {
      if (tile.ladderTo < 1 || tile.ladderTo > board.totalSquares) {
        errors.push({
          field: `${prefix}.ladderTo`,
          message: `Tile ${tile.number}: ladder destination ${tile.ladderTo} is out of range (1–${board.totalSquares})`,
        });
      } else if (tile.ladderTo === tile.number) {
        errors.push({
          field: `${prefix}.ladderTo`,
          message: `Tile ${tile.number}: ladder destination cannot be the tile itself`,
        });
      }
      if (tile.ladderTo !== null && tile.ladderTo < tile.number) {
        errors.push({
          field: `${prefix}.ladderTo`,
          message: `warning: Tile ${tile.number}: ladder destination ${tile.ladderTo} is lower than the tile (ladders usually ascend)`,
        });
      }
    }

    // Video URL validation
    if (tile.videoUrl && !isYouTubeUrl(tile.videoUrl)) {
      errors.push({
        field: `${prefix}.videoUrl`,
        message: `Tile ${tile.number}: video URL does not appear to be a valid YouTube URL`,
      });
    }
  });

  // Real errors are non-warning entries
  const realErrors = errors.filter(e => !e.message.startsWith('warning:'));

  return {
    valid: realErrors.length === 0,
    errors,
  };
}

// ─── localStorage persistence ─────────────────────────────────────────────────

/** Save or update a custom board in localStorage. */
export function saveBoardLocal(board: CustomBoard): void {
  if (board.isReadOnly) throw new Error('Cannot save a read-only board');

  const boards = loadLocalBoards();
  const idx = boards.findIndex(b => b.id === board.id);
  const updated = { ...board, updatedAt: Date.now() };

  if (idx >= 0) {
    boards[idx] = updated;
  } else {
    boards.push(updated);
  }

  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_BOARDS, JSON.stringify(boards));
  } catch {
    throw new Error('Failed to save board — localStorage may be full');
  }
}

/** Load all custom boards from localStorage. */
export function loadLocalBoards(): CustomBoard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_BOARDS);
    if (!raw) return [];
    return JSON.parse(raw) as CustomBoard[];
  } catch {
    return [];
  }
}

/** Load a single board by id — checks localStorage first, then templates. */
export async function loadBoardById(boardId: string): Promise<CustomBoard | null> {
  // Check local boards first
  const local = loadLocalBoards();
  const found = local.find(b => b.id === boardId);
  if (found) return found;

  // Check built-in template
  const base = await getBaseBoardTemplate();
  if (base.id === boardId) return base;

  return null;
}

/** Delete a custom board from localStorage. Read-only boards cannot be deleted. */
export function deleteLocalBoard(boardId: string): void {
  const boards = loadLocalBoards();
  const board = boards.find(b => b.id === boardId);
  if (board?.isReadOnly) throw new Error('Cannot delete a read-only board');

  const filtered = boards.filter(b => b.id !== boardId);
  localStorage.setItem(STORAGE_KEY_CUSTOM_BOARDS, JSON.stringify(filtered));
}

// ─── Draft persistence ────────────────────────────────────────────────────────

/** Save a board as a draft (auto-saved mid-edit). */
export function saveDraft(board: CustomBoard): void {
  try {
    const drafts = loadDrafts();
    const idx = drafts.findIndex(d => d.id === board.id);
    if (idx >= 0) {
      drafts[idx] = board;
    } else {
      drafts.push(board);
    }
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
  } catch { /* ignore storage errors in draft autosave */ }
}

export function loadDrafts(): CustomBoard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFTS);
    if (!raw) return [];
    return JSON.parse(raw) as CustomBoard[];
  } catch {
    return [];
  }
}

export function deleteDraft(boardId: string): void {
  const drafts = loadDrafts().filter(d => d.id !== boardId);
  localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
}

// ─── Import / Export ──────────────────────────────────────────────────────────

/** Serialize a board to a JSON string for download. */
export function exportBoardJson(board: CustomBoard): string {
  return JSON.stringify(board, null, 2);
}

/** Download a board as a .json file (browser only). */
export function downloadBoardJson(board: CustomBoard): void {
  const json = exportBoardJson(board);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.slug ?? board.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportBoardResult {
  success: boolean;
  board?: CustomBoard;
  errors: string[];
}

/** Parse and validate a JSON string as a CustomBoard import. */
export function importBoardJson(json: string): ImportBoardResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, errors: ['Invalid JSON: could not parse file'] };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { success: false, errors: ['Invalid board: expected a JSON object'] };
  }

  const obj = parsed as Record<string, unknown>;

  // Required field checks
  const requiredFields = ['title', 'tiles', 'totalSquares', 'rows', 'columns'] as const;
  const missing = requiredFields.filter(f => !(f in obj));
  if (missing.length > 0) {
    return { success: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
  }

  if (!Array.isArray(obj.tiles)) {
    return { success: false, errors: ['tiles must be an array'] };
  }

  // Assign a new local id to avoid collisions
  const now = Date.now();
  const board: CustomBoard = {
    id: `board-${now}-${Math.random().toString(36).slice(2, 9)}`,
    slug: slugify(String(obj.title ?? 'imported-board')),
    title: String(obj.title ?? 'Imported Board'),
    subtitle: String(obj.subtitle ?? ''),
    description: String(obj.description ?? ''),
    authorName: (obj.authorName as string | null) ?? null,
    authorPubkey: (obj.authorPubkey as string | null) ?? null,
    version: (obj.version as number) ?? 1,
    createdAt: now,
    updatedAt: now,
    sourceTemplateId: (obj.sourceTemplateId as string | null) ?? null,
    isTemplate: false,
    isReadOnly: false,
    rows: Number(obj.rows),
    columns: Number(obj.columns),
    totalSquares: Number(obj.totalSquares),
    path: 'serpentine',
    tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : [],
    tiles: (obj.tiles as CustomTile[]).map(normalizeTile),
  };

  // Run full validation
  const validation = validateBoard(board);
  const realErrors = validation.errors.filter(e => !e.message.startsWith('warning:'));
  if (realErrors.length > 0) {
    return {
      success: false,
      errors: realErrors.map(e => `${e.field}: ${e.message}`),
    };
  }

  return { success: true, board };
}

// ─── Game-engine interop ──────────────────────────────────────────────────────

/** Convert a CustomBoard to the minimal Board type used by the game engine. */
export function boardToGameBoard(custom: CustomBoard): Board {
  return {
    totalSquares: custom.totalSquares,
    tiles: custom.tiles.map(ct => ({
      number: ct.number,
      title: ct.title,
      sanskrit: ct.sanskrit,
      meaning: ct.meaning,
      reflection: ct.reflection,
      videoUrl: ct.videoUrl,
      snakeTo: ct.snakeTo,
      ladderTo: ct.ladderTo,
      tags: ct.tags,
      marketCycleLabel: ct.marketCycleLabel ?? undefined,
      interfaithReferences: ct.interfaithReferences,
      memeEncounters: ct.memeEncounters,
    } satisfies Tile)),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeTile(raw: Partial<CustomTile>): CustomTile {
  return {
    number: Number(raw.number ?? 0),
    title: String(raw.title ?? ''),
    sanskrit: String(raw.sanskrit ?? ''),
    meaning: String(raw.meaning ?? ''),
    reflection: String(raw.reflection ?? ''),
    videoUrl: raw.videoUrl ?? null,
    snakeTo: raw.snakeTo ?? null,
    ladderTo: raw.ladderTo ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    marketCycleLabel: raw.marketCycleLabel ?? null,
    interfaithReferences: Array.isArray(raw.interfaithReferences) ? raw.interfaithReferences : [],
    memeEncounters: Array.isArray(raw.memeEncounters) ? raw.memeEncounters : [],
  };
}
