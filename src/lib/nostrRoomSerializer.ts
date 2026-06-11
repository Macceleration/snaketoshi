import type { EventTemplate, NostrEvent } from 'nostr-tools';
import type { GameRoom } from '@/types/room';

/**
 * NIP-78 / application-specific addressable event.
 * kind 30078 is used to store replaceable app data keyed by `d` tag.
 */
export const ROOM_EVENT_KIND = 30078;

/** Build the Nostr event template for a given GameRoom. */
export function serializeRoom(room: GameRoom): EventTemplate {
  return {
    kind: ROOM_EVENT_KIND,
    content: JSON.stringify(room),
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', room.id],
      ['code', room.code],
      ['status', room.status],
      ['board', room.boardId],
      ['t', 'snaketoshi-room'],
      ['t', 'snaketoshi'],
    ],
  };
}

/** Parse a Nostr event back into a GameRoom. Returns null on any error. */
export function deserializeRoom(event: NostrEvent): GameRoom | null {
  try {
    if (event.kind !== ROOM_EVENT_KIND) return null;
    const room = JSON.parse(event.content) as GameRoom;
    if (!room.id || !room.code || !room.status) return null;
    return room;
  } catch {
    return null;
  }
}

/** REQ filter to fetch the latest state of a single room by ID. */
export function roomFilter(roomId: string) {
  return { kinds: [ROOM_EVENT_KIND], '#d': [roomId], limit: 1 };
}

/** REQ filter to find a room by its short join code. */
export function roomCodeFilter(code: string) {
  return { kinds: [ROOM_EVENT_KIND], '#code': [code], limit: 5 };
}
