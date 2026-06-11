/**
 * Custom Board model
 *
 * This is the full, rich board document used for custom boards, templates,
 * and (in future) Nostr-published boards.
 *
 * The legacy `Board` type in types/game.ts (tiles + totalSquares) remains for
 * the game engine which only needs minimal data. Use `boardToGameBoard()` in
 * src/lib/boards.ts to convert.
 */

export interface CustomTile {
  number: number;              // 1-based square number, read-only in normal use
  title: string;
  sanskrit: string;            // Alternate / sacred name (optional concept)
  meaning: string;
  reflection: string;
  videoUrl: string | null;
  snakeTo: number | null;      // Destination square if snake lands here
  ladderTo: number | null;     // Destination square if ladder starts here
  tags: string[];
  marketCycleLabel: string | null;
  interfaithReferences: CustomInterfaithReference[];
  memeEncounters: CustomMemeEncounter[];
}

export interface CustomInterfaithReference {
  tradition: string;
  reference: string;
  quote: string;
  commentary: string;
}

export interface CustomMemeEncounter {
  caption: string;
  prompt: string;
  imageUrl?: string;
  alt?: string;
  trigger?: string;
}

export interface CustomBoard {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  authorName: string | null;
  authorPubkey: string | null;   // Nostr hex pubkey of author
  version: number;               // increment on save
  createdAt: number;             // unix ms
  updatedAt: number;             // unix ms
  sourceTemplateId: string | null; // if forked from a template
  isTemplate: boolean;           // template boards are read-only
  isReadOnly: boolean;           // true for built-in boards
  rows: number;                  // default 8
  columns: number;               // default 9
  totalSquares: number;          // rows * columns, default 72
  path: 'serpentine';            // only serpentine supported for now
  tags: string[];
  tiles: CustomTile[];
}

/** Validation error returned by validateBoard() */
export interface BoardValidationError {
  field: string;       // e.g. "tiles[7].snakeTo"
  message: string;
}

export interface BoardValidationResult {
  valid: boolean;
  errors: BoardValidationError[];
}
