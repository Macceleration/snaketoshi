/**
 * Nostr board event helpers (preparation for future publishing sprint)
 *
 * Uses NIP-78 kind 30078 addressable events.
 * Publishing is wired but gated behind a UI "coming soon" label.
 */

import type { CustomBoard } from '@/types/board';

export const BOARD_EVENT_KIND = 30078;

/** The `d` tag value for a board event: "snaketoshi:board:<slug>" */
export function boardDTag(board: CustomBoard): string {
  return `snaketoshi:board:${board.slug}`;
}

/** Build an unsigned Nostr event template for publishing a board. */
export function buildBoardNostrEvent(board: CustomBoard): {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
} {
  return {
    kind: BOARD_EVENT_KIND,
    content: JSON.stringify(board),
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', boardDTag(board)],
      ['title', board.title],
      ['t', 'snaketoshi'],
      ['t', 'snaketoshi-board'],
      ['t', 'mokshapatam'],
      ...(board.tags ?? []).map(tag => ['t', tag]),
    ],
  };
}

/** Parse a Nostr event content field back into a CustomBoard. Returns null on error. */
export function parseBoardNostrEvent(event: {
  kind: number;
  content: string;
  pubkey: string;
  tags: string[][];
}): CustomBoard | null {
  try {
    if (event.kind !== BOARD_EVENT_KIND) return null;
    const board = JSON.parse(event.content) as CustomBoard;
    if (!board.id || !board.title || !Array.isArray(board.tiles)) return null;

    // Attach the Nostr pubkey as authorPubkey if not already set
    if (!board.authorPubkey) {
      board.authorPubkey = event.pubkey;
    }

    return board;
  } catch {
    return null;
  }
}
