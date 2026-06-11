import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBlankBoard,
  cloneBoard,
  validateBoard,
  saveBoardLocal,
  loadLocalBoards,
  loadBoardById,
  deleteLocalBoard,
  exportBoardJson,
  importBoardJson,
  boardToGameBoard,
  STORAGE_KEY_CUSTOM_BOARDS,
} from './boards';
import type { CustomBoard } from '@/types/board';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBoard(overrides: Partial<CustomBoard> = {}): CustomBoard {
  return {
    ...createBlankBoard({ title: 'Test Board' }),
    ...overrides,
  };
}

// ─── createBlankBoard ─────────────────────────────────────────────────────────

describe('createBlankBoard', () => {
  it('creates exactly 72 tiles by default', () => {
    const board = createBlankBoard();
    expect(board.tiles).toHaveLength(72);
  });

  it('numbers tiles sequentially from 1', () => {
    const board = createBlankBoard();
    board.tiles.forEach((tile, i) => {
      expect(tile.number).toBe(i + 1);
    });
  });

  it('has 8 rows and 9 columns by default', () => {
    const board = createBlankBoard();
    expect(board.rows).toBe(8);
    expect(board.columns).toBe(9);
    expect(board.totalSquares).toBe(72);
  });

  it('applies provided title', () => {
    const board = createBlankBoard({ title: 'My Custom Map' });
    expect(board.title).toBe('My Custom Map');
  });

  it('sets isTemplate and isReadOnly to false', () => {
    const board = createBlankBoard();
    expect(board.isTemplate).toBe(false);
    expect(board.isReadOnly).toBe(false);
  });

  it('all tiles have empty snakeTo and ladderTo', () => {
    const board = createBlankBoard();
    board.tiles.forEach(tile => {
      expect(tile.snakeTo).toBeNull();
      expect(tile.ladderTo).toBeNull();
    });
  });

  it('all tiles have empty interfaithReferences and memeEncounters arrays', () => {
    const board = createBlankBoard();
    board.tiles.forEach(tile => {
      expect(tile.interfaithReferences).toEqual([]);
      expect(tile.memeEncounters).toEqual([]);
    });
  });

  it('generates unique ids on successive calls', () => {
    const a = createBlankBoard();
    const b = createBlankBoard();
    expect(a.id).not.toBe(b.id);
  });
});

// ─── cloneBoard ───────────────────────────────────────────────────────────────

describe('cloneBoard', () => {
  it('does not mutate the template', () => {
    const template = makeBoard({ title: 'Original', isReadOnly: true });
    const original_title = template.title;
    cloneBoard(template, { title: 'Fork' });
    expect(template.title).toBe(original_title);
  });

  it('returns a new id different from the template', () => {
    const template = makeBoard();
    const fork = cloneBoard(template);
    expect(fork.id).not.toBe(template.id);
  });

  it('sets sourceTemplateId to the original id', () => {
    const template = makeBoard({ id: 'snaketoshi-base' });
    const fork = cloneBoard(template);
    expect(fork.sourceTemplateId).toBe('snaketoshi-base');
  });

  it('overrides title when provided', () => {
    const template = makeBoard({ title: 'Base' });
    const fork = cloneBoard(template, { title: 'My Fork' });
    expect(fork.title).toBe('My Fork');
  });

  it('sets isReadOnly and isTemplate to false', () => {
    const template = makeBoard({ isTemplate: true, isReadOnly: true });
    const fork = cloneBoard(template);
    expect(fork.isReadOnly).toBe(false);
    expect(fork.isTemplate).toBe(false);
  });

  it('deep-clones tiles so editing the fork does not affect the template', () => {
    const template = makeBoard();
    const fork = cloneBoard(template);
    fork.tiles[0].title = 'MODIFIED';
    expect(template.tiles[0].title).not.toBe('MODIFIED');
  });

  it('preserves all 72 tiles', () => {
    const template = makeBoard();
    const fork = cloneBoard(template);
    expect(fork.tiles).toHaveLength(72);
  });
});

// ─── validateBoard ────────────────────────────────────────────────────────────

describe('validateBoard', () => {
  it('passes a valid blank board', () => {
    const board = createBlankBoard({ title: 'Valid' });
    // Blank boards have placeholder titles like "Square 1" which are non-empty
    const result = validateBoard(board);
    const realErrors = result.errors.filter(e => !e.message.startsWith('warning:'));
    expect(realErrors).toHaveLength(0);
  });

  it('fails when board title is empty', () => {
    const board = createBlankBoard();
    board.title = '';
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'title')).toBe(true);
  });

  it('fails when snakeTo is out of range (too high)', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[5].snakeTo = 99; // > 72
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field.includes('snakeTo'))).toBe(true);
  });

  it('fails when snakeTo is out of range (0)', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[5].snakeTo = 0;
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
  });

  it('fails when ladderTo is out of range', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[5].ladderTo = 100;
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
  });

  it('fails when snake/ladder points to itself', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[5].snakeTo = 6; // tile number is 6
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('itself'))).toBe(true);
  });

  it('warns (but does not fail) when snake destination is higher than tile', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[2].snakeTo = 10; // tile 3, snake goes UP — warning only
    const result = validateBoard(board);
    const realErrors = result.errors.filter(e => !e.message.startsWith('warning:'));
    expect(realErrors).toHaveLength(0); // valid
    expect(result.errors.some(e => e.message.startsWith('warning:'))).toBe(true);
  });

  it('warns (but does not fail) when ladder destination is lower than tile', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles[20].ladderTo = 5; // tile 21, ladder goes DOWN — warning only
    const result = validateBoard(board);
    const realErrors = result.errors.filter(e => !e.message.startsWith('warning:'));
    expect(realErrors).toHaveLength(0);
    expect(result.errors.some(e => e.message.startsWith('warning:'))).toBe(true);
  });

  it('fails when tile count does not match totalSquares', () => {
    const board = createBlankBoard({ title: 'Test' });
    board.tiles = board.tiles.slice(0, 10); // only 10 tiles
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'tiles')).toBe(true);
  });
});

// ─── save / load local boards ─────────────────────────────────────────────────

describe('saveBoardLocal / loadLocalBoards', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_BOARDS);
  });

  it('saves and retrieves a board', () => {
    const board = createBlankBoard({ title: 'Saved Board' });
    saveBoardLocal(board);
    const boards = loadLocalBoards();
    expect(boards.some(b => b.id === board.id)).toBe(true);
  });

  it('updates an existing board on re-save', () => {
    const board = createBlankBoard({ title: 'Original' });
    saveBoardLocal(board);
    const updated = { ...board, title: 'Updated' };
    saveBoardLocal(updated);
    const boards = loadLocalBoards();
    const found = boards.find(b => b.id === board.id);
    expect(found?.title).toBe('Updated');
    expect(boards.filter(b => b.id === board.id)).toHaveLength(1); // no duplicates
  });

  it('throws when trying to save a read-only board', () => {
    const board = makeBoard({ isReadOnly: true });
    expect(() => saveBoardLocal(board)).toThrow();
  });

  it('returns empty array when storage is empty', () => {
    expect(loadLocalBoards()).toEqual([]);
  });
});

// ─── deleteLocalBoard ─────────────────────────────────────────────────────────

describe('deleteLocalBoard', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_BOARDS);
  });

  it('removes a board by id', () => {
    const board = createBlankBoard({ title: 'To Delete' });
    saveBoardLocal(board);
    deleteLocalBoard(board.id);
    const boards = loadLocalBoards();
    expect(boards.some(b => b.id === board.id)).toBe(false);
  });

  it('throws when trying to delete a read-only board', () => {
    const board = makeBoard({ isReadOnly: true });
    saveBoardLocal({ ...board, isReadOnly: false }); // save writeable version first
    // Mutate to read-only in storage manually
    const boards = loadLocalBoards();
    const found = boards.find(b => b.id === board.id)!;
    found.isReadOnly = true;
    localStorage.setItem(STORAGE_KEY_CUSTOM_BOARDS, JSON.stringify(boards));

    expect(() => deleteLocalBoard(board.id)).toThrow();
  });
});

// ─── loadBoardById ────────────────────────────────────────────────────────────

describe('loadBoardById', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_BOARDS);
  });

  it('returns null for a non-existent id', async () => {
    const result = await loadBoardById('does-not-exist');
    expect(result).toBeNull();
  });

  it('returns a saved board by id', async () => {
    const board = createBlankBoard({ title: 'Findable' });
    saveBoardLocal(board);
    const found = await loadBoardById(board.id);
    expect(found?.id).toBe(board.id);
  });

  it('returns the base template board by id', async () => {
    const found = await loadBoardById('snaketoshi-base');
    expect(found).not.toBeNull();
    expect(found?.isReadOnly).toBe(true);
    expect(found?.tiles).toHaveLength(72);
  });
});

// ─── importBoardJson ──────────────────────────────────────────────────────────

describe('importBoardJson', () => {
  it('fails gracefully on invalid JSON', () => {
    const result = importBoardJson('not-json{{{');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('JSON');
  });

  it('fails on valid JSON that is not an object', () => {
    const result = importBoardJson('[1, 2, 3]');
    expect(result.success).toBe(false);
  });

  it('fails when required fields are missing', () => {
    const result = importBoardJson(JSON.stringify({ title: 'No tiles here' }));
    expect(result.success).toBe(false);
    expect(result.errors.some(e => e.includes('tiles'))).toBe(true);
  });

  it('succeeds with a valid exported board', () => {
    const board = createBlankBoard({ title: 'Exportable' });
    const json = exportBoardJson(board);
    const result = importBoardJson(json);
    expect(result.success).toBe(true);
    expect(result.board).toBeDefined();
    expect(result.board?.title).toBe('Exportable');
  });

  it('assigns a new id to the imported board', () => {
    const board = createBlankBoard({ title: 'Imported' });
    const json = exportBoardJson(board);
    const result = importBoardJson(json);
    expect(result.board?.id).not.toBe(board.id);
  });

  it('forces isReadOnly to false on import', () => {
    const board = createBlankBoard({ title: 'Forced' });
    const json = exportBoardJson({ ...board, isReadOnly: true });
    const result = importBoardJson(json);
    expect(result.board?.isReadOnly).toBe(false);
  });
});

// ─── boardToGameBoard ─────────────────────────────────────────────────────────

describe('boardToGameBoard', () => {
  it('converts a CustomBoard to the game engine Board shape', () => {
    const custom = createBlankBoard({ title: 'Game' });
    const gameBoard = boardToGameBoard(custom);
    expect(gameBoard.totalSquares).toBe(72);
    expect(gameBoard.tiles).toHaveLength(72);
    expect(gameBoard.tiles[0].number).toBe(1);
  });

  it('maps snakeTo / ladderTo correctly', () => {
    const custom = createBlankBoard({ title: 'Transitions' });
    custom.tiles[3].snakeTo = 1;
    custom.tiles[9].ladderTo = 23;
    const gameBoard = boardToGameBoard(custom);
    expect(gameBoard.tiles[3].snakeTo).toBe(1);
    expect(gameBoard.tiles[9].ladderTo).toBe(23);
  });
});
